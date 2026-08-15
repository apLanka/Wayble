# S4-7 Tasks — Moderator queue screen

Plan: [docs/plans/S4-7-moderator-queue-screen.md](../plans/S4-7-moderator-queue-screen.md)

## Schema

- [x] `users.role` — already present (`member | moderator | admin`, optional); no change needed

## Backend

- [x] `convex/moderation.ts` — `requireModerator` helper
- [x] `convex/moderation.ts` — `getFlaggedReports` query (moderator-gated)
- [x] `convex/moderation.ts` — `dismissFlag` mutation (moderator-gated)
- [x] `convex/_generated/api.d.ts` — register `moderation` module
- [x] `convex/testing/moderation.test.ts` — gating, listing, dismissing

## Mobile

- [x] `components/moderator/moderation-errors.ts` (+ `.test.ts`)
- [x] `components/moderator/FlaggedReportRow.tsx`
- [x] `components/moderator/ModeratorQueueScreen.tsx`
- [x] `app/moderator/index.tsx` — route

## Verification

- [x] Backend tests pass
- [x] Mobile unit tests pass
- [x] Type-check backend and mobile (no new errors)
- [x] Lint new files
