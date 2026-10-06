# S4-7 — Moderator queue screen: review & dismiss flagged reports (US-14 lite)

**Sprint:** 4 (S4-7) · **Related:** US-13 (flag a report, `flags.flagReport`) · US-14 (full moderation, out of scope)

---

## Problem

US-13 lets users flag reports, but nothing reads those flags. A moderator needs one screen that lists
flagged reports and lets them dismiss a flag that is unfounded. This is the "lite" slice of US-14:
review + dismiss only.

## Non-goals

- Resolve / remove-report actions, moderator notes, appeal flow — full US-14.
- Any change to the consumer-facing report cards or flag counts.
- Granting the moderator role from the app (done directly in the Convex dashboard for now).
- (Done) Entry point: moderators-only "Moderation queue" row on the Profile screen.
  reachable at `/moderator`. Wiring is a follow-up.

## Reconciling the ticket with the codebase

| Ticket wording                                    | What the code actually has                                             | Decision                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Add `role` to users: `'user' \| 'moderator'`      | `users.role` already exists: optional `member \| moderator \| admin`   | **No schema change.** `member` is the "user" default (absent role is treated as non-moderator). Schema stays untouched. |
| Query in `convex/flags.ts`                        | `flags.ts` exists (US-13); instruction is not to modify existing files | New file **`convex/moderation.ts`** holding both functions.                                                             |
| `dismissFlag` sets `flagged: false` on the report | Reports have no `flagged` field; flag state is `flags.status`          | "Flagged" = has ≥1 `flags` row with `status: "open"`. Dismiss sets those rows to `dismissed` (+`resolvedBy/At`).        |
| Gate on `role === 'moderator'`                    | —                                                                      | Strict `role === "moderator"` via `getAuthUserId(ctx)`; `admin` is not implicitly allowed.                              |

## Backend — `packages/backend/convex/moderation.ts` (new)

Shared helper `requireModerator(ctx)`: `getAuthUserId` null → `"Unauthenticated: must be logged in"`;
user missing or `role !== "moderator"` → `"Forbidden: moderator role required"`.

### `getFlaggedReports` (query, no args)

1. `requireModerator`.
2. Collect open flags (`flags` has no status index; filter after reading — fine at current scale, noted
   as a future `by_status` index).
3. Group by `reportId`. For each group load the report and its place; skip if either is gone.
4. Return, newest-flagged first:
   `{ reportId, placeId, placeName, summary, flagCount, reasons[] (distinct, most frequent first), details[] (≤ "other" notes), lastFlaggedAt }`.

### `dismissFlag` (mutation, args `{ reportId }`)

1. `requireModerator`; report must exist (`"Unknown report: <id>"`).
2. Patch every open flag on the report (`by_report` index): `status: "dismissed"`, `resolvedBy`,
   `resolvedAt`, `updatedAt`.
3. No open flags → `"No open flags on this report"`. Returns the number dismissed.
4. The report itself is untouched (it stays `active`).

### Generated API

`_generated/api.d.ts` gets the one-line `moderation` module entry (what `convex codegen` would emit).

## Mobile

| File                                                        | Purpose                                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/mobile/components/moderator/moderation-errors.ts`     | `classifyModerationError` + `moderationErrorMessage`; mirrors `flag-errors.ts`.        |
| `apps/mobile/components/moderator/FlaggedReportRow.tsx`     | One row: place name, summary, reason(s), flag count, Dismiss button (≥44dp).           |
| `apps/mobile/components/moderator/ModeratorQueueScreen.tsx` | The flat list screen: loading / forbidden / signed-out / empty / list states.          |
| `apps/mobile/app/moderator/index.tsx`                       | Expo Router route re-exporting the screen at `/moderator`. New file, no layout change. |

Reason labels reuse the same wording as `ReportCardMenu` (Inaccurate, Spam, Abusive, Privacy concern,
Duplicate, Other).

### Behaviour

- `useQuery(api.moderation.getFlaggedReports)` is called only once `currentUser.role === "moderator"`
  (otherwise `"skip"`), so non-moderators never trigger a throwing query.
- States: signed out → sign-in prompt; non-moderator → "Moderators only"; loading; empty
  ("No flagged reports"); list.
- Dismiss: tap → `dismissFlag`; Convex reactivity removes the row. Per-row in-flight state, inline
  `alert` banner on error, `announceForAccessibility` on success/failure.
- Accessibility: header roles, 44dp targets, button label `Dismiss flags on <place>`, row announced as one
  summary.

## Testing

- `convex/testing/moderation.test.ts` (new): unauthenticated rejected; `member` rejected; no role
  rejected; moderator sees only reported items with correct count/reasons/place name; dismissed
  reports leave the queue; dismiss sets status/resolvedBy/resolvedAt on all open flags and leaves
  already-resolved ones; dismiss with no open flags rejected; non-moderator dismiss rejected.
- `moderation-errors.test.ts` (new, table-driven).

## Commits

1. `docs: add S4-7 plan and tasks`
2. `backend: add moderation.getFlaggedReports and dismissFlag` (+ tests, api.d.ts)
3. `mobile: add moderation error classifier`
4. `mobile: add moderator queue screen and route`
