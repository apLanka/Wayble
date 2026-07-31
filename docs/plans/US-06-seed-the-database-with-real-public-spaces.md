# US-06: Seed the Database with Real Public Spaces

**Sprint 1 · Epic E3 Place Discovery · 2 pts · Owner M1**

As the team, we have a seeded set of real public spaces, so the map is not empty at demo.

---

## Context

Wayble is an inclusive public space accessibility mapper built with:
- **Backend:** Convex (`packages/backend/convex/`) storing `places`, `reports`, `verifications`, and `flags`.
- **Geospatial Index:** `@convex-dev/geospatial` component configured in `convex.config.ts` for fast geospatial indexing and radius/nearest neighbor queries.
- **Frontend:** Expo React Native mobile app (`apps/mobile/`) displaying interactive maps (Google Maps / Mapbox) with category pins and place details.

Currently, mock locations exist in `apps/mobile/data/mock-data.ts` and 22 sample points in `packages/backend/convex/geoSpike.ts`. To ensure realistic user testing and an engaging demo, we need ~150 real-world public spaces (hospitals, universities, transit hubs, government buildings, shopping centers, parks, etc.) in the target area (Greater Colombo & Malabe, Sri Lanka) seeded directly into Convex `places` and the geospatial index.

---

## Acceptance Criteria

1. **~150 places for the target area**: A curated dataset of approximately 150 real public spaces covering diverse categories across the target region.
2. **Repeatable seed command**: A one-line command (e.g. `bun run seed`) that seeds places into Convex idempotently.
3. **Documented in README**: Clear instructions in `README.md` for running the seed command and understanding the data source.

---

## Architecture & Data Flow

```text
┌─────────────────────────┐
│   OSM Overpass API      │ (Fetch ~150 POIs in Greater Colombo)
└────────────┬────────────┘
             │ scripts/fetch-osm-places.ts
             ▼
┌─────────────────────────┐
│ seed/places.jsonl / .ts │ (Committed deterministic seed dataset)
└────────────┬────────────┘
             │ bun run seed
             ▼
┌─────────────────────────┐
│  Convex seed Mutation   │
│   (convex/seed.ts)      │
└──────┬────────────┬─────┘
       │            │
       ▼            ▼
┌──────────────┐  ┌───────────────────────────────┐
│ places table │  │ @convex-dev/geospatial Index  │
└──────────────┘  └───────────────────────────────┘
```

---

## Proposed Changes

### 1. OSM Overpass Extraction Tooling

#### `scripts/fetch-osm-places.ts`
- Script to query the OpenStreetMap Overpass API for public venues in Greater Colombo bounding box (`[6.83, 79.83, 6.96, 79.99]`).
- Tag mapping to Convex `placeCategoryValidator`:
  - `amenity=hospital|clinic|doctors|pharmacy` → `healthcare`
  - `amenity=school|university|college|kindergarten` → `education`
  - `amenity=restaurant|cafe|fast_food|food_court` → `food_and_drink`
  - `amenity=townhall|courthouse|police|post_office` → `government`
  - `leisure=park|garden|pitch|playground` → `outdoor`
  - `shop=supermarket|mall|department_store` → `retail`
  - `highway=bus_stop`, `railway=station|halt` → `transport`
  - `tourism=hotel|guest_house|hostel` → `lodging`
- Output saved to `packages/backend/convex/seed/places.json` / `.jsonl`.

---

### 2. Backend Convex Seeding & Geo Backfill

#### `packages/backend/convex/seed.ts`
- **`seedPlaces` mutation**:
  - Ensures a system seed user exists in `users` (`email: "seed@wayble.app"`).
  - Iterates through the ~150 places and inserts them into `places` if they don't already exist (idempotent matching by name + coordinates).
  - Populates the `@convex-dev/geospatial` index for each inserted place with its `_id` and category metadata.
- **`backfillGeoIndex` mutation**:
  - Utility mutation to re-index all existing records from the `places` table into the geospatial component.
- **`clearPlaces` mutation**:
  - Utility mutation for developers/CI to reset seeded place records cleanly when needed.

#### `packages/backend/convex/seed.test.ts`
- Test suite verifying:
  - Seeding correctly inserts places adhering to `schema.ts`.
  - Re-running the seed is idempotent and does not produce duplicate records.
  - Geospatial query returns seeded places sorted by distance.

---

### 3. Monorepo Scripts

- Root `package.json`: Add `"seed": "bun run --filter @packages/backend seed"`.
- `packages/backend/package.json`: Add `"seed": "convex run seed:seedPlaces"`.

---

### 4. Documentation

- Update `README.md` with:
  - Seeding instructions in the Setup section.
  - Target geographic area details and category breakdown.
  - Command reference table update.
