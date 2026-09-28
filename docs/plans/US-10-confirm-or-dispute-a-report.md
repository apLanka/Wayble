# US-10 — Confirm or dispute an existing report

**Sprint:** 3 (S3-3) · **Assignee:** Pasindu Lanka · **Estimate:** 5h (understated — see [Effort](#effort))
**Status:** implemented; the automated suites are green and the manual checklist is not yet run
**Related:** US-08 (submit a report) · US-11 confidence (S3-4) · US-23 live feed (S3-7) · US-14 moderator queue (S4-7)

---

## Problem

A user can submit an accessibility report (US-08) but there is no way to confirm or dispute one.
Worse, **there is no way to see one.** The only `api.reports.*` call in the mobile app is
`submitReport`; nothing reads reports back.

`places.getPlace` returns a _flattened aggregate_ — `attributes`, `reportCount`, `lastReportedAt` —
and discards the per-key timestamps and the individual reports behind them. Both place screens show
a count and grouped attributes, never a report's author, summary, or content.

The `verifications` table already exists in the schema (`reportId`, `authorId`, `verdict`,
`note`, `updatedAt`, with `by_report_and_author`), but **no code reads or writes it.**

So the task as written assumes a read path that does not exist. This design adds it.

## Decisions

| Decision                | Choice                                             | Why                                                                     |
| ----------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Who may verify          | **Any signed-in user, except the report's author** | Peer verification, not moderation. See below.                           |
| Where the controls live | **A dedicated `/place/[id]/reports` screen**       | Keeps `app/place/[id].tsx` minimally touched, which S3-4 also edits.    |
| What a vote attaches to | **A whole report**                                 | Matches the landed schema. Keeps `agreeCount / totalVotes` unambiguous. |

### This is not admin work

Every one of the six subtasks describes a _user↔report_ relationship — "one vote per user,
changeable", "reject self-verification of your own report" — and the only gate named anywhere is
`getAuthUserId(ctx)`, i.e. session presence. No subtask mentions a role.

`users.role` already exists (`member` / `moderator` / `admin`) but **nothing in the backend reads
it**; the only write is the seed bot's `role: "admin"`. It is unused infrastructure waiting for
**S4-7 (US-14)**, which is the actual moderator task and where the role gate belongs.

The product model also requires peer verification. US-08 lets any signed-in user file a report, so
if only moderators could verify, a fresh deployment with zero moderators could never confirm
anything — and US-11's confidence score would be permanently "Unverified". Crowdsourced
accessibility data only works if the crowd can check each other's work.

### A vote attaches to a report, not an attribute

`verifications.reportId` is already the key on `main`. S3-7's subtask text says its feed shows
"verifier, **attribute**, timestamp", which reads as finer granularity. Keeping the schema as-is
means the feed shows the report's headline attribute rather than a specific one. **Flagged for
Aathika** — changing a landed table two other stories build against is not worth it for feed copy.

---

## Non-goals

Explicitly out of scope, and named so they are not silently absorbed:

- **Flagging** — S3-6 / US-13, Nishara
- **Confidence badge and scoring** — S3-4 / US-11, Nishara
- **Live activity feed** — S3-7 / US-23, Aathika
- **Moderator queue, role gates** — S4-7 / US-14, Aathika
- **Photo evidence** — S3-2 / US-09, Pasindu Janith

`forReport` and `listForPlace` are shaped so those attach without changing what ships here.

---

## Backend

### `convex/verifications.ts` (new)

The table exists; this module is the first thing to touch it.

**One prerequisite:** `verificationVerdictValidator` is declared at `schema.ts:45` as a module-private
`const`, so `verifications.ts` cannot import it. Export it (`export const`) as the first commit of
this story. Every other validator in that file is already exported, so this is an oversight rather
than a deliberate boundary.

#### `verifyReport` (mutation)

```
args: { reportId: v.id("reports"), verdict: verificationVerdict, note: v.optional(v.string()) }
```

Guards, in order — cheapest and most security-relevant first, matching the ordering convention
already used in `reports.submitReport`:

1. `getAuthUserId(ctx)` → `null` throws `Unauthenticated: must be logged in to verify a report`
2. `ctx.db.get(reportId)` → missing throws `Unknown report: <id>`
3. **Self-verification** → `report.authorId === userId` throws
   `Cannot verify your own report`
4. `note`, if present, capped at 280 characters — reusing `MAX_NOTE_LENGTH` from `reportLimits.ts`
   rather than declaring a second constant. A verification note and an attribute note are different
   things, so this is a deliberate reuse rather than a claim that they are the same limit; splitting
   it later is a one-line change if the dispute note ever needs its own cap.
5. Upsert via `by_report_and_author`: an existing row is patched (`verdict`, `note`, `updatedAt`),
   otherwise inserted. A user changing their mind must not create a second row.

Returns the stored verification.

> The self-verification guard is the whole reason this is server-side. A UI that merely hid the
> control would leave the endpoint open, and Convex functions are public URLs.

#### `forReport` (query)

```
args: { reportId: v.id("reports") }
returns: { confirmCount, disputeCount, totalVotes, myVerdict }
```

`myVerdict` is `null` when unauthenticated or when the caller has not voted.

This is the read shape **US-11 consumes** for its `(agreeCount / totalVotes)` formula. It lands on
`main` as a contract so S3-4 does not have to re-derive it.

### `convex/reports.ts` (extend)

#### `listForPlace` (query)

```
args: { placeId: v.id("places") }
```

Returns one entry per report, newest first by `observedAt`:

| Field                          | Notes                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| `_id`                          |                                                              |
| `authorId`                     | used only to decide whether to disable the control           |
| `authorDisplayName`            | `displayName` or `name` if non-blank, else `"A Wayble user"` |
| `summary`                      | optional                                                     |
| `attributes`                   | as stored                                                    |
| `observedAt`                   |                                                              |
| `confirmCount`, `disputeCount` | grouped from one pass over `verifications`                   |
| `myVerdict`                    | caller's own vote, or `null`                                 |

`updatedAt` was in this table when the design was written and is **not** in the
shipped query. Nothing reads it, so returning it would be surface with no
consumer; it is removed here rather than added to the code. `authorDisplayName`
treats an empty or whitespace-only string as absent — `updateProfile` stores a
`displayName` with no emptiness check, so a blank byline is reachable and
would otherwise be rendered to every other user.

Three deliberate choices:

- **Only `status === "active"`.** The list length must equal the `N reports` badge beside it, and
  that badge counts active reports only (`getPlace`). Filtering anywhere else would show a
  disagreement between two numbers on the same screen.
- **Display name only, never `email`.** A report is public on a place; an email address is not.
- **Counts grouped in a single pass** over `verifications`, not a read per report.

### Data flow

```
VerifyControl.onPress
  → useMutation(api.verifications.verifyReport)
      → withOptimisticUpdate: patch the listForPlace cache entry's
        confirmCount / disputeCount / myVerdict
      → server upserts one row on by_report_and_author
      → Convex pushes the new query value to every subscribed client
```

Two devices therefore converge without a refresh, which is what subtask 6's two-device demo needs.
Convex gives that for free once both screens use `useQuery` on `listForPlace`.

Optimistic patching of a _tally_ is safe in a way that US-08's attribute merge was not: the client
computes the same arithmetic the server does from the same inputs, so there is no clock or
last-write-wins subtlety to disagree about. If the mutation throws, Convex reverts the patch.

---

## Mobile

| File                                              |                                              |
| ------------------------------------------------- | -------------------------------------------- |
| `app/place/[id]/reports.tsx`                      | **new** — the screen                         |
| `app/place/[id].tsx` → `app/place/[id]/index.tsx` | **moved**, same route, one link added        |
| `components/place/ReportCard.tsx`                 | **new** — one report                         |
| `components/place/VerifyControl.tsx`              | **new** — Agree/Dispute + tally              |
| `components/place/verification-tally.ts`          | **new** — pure helpers, unit-tested          |
| `components/place/verification-errors.ts`         | **new** — error → plain language             |
| `utils/format-relative-time.ts`                   | **new** — pure, mirrors `format-distance.ts` |

The route move is mechanical and git tracks it as a rename. **S3-4's confidence badge also lands on
that file**, so Nishara should branch after this merges to avoid a textual conflict.

### `VerifyControl`

Two buttons plus the tally. The current state is shown by pressed styling **and** by
`accessibilityState={{ selected }}` — never by colour alone.

On your own report the control renders **disabled with a visible reason** ("You can't verify your
own report") rather than disappearing. A control that silently vanishes reads as a bug, and the
server rejects the attempt regardless.

The tally reads "3 confirmed · 1 disputed", or "No verifications yet" at zero. The plural is handled
at 1 versus everything else.

### Accessibility requirements

This is an accessibility product; the control has to model what it does.

- `accessibilityRole="button"` on each of Agree and Dispute, with labels that carry the **outcome**,
  not the control name: "Confirm this report", "Dispute this report"
- `accessibilityState={{ selected }}` on the button matching the caller's current vote
- The tally is a single `accessibilityRole="text"` node reading the full sentence, so a screen
  reader announces one coherent thing rather than two loose numbers
- Both buttons are `TouchTarget`, so ≥44×44 dp (WCAG 2.5.8) is inherited rather than re-implemented
- Vote changes announce via `AccessibilityInfo.announceForAccessibility`, matching US-08's wizard
- Verified by hand at 200% font scale (WCAG 1.4.4) — the two buttons plus tally must reflow, not clip

### Error handling

`verification-errors.ts` mirrors the existing `report-errors.ts` pattern — classify by substring,
return a plain-language string:

| Server message                  | User sees                                       |
| ------------------------------- | ----------------------------------------------- |
| `Unauthenticated:`              | "Sign in to confirm or dispute a report."       |
| `Cannot verify your own report` | "You can't verify your own report."             |
| `Unknown report:`               | "This report no longer exists."                 |
| anything else                   | "We couldn't save your vote. Please try again." |

## Testing

### Backend — `convex/testing/verifications.test.ts`

Follows the `convex/testing/` convention main established, reusing that directory's `setup()` helper.

1. unauthenticated caller rejected
2. unknown `reportId` rejected
3. self-verification rejected, and **no row written**
4. a second user **can** verify the same report
5. first vote inserts
6. voting again **updates** rather than inserting a second row — the key "one vote per user, changeable" assertion
7. confirm → dispute flips the tally the right way
8. `forReport` counts reflect every user's vote
9. `myVerdict` is `null` when unauthenticated
10. over-long `note` rejected

### Mobile

There is still no component test runner (`@testing-library/react-native` is not a dependency), so
the tally and error-mapping logic is extracted into pure modules — `verification-tally.ts` and
`verification-errors.ts` — and unit-tested directly. This is the same split US-08 used with
`report-draft.ts` and `report-errors.ts`, and it is why the extraction is in the design rather than
an afterthought.

`format-relative-time.ts` is pure and gets table-driven tests across its thresholds.

### Manual

Subtask 6: two devices, same account on one and a second account on the other. Vote on one, confirm
it appears on the other with no refresh. Plus the accessibility pass above.

---

## Subtask coverage

Every ClickUp subtask from S3-3, and where this design answers it:

| Subtask                                                                         | Covered by                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `z8v0kmrg2p` — `verifyReport` mutation with `getAuthUserId`                     | `verifyReport` guards 1–2                                     |
| `z8v0kmrg30` — `by_report_and_author`, one vote per user, changeable            | `verifyReport` guard 5 (upsert)                               |
| `z8v0kmrg38` — reject self-verification server-side, never silent               | `verifyReport` guard 3, plus the disabled-with-reason control |
| `z8v0kmrg3h` — `VerifyControl` with Agree/Dispute and current vote state        | `VerifyControl`, `verification-tally.ts`                      |
| `z8v0kmrj4d` — convex-test for self-verification, vote change, duplicate update | Backend tests 3, 6, 7                                         |
| `z8v0kmrj4p` — two-device demo, no refresh                                      | Data flow, Manual testing                                     |

No subtask is dropped, and none of the six required new work that the design defers.

## Risks

| Risk                                   |                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Effort is understated**              | The subtasks assume a report read path exists. It does not, so this builds a query, a screen, and a card as well. 5h is optimistic — see below.                                                                                                                                     |
| **`by_report_and_author` upsert race** | Two devices voting for the same user at once could both insert. Convex mutations are serialisable per document but the read-then-write is not atomic. Acceptable here: a duplicate would surface as a tally off by one and self-correct on the next vote. Worth a note, not a lock. |
| **Route move collides with S3-4**      | Both edit `app/place/[id]`. Sequence the branches.                                                                                                                                                                                                                                  |
| **S3-7 feed copy**                     | Says "attribute" where the schema says report. Flagged to Aathika.                                                                                                                                                                                                                  |
| **Author identity**                    | `displayName` is optional on `users`, so the fallback string will be exercised in practice.                                                                                                                                                                                         |

## Effort

The 5h estimate covers the six subtasks as written. Adding the read path — `listForPlace`, the
reports screen, `ReportCard`, the route move — is additional work that no subtask accounts for.

Two honest options: re-scope with the team so the estimate reflects the real surface, or absorb it
and ship US-10 complete. **This needs a team decision, not an implementation decision**, and is
recorded here rather than resolved in the code.

## Definition of done

Six of the eight are met by the code and the backend suite. The two that depend
on a human with a simulator are **not** ticked, because
`docs/traceability.md` still records the US-10 manual checklist as "Not yet
run" and nothing here can substitute for it.

- [x] `verifyReport` and `forReport` on `main` with the backend suite green
- [x] `listForPlace` added, and the reports list length matches the `N reports` badge
- [x] A signed-in user can confirm and dispute any report that is not their own, and change their mind
- [x] Self-verification is impossible from the client, not merely hidden
- [ ] A second user sees the first user's vote with no manual refresh — needs two clients; unticked
- [x] Author email is never present in any response
- [ ] The control passes screen reader, 200% font scale, and 44×44 dp checks — needs a device; unticked
- [x] `docs/traceability.md` gains a US-10 row linking story → function → screen → test
