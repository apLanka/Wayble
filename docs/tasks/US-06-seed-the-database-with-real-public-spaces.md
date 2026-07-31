# US-06 Tasks: Seed the Database with Real Public Spaces

**Related plan:** [`docs/plans/US-06-seed-the-database-with-real-public-spaces.md`](../plans/US-06-seed-the-database-with-real-public-spaces.md)

## Task Summary

- **Sprint:** Sprint 1
- **Epic:** E3 Place Discovery
- **Story points:** 2
- **Owner:** M1
- **Objective:** Seed the Convex database with ~150 real public spaces in Greater Colombo & Malabe so the map is not empty at demo.

---

## Acceptance Criteria

- [x] ~150 places for the target area (Greater Colombo & Malabe, Sri Lanka — 155 places)
- [x] Repeatable seed command (`bun run seed`)
- [x] Documented in `README.md`

---

## Subtasks & Work Items

### 1. Data Ingestion & Extraction (OSM Overpass)
- [x] `scripts/fetch-osm-places.ts` — Query OSM Overpass API for public venues in Greater Colombo / Malabe (`[6.83, 79.83, 6.96, 79.99]`).
- [x] Category normalization — Map OSM tags to the 10 defined `places.category` values (`healthcare`, `education`, `food_and_drink`, `government`, `outdoor`, `retail`, `transport`, `lodging`, `workplace`, `other`).
- [x] Generate deterministic seed dataset — Output to `packages/backend/convex/seed/places.json` (155 places).

### 2. Backend — Convex Seeding & Geospatial Index Backfill
- [x] `packages/backend/convex/seed.ts` — Implement `seedPlaces` mutation:
  - Create/retrieve a system seed user in `users` (`email: "seed@wayble.app"`).
  - Idempotently insert ~150 places into the `places` table.
  - Insert place IDs and category metadata into `@convex-dev/geospatial` index.
- [x] `packages/backend/convex/seed.ts` — Implement `backfillGeoIndex` mutation for re-indexing existing place records.
- [x] `packages/backend/convex/seed.test.ts` — Write unit tests verifying:
  - Seeding inserts valid places adhering to `schema.ts`.
  - Idempotent execution (running seed twice does not duplicate places).
  - Geospatial index returns nearest seeded places.

### 3. Monorepo Scripts & Commands
- [x] Root `package.json` — Add `"seed": "bun run --filter @packages/backend seed"`.
- [x] `packages/backend/package.json` — Add `"seed": "convex run seed:seedPlaces"`.

### 4. Documentation & Verification
- [x] `README.md` — Document `bun run seed` command, target bounding box, and dataset overview.
- [x] Run test suite (`bun --filter @packages/backend test --run`) and verify all tests pass.
- [x] Run `bun run check-types` across monorepo and verify 0 errors.
