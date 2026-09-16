# US-08 — Submit an accessibility report: Design

**Story:** US-08 Submit report · **Epic:** E4 · **Estimate:** 5 pts · **Owner:** M1 (Pasindu Lanka)
**ClickUp:** `z8v0kmrg21` · **Sprint 3** (07/09/2026 – 18/09/2026)
**Branch:** `feature/us-08-submit-an-accessibility-report` (from `main`)

## Context

`reports` already exists in `packages/backend/convex/schema.ts` with every field
US-08 needs — `placeId`, `authorId`, `taxonomyVersion`, `attributes[]`,
`summary?`, `evidence[]`, `observedAt`, `status`, `updatedAt`. No migration is
required. What does not exist is anything that _writes_ a report from the app:
there is no `convex/reports.ts`, no `submitReport` mutation, and the
contribution CTA on the place detail screen is a no-op.

`convex/seed.ts` contains a private `seedDemoReports` helper, but it is a
development seeding tool with no auth check and no validation. It is not a
substitute for a real, user-facing, validated write path.

The PRD acceptance criteria (`docs/PRD-wayble.md:163`) are:

> `submitReport` with validators, author from `getAuthUserId` (never
> client-supplied) · duplicate guard: same user + same place within 24h
> rejected in the mutation · multi-step form: category → attributes → notes →
> confirm · optimistic update via `useMutation().withOptimisticUpdate` with
> rollback + announced error on failure · test covers the duplicate rejection.

The DoD (`PRD:183`) additionally requires that every new mutation checks auth
via `getAuthUserId`, because Convex functions are public endpoints by default —
a mutation without an auth check is callable by anyone holding the deployment
URL (`PRD:185`).

### Resolved ambiguities

The ClickUp subtask text and the PRD leave four things underspecified. Each was
resolved deliberately; the reasoning is recorded here so a reviewer does not
have to re-derive it.

**1. "Step 1: Category" means an attribute-group picker, not a place category.**
The repo has three distinct "category" systems: report attribute keys
(`mobility.*`, `vision.*`, …), `places.category` (the business type), and
`places.accessibilityCategories` (map pin colour only). `reports` has no
category field, and the user reaches this form from a specific place's detail
screen — asking them to re-select the business type would be asking them to
re-read information already on screen. Step 1 therefore picks which of the six
attribute _groups_ to report on, narrowing Step 2 from 19 keys to at most 7.
This satisfies the EDI "one task per step" claim (`PRD:202`) and needs no
schema change. `CATEGORY_DISPLAY_ORDER` and `ATTRIBUTE_KEYS_BY_CATEGORY`
already exist in `apps/mobile/constants/accessibility-metadata.ts`.

**2. "notes" is split across two fields that already exist.** Step 2 allows an
inline note per attribute (`attributes[i].note`), which is what satisfies
`S0-5:207` ("require a note for `partial`"). Step 3 is a single overall
`summary` box. A third "notes" field would require a schema change and a
migration this repo has no tooling for.

**3. The 24-hour guard gets a new compound index.** `reports` currently has
`by_place` and `by_author` as separate indexes, so neither can answer "this
user's most recent report for this place" in one indexed read. Reusing
`by_author` and filtering in JS would be an unbounded scan of one user's
reports, which cuts against an explicit ethos in `convex/notifications.ts:31`
(every scan there is capped). `.index("by_place_and_author", ["placeId",
"authorId"])` is additive and needs no data migration.

**4. The form is a top-level route, not a modal.** `app/place/[id].tsx` cannot
host a nested `report` route without restructuring `place/[id].tsx` into a
directory, and `/place/report` would be swallowed by the existing `/place/[id]`
dynamic segment. A modal was rejected because a four-step wizard in a modal is
cramped, is not deep-linkable, and makes Android back / swipe-to-dismiss
ambiguous with a half-filled draft.

### One deliberate deviation from precedent

`convex/notifications.ts` exposes `sweep({ now: v.optional(v.number()) })`
specifically so time-dependent rules are testable, and `sweep.test.ts` injects a
fixed clock. `submitReport` deliberately does **not** take a `now` argument: a
client-settable clock is a direct bypass of the 24-hour guard, which is an
abuse-prevention control (`PRD:222`). The handler uses the real `Date.now()`.
The guard remains fully testable because the test controls the _existing_
report's `updatedAt` by inserting it directly via `ctx.db.insert` — insert one
with `updatedAt: Date.now() - 1000` and the guard fires; insert one with
`updatedAt: Date.now() - 25h` and it does not. `observedAt` cannot drive that
lever: the guard keys on the server-written `updatedAt` precisely because
`observedAt` is client-supplied and the skew guard above accepts values up to a
year old, so a caller could otherwise back-date its way out of the window.

## Architecture

```
app/place/[id].tsx ──onContribute──> router.push("/report/[placeId]")
                                          │
app/report/[placeId].tsx  ──useMutation──> api.reports.submitReport
   4 steps, local state only                 │
   until final submit                        ├─ getAuthUserId(ctx)      → auth gate
                                             ├─ Convex validators       → shape gate
                                             ├─ assertNoDuplicateKeys / length caps / clock skew → rule gate
                                             ├─ by_place_and_author     → 24h duplicate guard
                                             └─ ctx.db.insert("reports", …)
```

The wizard holds `group → attributes[] → summary` in local `useState` and
writes nothing until the final Confirm step. One mutation call, one network
round trip, one place to reason about failure.

## Changes

### 1. Backend — schema

`packages/backend/convex/schema.ts`, one line added to the `reports` table:

```ts
reports: defineTable({
  /* … unchanged … */
})
  .index("by_place", ["placeId"])
  .index("by_author", ["authorId"])
  .index("by_place_and_author", ["placeId", "authorId"]),
```

Additive; no existing document is touched. `docs/traceability.md` and the
S0-5 index list need updating to match — S0-5 recorded only `by_place` and
`by_author`.

### 2. Backend — `convex/reports.ts` (new)

A single mutation, `submitReport`. Arguments:

| Arg          | Type                                       | Notes                                   |
| ------------ | ------------------------------------------ | --------------------------------------- |
| `placeId`    | `v.id("places")`                           | must resolve to an existing place       |
| `attributes` | `v.array(accessibilityAttributeValidator)` | non-empty, no duplicate keys            |
| `summary`    | `v.optional(v.string())`                   | ≤ 500 characters                        |
| `observedAt` | `v.number()`                               | client's observation time, skew-checked |

There is deliberately **no** `authorId` argument. The author is taken only from
`await getAuthUserId(ctx)`, per `PRD:163`.

Guard order — cheapest and most security-relevant first:

| #   | Guard             | Rule                                                           | Error string                                                                |
| --- | ----------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Auth              | `getAuthUserId(ctx)` is non-null                               | `Unauthenticated: must be logged in to submit a report`                     |
| 2   | Place exists      | `ctx.db.get(args.placeId)`                                     | `Unknown place: ${args.placeId}`                                            |
| 3   | Non-empty         | `attributes.length > 0`                                        | `Add at least one accessibility attribute`                                  |
| 4   | No duplicate keys | see below                                                      | `Duplicate accessibility attribute: ${key}`                                 |
| 5   | Summary cap       | `summary.length <= 500`                                        | `Summary too long: ${n} characters, maximum 500`                            |
| 6   | Note cap          | each `attribute.note.length <= 280`                            | `Note too long: ${n} characters, maximum 280`                               |
| 7   | Clock skew        | `Number.isFinite(observedAt)`, `<= now + 5min`, `>= now - 1yr` | `Observation time is outside the allowed range`                             |
| 8   | 24h duplicate     | indexed read, any `updatedAt > now - 24h`                      | `Duplicate report: you already reported on this place in the last 24 hours` |

Guard 4 mirrors `assertNoDuplicateNeeds` in `convex/users.ts:67` — same
`Set`-based shape, same error-string convention, since `S0-5:143` makes it an
invariant of the table. The wizard reducer also keys attributes by
`AccessibilityAttributeKey`, so a well-behaved client cannot produce a
duplicate; guard 4 is defence-in-depth against a crafted request, not the
primary mechanism. Guard 7 satisfies both `S0-5:143` and the ClickUp subtask's
"validate … timestamp".

Guard 8 uses the new compound index:

```ts
const cutoff = now - DUPLICATE_WINDOW_MS;
const recent = await ctx.db
  .query("reports")
  .withIndex("by_place_and_author", (q) =>
    q.eq("placeId", args.placeId).eq("authorId", userId),
  )
  .filter((q) =>
    q.and(
      q.eq(q.field("status"), "active"),
      q.gt(q.field("updatedAt"), cutoff),
    ),
  )
  .first();
if (recent) throw new Error(DUPLICATE_MESSAGE);
```

Two things about the `.filter()` form itself are load-bearing rather than
stylistic.

`.filter()` hands its predicate a **`FilterBuilder`**, not a document. A
document-shaped predicate — `.filter((r) => r.status === "active")` — does not
degrade quietly: `r.status` on a `FilterBuilder` is a `TS2339` compile error, and
because Vitest does not type-check, a test run would transpile it to a predicate
that matches nothing and the guard would fail **open**, admitting every duplicate.
The conditions are therefore built from the builder and returned.

The window keys on `updatedAt`, the server clock value written at insert time,
**not** `observedAt`. `observedAt` is client-supplied and guard 7 accepts it up
to a year old, so a window keyed on it could be stepped over: a caller submits
once with `observedAt: Date.now() - 25h` and then files again, and both land
outside a 24-hour window measured on that field. `updatedAt` is required by the
schema and written by this handler, so no argument can move it.

Only `active` reports count toward the guard, so a removed or superseded report
does not block a legitimate resubmission.

The guard's atomicity is Convex's, not the schema's: mutations run in
serializable transactions that retry automatically on conflict, so a submission
that loses the race re-reads and is rejected. Convex has no unique indexes, so
nothing in `schema.ts` enforces this — splitting the guard into its own function,
or moving it onto `by_author`, would lose the protection silently.

The inserted document:

```ts
await ctx.db.insert("reports", {
  placeId: args.placeId,
  authorId: userId,
  taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
  attributes: args.attributes,
  summary: args.summary,
  evidence: [], // S3-2 (US-09) attaches photo evidence
  observedAt: args.observedAt,
  status: "active",
  updatedAt: now,
});
```

The mutation returns the created report document, matching the precedent of
`users.updateProfile` returning `ctx.db.get(userId)`.

`reports.ts` exports no label or copy maps. `convex/notificationCopy.ts:4`
already documents why presentation text cannot live on the backend; adding a
third label map would violate that.

### 3. Backend — `convex/reports.test.ts` (new)

Mirrors `convex/users.test.ts`: `import.meta.glob("./**/*.*s")`, `seedUser`
and `seedPlace` helpers that insert via `t.run` + `ctx.db.insert`, and
`t.withIdentity({ subject: userId })` for the authenticated path. No
`geospatialTest.register` — `submitReport` performs no geo writes. Note
`noUncheckedIndexedAccess: true`, so assertions use `results[0]?.field`.

Test cases:

1. Rejects an unauthenticated caller
2. Persists every field and derives `authorId` from the session, not args
3. Rejects a second report for the same place inside 24 hours
4. Allows a report once the previous one is older than 24 hours (boundary:
   24h + 1 min)
5. Ignores a removed prior report when applying the 24-hour guard
6. Rejects duplicate attribute keys
7. Rejects an empty `attributes` array
8. Rejects a summary over 500 characters
9. Rejects a per-attribute note over 280 characters
10. Rejects an `observedAt` beyond the forward clock-skew tolerance
11. Rejects an unknown `placeId`

### 4. Mobile — new files

| File                                               | Purpose                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/report/[placeId].tsx`             | The four-step route. Owns step state and the mutation. Registered in `app/_layout.tsx`.                           |
| `apps/mobile/components/report/report-draft.ts`    | Pure types + reducer for wizard state. No React, so it is unit-testable without a renderer.                       |
| `apps/mobile/components/report/StepIndicator.tsx`  | "Step 2 of 4 — Attributes", `accessibilityRole="progressbar"` with `accessibilityValue`.                          |
| `apps/mobile/components/report/CategoryStep.tsx`   | Step 1: six group pills from `CATEGORY_DISPLAY_ORDER` / `ATTRIBUTE_KEYS_BY_CATEGORY`.                             |
| `apps/mobile/components/report/AttributesStep.tsx` | Step 2: per key, a value segmented control over `VALUE_LABELS`; a note field appears when the value is not `yes`. |
| `apps/mobile/components/report/NotesStep.tsx`      | Step 3: one `summary` box, `maxLength={500}`, live remaining-character counter.                                   |
| `apps/mobile/components/report/ConfirmStep.tsx`    | Step 4: read-only recap of group, each attribute with value and note, and the summary. Owns the submit button.    |

Reuses existing primitives only — `Screen`, `AppText`, `TouchTarget`,
`CheckboxRow`, `ATTRIBUTE_METADATA`, `ATTRIBUTE_ICON_EMOJI`, `VALUE_LABELS`,
`VALUE_SEMANTIC_COLORS`, and the theme tokens. No new dependencies and no new
label maps. The obsolete nine-value vocabulary in `PRD:103` (`ramp`,
`accessible WC`, …) is not introduced anywhere; the 19-key taxonomy in
`convex/accessibility.ts` is canonical.

Step 2 enforces the `S0-5:207` rule in the UI: a key set to `partial` blocks
"Next" until its note is non-empty. This is deliberately a UI gate rather than a
server rejection — see "Deliberately out of scope" for why.

Accessibility conventions, matching the rest of the app: `TouchTarget` for
every control (44pt minimum enforced), never icon-only, `accessibilityRole` on
interactive elements, and `AccessibilityInfo.announceForAccessibility` on every
step transition and error.

### 5. Mobile — wiring the existing stub

`apps/mobile/app/place/[id].tsx:166` currently reads:

```tsx
<NoDataPrompt
  onContribute={() => {
    // Placeholder — will navigate to report submission in a future story
  }}
/>
```

becomes:

```tsx
<NoDataPrompt
  onContribute={() =>
    router.push({ pathname: "/report/[placeId]", params: { placeId: id } })
  }
/>
```

### 6. Mobile — optimistic update and rollback

The optimistic target is `api.places.getPlace` for the same `placeId`. It is
already cached by `app/place/[id].tsx:31-34`, so `localStore.getQuery` will
hit, and after `router.back()` the place detail the user returns to already
shows their report.

`getPlace` aggregates with last-write-wins on `observedAt` and counts _reports_
(not attributes) in `reportCount`, so the optimistic patch must mirror that:

```ts
const submitReport = useMutation(api.reports.submitReport).withOptimisticUpdate(
  (localStore, args) => {
    const place = localStore.getQuery(api.places.getPlace, {
      placeId: args.placeId,
    });
    if (!place) return;

    const merged = new Map(place.attributes.map((a) => [a.key, a]));
    for (const attr of args.attributes) merged.set(attr.key, attr);

    localStore.setQuery(
      api.places.getPlace,
      { placeId: args.placeId },
      {
        ...place,
        attributes: Array.from(merged.values()),
        reportCount: place.reportCount + 1,
        lastReportedAt: Math.max(place.lastReportedAt ?? 0, args.observedAt),
      },
    );
  },
);
```

Because the user's own report has the newest `observedAt` by construction, a
plain overwrite of each key is equivalent to the server's last-write-wins
merge for this mutation.

Rollback is Convex's automatic revert on mutation failure. The error surface is
the established six lines from `accessibility-needs.tsx:97`–`102` — `setError` plus
`announceForAccessibility` with the same string, rendered in an
`accessibilityRole="alert"` banner. On success the route calls `router.back()`.

### 7. Mobile — error surfacing

Server error strings are developer-facing. The client maps them to plain
language before display, per the EDI "plain language" claim (`PRD:202`):

| Server message contains | User sees                                                                        |
| ----------------------- | -------------------------------------------------------------------------------- |
| `Duplicate report:`     | "You already reported on this place today. You can add another report tomorrow." |
| `Unauthenticated:`      | "Sign in to submit a report." plus a sign-in action                              |
| `Summary too long:`     | "Keep your summary under 500 characters."                                        |
| anything else           | "Couldn't submit your report. Check your connection and try again."              |

The mapping lives on the client. No server-side user-facing copy is added.

## File Summary

| Layer   | File                                               | Action     | Description                                                                                                     |
| ------- | -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Backend | `packages/backend/convex/schema.ts`                | Modify     | Add `by_place_and_author` index to `reports`                                                                    |
| Backend | `packages/backend/convex/reports.ts`               | Create     | `submitReport` mutation with all eight guards                                                                   |
| Backend | `packages/backend/convex/reports.test.ts`          | Create     | 11 `convex-test` cases                                                                                          |
| Backend | `packages/backend/convex/_generated/*`             | Regenerate | `bun run --filter @packages/backend codegen` — `_generated` is committed, so this diff belongs in the PR        |
| Mobile  | `apps/mobile/app/report/[placeId].tsx`             | Create     | Four-step wizard route                                                                                          |
| Mobile  | `apps/mobile/app/_layout.tsx`                      | Modify     | Register the new top-level route                                                                                |
| Mobile  | `apps/mobile/app/place/[id].tsx`                   | Modify     | Wire the `onContribute` stub                                                                                    |
| Mobile  | `apps/mobile/components/report/report-draft.ts`    | Create     | Pure wizard state reducer                                                                                       |
| Mobile  | `apps/mobile/components/report/StepIndicator.tsx`  | Create     | Step progress header                                                                                            |
| Mobile  | `apps/mobile/components/report/CategoryStep.tsx`   | Create     | Step 1                                                                                                          |
| Mobile  | `apps/mobile/components/report/AttributesStep.tsx` | Create     | Step 2                                                                                                          |
| Mobile  | `apps/mobile/components/report/NotesStep.tsx`      | Create     | Step 3                                                                                                          |
| Mobile  | `apps/mobile/components/report/ConfirmStep.tsx`    | Create     | Step 4                                                                                                          |
| Mobile  | `apps/mobile/tsconfig.json`                        | Regenerate | `npx expo customize tsconfig.json` — required because `typedRoutes: true`, and CI does this before typechecking |
| Docs    | `docs/traceability.md`                             | Create     | Does not exist yet. Create it with the US-08 row from `PRD:260` plus the new `by_place_and_author` index.       |

## Verification

### Automated

```
bun run --filter @packages/backend codegen
cd packages/backend && bunx vitest run reports.test.ts
cd packages/backend && bunx vitest run          # full suite, no regressions
cd apps/mobile && npx expo customize tsconfig.json
bun run check-types
bun run lint
bun run format:check
```

### Manual

`apps/mobile` has no test runner, no jest, and no React Native Testing Library.
This is a pre-existing gap already documented in
`docs/plans/US-02-set-my-accessibility-needs-in-my-profile.md`. Screen-level
coverage is therefore an explicit manual checklist:

- [ ] Signed-out user sees "Sign in to submit a report" with a working sign-in action
- [ ] Signed-in user reaches the form from the place detail CTA
- [ ] Steps 1→2→3→4 advance and the step indicator reads correctly at each step
- [ ] Step 2 blocks "Next" while a `partial` attribute has an empty note
- [ ] Submitting succeeds and returns to the place detail already showing the new attributes
- [ ] A second submission within 24 hours shows the plain-language duplicate message
- [ ] Offline submit reverts the optimistic patch and announces the failure
- [ ] VoiceOver and TalkBack announce each step transition and each value change
- [ ] Hardware back moves back one step, then leaves the form
- [ ] Light and dark mode both legible on all four steps
- [ ] 200% font scale causes no clipping (WCAG 1.4.4)
- [ ] All touch targets ≥ 44×44 dp (WCAG 2.5.8)

### Known gaps

- No mobile test infrastructure exists, so the four wizard components have no
  automated coverage. Adding jest + RNTL is a separate story.
- `docs/traceability.md` does not exist yet; the PRD's §9 starter table is the
  only current source. S4-6 subtask `z8v0kmrj4y` owns completing it.
- ADR-001 and ADR-002 are referenced throughout the PRD but are not present as
  files in this repository. S4-6 subtask `z8v0kmrj56` owns resolving that.

## Deliberately out of scope

- **Photo evidence** — S3-2 / US-09. `evidence: []` is written empty.
- **Verification** — S3-3 / US-10.
- **Confidence scoring** — S3-4 / US-11.
- **Flagging** — S3-6 / US-13.
- **Live activity feed** — S3-7 / US-23.
- **Superseding a prior report.** A user may report the same place again after
  24 hours, and both rows stay `active`. `getPlace`'s last-write-wins on
  `observedAt` already resolves the display correctly, so supersede logic would
  be unused code. The `superseded` status exists for the moderation path.
- **Server-side rejection of a `partial` attribute with no note.** `S0-5:207`
  says "require a note for `partial`", but `attributes[i].note` is
  `v.optional(v.string())` in the schema and existing seeded reports may lack
  one. Enforcing it in the mutation would mean discarding a user's entire
  report — including their other valid observations — over a skipped text box,
  which is hostile in an app used by people who may be in a hurry or
  navigating with a mobility aid. The Step 2 UI gate prevents the situation
  for real users while keeping the data model permissive.
- **A `now` injection argument** — see "One deliberate deviation from
  precedent".
