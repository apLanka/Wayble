# US-13 — Flag an inaccurate or abusive entry

**Sprint:** 3 (S3-6) · **ClickUp:** z8v0kmrg26 · **Window:** 2026-09-12 → 2026-09-18
**Related:** US-08 (submit a report) · US-10 (verify a report) · US-14 moderator queue (S4-7)

---

## Problem

A signed-in user has no way to flag a report as inaccurate, abusive, spam, duplicate, or a privacy
issue. This ticket adds that write path only: insert a `flags` row with `status: "open"` and stop.

## Non-goals

Explicitly out of scope, not silently absorbed:

- Moderation queue, resolve/dismiss mutations, role gating — **S4-7 / US-14**.
- Any visible flag count or status change on the flagged report itself — also US-14.
- A `myFlagStatus` query field, or any pre-disabled flag-button state derived from it.

## Decisions

| Decision               | Choice                                                           | Why                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Self-flagging          | Blocked                                                          | Mirrors US-10's self-verification block.                                                                                                 |
| One open flag per user | Read-then-branch guard on `by_report_and_author`, not upsert     | Matches `verifyReport`'s existing style; keeps a full audit trail of every flag row, including resolved/dismissed ones once US-14 lands. |
| Reason input           | 6-preset picker + conditional "other" details textarea (≤280)    | Structured data for a future moderation queue; free text only when the presets don't fit.                                                |
| Details validation     | `details` with a non-"other" reason is **rejected**, not dropped | Silent dropping hides a client bug; reject loudly instead.                                                                               |
| Flag button state      | Always enabled, no pre-disabled state                            | No `myFlagStatus` query this ticket — avoids the extra read path for a control that flips rarely.                                        |
| Entry point            | Modal `FlagReportModal.tsx`, opened from `ReportCard.tsx`        | Mirrors `EditDisplayNameModal.tsx`; keeps `reports.tsx` the owner of screen state, the modal purely presentational.                      |

---

## Backend

### `packages/backend/convex/schema.ts`

- Export `flagReasonValidator` and `flagStatusValidator` (currently module-private) so `flags.ts`
  can import them.
- Add a third index to the `flags` table: `.index("by_report_and_author", ["reportId", "authorId"])`
  (existing indexes `by_report`, `by_author` untouched).

### `packages/backend/convex/flags.ts` (new)

`flagReport` mutation. Args: `{ reportId: v.id("reports"), reason: flagReasonValidator, details: v.optional(v.string()) }`.

Guard order (exact error strings):

1. `getAuthUserId(ctx)` null → `"Unauthenticated: must be logged in to flag a report"`
2. `ctx.db.get(args.reportId)` missing → `` `Unknown report: ${args.reportId}` ``
3. `report.authorId === userId` → `"Cannot flag your own report"`
4. `args.details !== undefined && args.reason !== "other"` → `'details is only accepted when reason is "other"'`
5. `args.reason === "other" && args.details && args.details.length > MAX_NOTE_LENGTH` (reused from `reportLimits.ts`) → `` `Details too long: ${args.details.length} characters, maximum ${MAX_NOTE_LENGTH}` ``
6. Read `by_report_and_author`, filter `status === "open"` → if found, `"You already flagged this report"`
7. Insert: `status: "open"`, `updatedAt: Date.now()`, `details` kept only when `reason === "other"`; `resolvedBy`/`resolvedAt` left unwritten. Return `ctx.db.get(id)`.

No query added this ticket.

## Mobile

| File                                               | Change                                                                                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/components/place/FlagReportModal.tsx` | New. Presentational; props mirror `EditDisplayNameModal` (`visible`/`onClose`/`onSubmit`/`isSubmitting`/`error`).                                                                                              |
| `apps/mobile/components/place/ReportCard.tsx`      | Extend: add Flag `TouchTarget` next to `VerifyControl`, bubbles `onFlagPress`. Owns no state.                                                                                                                  |
| `apps/mobile/app/place/[id]/reports.tsx`           | Extend: owns which report's modal is open, the mutation call, submit handler, its own error state (separate from the vote error banner), success announcement, closes modal on success.                        |
| `apps/mobile/components/place/flag-errors.ts`      | New. `classifyFlagError` + `flagErrorMessage`, mirrors `verification-errors.ts`. Branches: `unauthenticated`, `selfFlag`, `unknownReport`, `alreadyFlagged`, `detailsNotAllowed`, `detailsTooLong`, `generic`. |

No pure-logic tally module needed.

### Accessibility

- Flag `TouchTarget` ≥44×44dp, `accessibilityRole="button"`, `accessibilityLabel="Flag this report"`.
- Modal reason options: single-select buttons, `accessibilityState={{ selected }}` (pattern already
  used by the place-wizard `AttributesStep`/`CategoryStep` chips).
- `details` textarea mounts/unmounts (not hidden) with `reason === "other"`.
- Error banner: `accessibilityRole="alert"` + `AccessibilityInfo.announceForAccessibility`.
- Success: `announceForAccessibility("Report flagged.")` after modal closes.

### Error copy

| Classification      | User-facing copy                            |
| ------------------- | ------------------------------------------- |
| `unauthenticated`   | "Sign in to flag a report."                 |
| `selfFlag`          | "You can't flag your own report."           |
| `unknownReport`     | "This report no longer exists."             |
| `alreadyFlagged`    | "You've already flagged this report."       |
| `detailsNotAllowed` | "Details are only used for \"Other\"."      |
| `detailsTooLong`    | "Please keep details under 280 characters." |
| `generic`           | "Something went wrong. Please try again."   |

### Data flow

`ReportCard` Flag tap → `reports.tsx` opens `FlagReportModal` for that report → user picks reason
(+ details if "other") → submit → `flagReport` mutation → success: close modal, announce; failure:
`classifyFlagError`, show banner, keep modal open. No optimistic update.

## Testing

- `packages/backend/convex/testing/flags.test.ts` (new; reuse `setup()`/`seedUser()`/`seedReport()`
  from `verifications.test.ts`):
  1. Unauthenticated rejected.
  2. Unknown report rejected.
  3. Self-flag rejected.
  4. Different-user flag succeeds with correct fields.
  5. Second open flag from same author on same report rejected.
  6. Second flag allowed after first flag's status patched away from `"open"` (direct `t.run` seed).
  7. Two different users can each open a flag on the same report → 2 rows.
  8. Details accepted for `"other"` within the cap.
  9. Details rejected over `MAX_NOTE_LENGTH`.
  10. Details rejected with a non-`"other"` reason.
  11. End-to-end: at least one non-"other" reason plus one "other" reason.
- Mobile: `flag-errors.test.ts` (new, table-driven, mirrors `verification-errors.test.ts`).

## Commits

1. `schema: export flag validators, add flags.by_report_and_author index`
2. `backend: add flags.flagReport mutation` (+ `flags.test.ts`)
3. `mobile: add flag-errors classifier` (+ `flag-errors.test.ts`)
4. `mobile: add FlagReportModal`
5. `mobile: wire flag entry point into ReportCard and reports screen`
6. `docs: add US-13 plan and traceability row`

No co-author trailer on any of the above six commits — standing repo constraint (see
`chore: strip-claude-coauthor` in `main`'s history).

## Verification

- `cd packages/backend && bun run test` — new `flags.test.ts` (11 cases) + existing suite green.
- `bunx turbo run lint check-types` from repo root — clean.
- Manual: sign in as report author → no flag control / self-flag rejected; sign in as different
  user → flag with each of the 6 reasons, confirm "other" reveals details field and 280 cap,
  confirm duplicate open flag is rejected with correct copy, confirm success announcement fires.
