# 0001. Map rendering: Mapbox GL with a documented Haversine fallback

**Status:** Accepted — reconsidered in Sprint 3, not revisited. See
[Revisited?](#revisited).
**Decided:** 2026-08-18
**Owners:** Sprint 0, S0-6 (map SDK and geospatial spike)

> **On this record's provenance.** The repository referenced "ADR-001" in
> `docs/PRD-wayble.md:100` and `docs/PRD-wayble.md:119` and at three further
> places, but no ADR file was ever written. This record is reconstructed on
> 2026-09-29 from the PRD, the S0-6 commit history and the state of the code.
> The PRD's date of 2026-08-18 is the merge of the spike branch, not a written
> decision date. See `docs/adr/README.md`.

## Context

Wayble shows nearby accessible places on a map. Two things were unknown when
this was decided and both had to be resolved before any feature work could
depend on the map:

1. **Which map SDK.** React Native Maps and Mapbox GL were both prototyped on
   the same screen (`feature/prototype-react-native-maps-vs-mapbox-in-expo`,
   merged 2026-08-18).
2. **Whether Convex's geospatial component works well enough to depend on.** It
   was beta. `@convex-dev/geospatial`'s `queryNearest` with `filterKeys` is what
   makes the nearby query filter _before_ documents load, which is the
   difference between shipping a handful of documents and the whole table.

The risk was named rather than discovered: betting on a beta component without a
written fallback is how a sprint loses a day.

## Decision

Use **Mapbox GL via `@rnmapbox/maps`**, with places read through
**`@convex-dev/geospatial`'s `queryNearest`**.

**If the geospatial component fails or is withdrawn, fall back to fetching all
~150 places and filtering by Haversine client-side.** The fallback is written
down here so that it is executed rather than re-derived under time pressure —
that instruction is the PRD's own, at `docs/PRD-wayble.md:100`.

## Consequences

- **The fallback is O(n) over the whole table.** At ~150 places this is
  acceptable and is the reason the decision was safe to take. **It is not a
  scaling strategy.** The dataset growing past a few thousand places invalidates
  it, and this record should be revisited at that point rather than the fallback
  being quietly extended.
- **The beta risk is accepted, not mitigated.** Mapbox and the geospatial
  component were chosen together partly _because_ both are the strongest option
  for their layer; the cost is that two dependencies carry version risk.
- **The map is gated on a location fix.** Neither the map nor the nearby list
  renders without one, which is a recurring obstacle in manual testing. Sprint
  work reaches places through the debug screen for this reason.
- **A screen-reader list fallback already exists and is a _different_ thing.**
  `feature/Non-map-list-fallback-view-for-screen-reader-users` (merged
  2026-08-21 and 2026-08-23) gives screen-reader users a list view of the map's
  content. That is an accessibility affordance, not the geospatial-failure
  fallback in this record, and the two should not be conflated.

## Revisited?

**Reconsidered in Sprint 3 (07–18 Sep 2026) and not revisited.**

Across the window `main` received no merge at all between 2026-08-29 and
2026-09-26, so the question is what Sprint 3 changed, not what it merged.
Measured against `32f946e` (the last merge before the window):

- `schema.ts` gained one net index, `by_place_and_author`, required by US-08's
  duplicate guard. It touches the `reports` table, not `places` or the
  geospatial index.
- The map stack is unchanged in committed history.
- Two dev dependencies were added — `vitest` and `sf-symbols-typescript` — and a
  `test` script was added to `apps/mobile/package.json`; the root already had
  one. No runtime dependency changed.

**The fallback was therefore never exercised.** The only working-tree change that
removes the map is uncommitted local work, not a committed change, so it is not
evidence of anything. Full evidence: `docs/sprint-3-delivery-facts.md` §4.
