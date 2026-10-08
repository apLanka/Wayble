# S4-7b Tasks — Full moderation (remove, notes, history)

Plan: [docs/plans/S4-7b-full-moderation.md](../plans/S4-7b-full-moderation.md)

## Backend

- [x] `schema.ts` — `flags.resolutionNote` (optional)
- [x] `moderation.ts` — `dismissFlag` accepts optional `note`
- [x] `moderation.ts` — `removeReport` mutation
- [x] `moderation.ts` — `getResolvedFlags` query
- [x] `testing/moderation.test.ts` — remove, note, history, gating
- [x] `testing/e2e/moderation.e2e.test.ts`

## Mobile

- [x] `moderation-errors.ts` (+ test) — new kinds, action-aware copy
- [x] `moderation-history.ts` (+ test)
- [x] `ResolveDialog.tsx`
- [x] `FlaggedReportRow.tsx` — Remove button
- [x] `HistoryRow.tsx`
- [x] `ModeratorQueueScreen.tsx` — Open/History tabs, dialog wiring

## Verification

- [x] Backend tests pass
- [x] Mobile unit tests pass
- [x] Type-check backend and mobile
- [x] Lint changed files
- [x] Functions deployed (`convex dev --once`)
- [ ] Manual check in the app (see plan)
