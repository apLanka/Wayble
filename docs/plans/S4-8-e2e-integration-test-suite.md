# S4-8 — E2E integration test suite for the critical user flows

## Goal

Prove that the flows users depend on work **end to end across modules**, not
just per function. Existing tests in `convex/testing/*.test.ts` cover one module
each; this suite chains modules the way a real session does.

## Approach

- Backend flows run on `convex-test` + Vitest (`edge-runtime`), the same harness
  as the existing suites, with the geospatial component registered. No new
  dependencies, no existing file modified.
- New files live in `packages/backend/convex/testing/e2e/` and are picked up by
  the existing `vitest` config.
- A shared `helpers.ts` provides setup, user/place seeding and an
  `actingAs(userId)` helper.
- Pure mobile logic involved in a flow (verification tally, error classifiers)
  is already unit-tested; the e2e suite exercises the **backend contract** those
  screens consume.

## Flows

| Flow           | File                       | Steps                                                                                 |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| 1 Auth         | `auth.e2e.test.ts`         | sign up > log in > session survives restart > unauthenticated mutation rejected       |
| 2 Discovery    | `discovery.e2e.test.ts`    | `nearest` returns results > map-marker fields present > list view shows same data     |
| 3 Contribution | `contribution.e2e.test.ts` | submit report > duplicate guard on 2nd submission within 24h > photo upload completes |
| 4 Verification | `verification.e2e.test.ts` | confirm > tally updates > self-verification rejected > vote is changeable             |

## Honest limits

- **Sign-up/log-in** use the persisted user + `authSessions` rows that the
  Password provider writes; the scrypt/JWT handshake itself is not run in
  `convex-test`. Sign-up is modelled as creating the user+session, log-in as a
  fresh identity resolving through `users.currentUser`.
- **App restart** = a brand-new test client bound to the same stored
  user/session; data and session survive, identity re-resolves.
- **Map markers rendering** (Mapbox native view) cannot run in Vitest. The test
  asserts every field the screen's GeoJSON/list mapping reads, and that both
  views derive from the same `nearest` result. On-device rendering stays a
  manual check (listed in the tasks doc).
- **Photo upload**: no backend upload/attach endpoint exists yet
  (`submitReport` writes `evidence: []`). The test uses Convex storage
  (`ctx.storage.store`) and attaches the `storageId` to the report's
  `evidence`, which verifies storage + schema + retrieval work together.

## Run

`bun run --filter @packages/backend test -- --run e2e`
