# S4-8 Tasks — E2E integration test suite

Plan: [docs/plans/S4-8-e2e-integration-test-suite.md](../plans/S4-8-e2e-integration-test-suite.md)

## Shared

- [x] `convex/testing/e2e/helpers.ts` — setup, seeding, `actingAs`

## Flow 1 — Auth

- [x] Sign up creates user + session
- [x] Log in resolves `currentUser`
- [x] Session survives app restart (fresh client, same session)
- [x] Unauthenticated mutation rejected, nothing written

## Flow 2 — Discovery

- [x] `nearest` returns seeded places ordered by distance
- [x] Map marker fields present for every result
- [x] List view data equals map data (same ids, same order)

## Flow 3 — Contribution

- [x] Submit report persists and shows in `getPlace` / `listForPlace`
- [x] Second submission within 24h rejected
- [x] Photo upload completes and is attached as evidence

## Flow 4 — Verification

- [x] Confirm recorded, tally updates
- [x] Self-verification rejected
- [x] Vote changeable (one row, tally moves)

## Verification

- [x] `bun run --filter @packages/backend test -- --run` passes (24 files, 207 tests)
- [x] Type-check and lint new files
- [ ] Manual on-device: map markers render, app restart keeps session
