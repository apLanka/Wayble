# US-16 — Rank results by access-needs match

**Sprint:** 3 (S3-5) · **Points:** 5 · **Epic:** E6
**Related:** US-02 (`users.accessibilityNeeds`, the input) · US-05 / `places.getPlace` (attribute
aggregation this reuses) · US-04 ("Matches my profile" filter, folded in here) · US-21
(`notifications.matchNeed`, the only other reader of needs)

---

## Problem

A user who set "step-free entrance" and "elevator" in their profile sees nearby places in pure
distance order. The closest place may have a known "no" on the elevator. This ticket ranks results
by how well each place's recorded attributes match the user's needs and says why on each row.

## What already exists

- **Needs:** `users.accessibilityNeeds: AccessibilityAttributeKey[] | undefined` (US-02), already on
  `api.users.currentUser`. Duplicates are rejected server-side. Same key vocabulary as report
  attributes, so a need maps 1:1 to an attribute key.
- **Results:** `useNearbyPlaces()` → `places.nearest` (geo, ≤40, has `distance`) or `places.search`
  (text, distance added client-side). Consumed by the map tab's list mode and `HomeNearbySection`,
  both rendering `PlaceListItem`.
- **The gap:** neither `nearest` nor `search` returns accessibility attributes. Those live in
  `reports`, and only `getPlace` aggregates them (last-write-wins per key by `observedAt`, active
  reports only). That aggregation is inline in `getPlace`.
- **No filter sheet exists.** The only filter UI is the `CategoryFilter` pill row on the map tab.
  US-04's "Matches my profile" filter was never built (US-02 plan: "Nothing reads
  `accessibilityNeeds` yet").
- Pure-module pattern: `confidence.ts`, `verificationNeed.ts` in `convex/` (backend Vitest) and
  `report-draft.ts` in mobile. No component renderer in `apps/mobile`.

## Non-goals

- Weighting needs differently (all needs count equally).
- Factoring confidence tier / verification count into the score. Possible follow-up; the spec says
  distance is the tiebreak.
- Re-ordering map pins. Pins have no order; the filter does hide them, through the existing
  `filtered` → `highlightedIds` path.
- **The "Matches my profile" quick filter (ClickUp task 4) — dropped from this ticket**, decided
  2026-10-02. It needs a toggle pill, a no-needs state, an empty state and a match rule of its own;
  ranking plus the explanation chip deliver the story without it. Mark the ClickUp item deferred.
- A new filter sheet / bottom-sheet UI.
- Server-side ranking or pagination.

## Decisions

| Decision                   | Choice                                                                                                       | Why                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where attributes come from | `nearest` and `search` each return `attributes` (aggregated), via a helper extracted from `getPlace`         | One aggregation rule everywhere: the rank and the place-detail screen can't disagree. Costs one `by_place` read per result (≤40), the same per-place read `getPlace` does.                                            |
| Where scoring runs         | Client, with a pure `matchScore` in `packages/backend/convex/matchScore.ts`                                  | Needs are already on the client; toggling the filter is instant; the queries stay user-agnostic (cacheable, no auth). Living in `convex/` like `confidence.ts` means backend Vitest covers it and the app imports it. |
| Value credit               | `yes` = 1, `partial` = 0.5, `no` = 0, `unknown` / not reported = 0                                           | A partial match is worth something but less than a full one.                                                                                                                                                          |
| `not_applicable`           | Excluded from the denominator, listed separately in the explanation                                          | "Elevator: not applicable" on a single-storey place isn't a miss. Counting it as 0 would punish places for not needing a feature. (Confirmed.)                                                                        |
| Score                      | `(met + 0.5 × partial) / considered`, in [0, 1]; `null` when the user has no needs                           | Normalised so a user with 2 needs and one with 6 get comparable numbers.                                                                                                                                              |
| Sort                       | score desc → explicit `no` count asc → distance asc (unknown distance last) → name                           | Spec: score, then distance. The `no` key sits between them: a known "no elevator" should rank below "we don't know" at the same score.                                                                                |
| No needs / signed out      | No ranking (distance order, as today), no chip                                                               | Ranking against an empty profile would be noise.                                                                                                                                                                      |
| Explanation chip           | Short visible text ("2 of 3 needs met", "No elevator", "No info on your needs") + a full accessibility label | The row has room for a few words; a screen reader user gets the whole reason.                                                                                                                                         |

---

## Backend

### `packages/backend/convex/placeAttributes.ts` (new, pure)

`aggregateAttributes(reports)` → `AccessibilityAttribute[]`, moved verbatim from `getPlace`: active
reports only, last-write-wins per key on `observedAt`. Pure (takes report-shaped objects), so it is
unit-tested directly.

### `packages/backend/convex/places.ts`

- `getPlace` calls `aggregateAttributes` instead of its inline loop. Behaviour unchanged; existing
  `places.test.ts` must stay green untouched.
- `nearest` and `search`: for each place, read `reports` `by_place` and add `attributes`. Comment the
  cost (≤ `limit` index reads per call) the way `listForPlace` does.

### `packages/backend/convex/matchScore.ts` (new, pure)

```ts
type MatchResult = {
  score: number | null; // null when needs is empty
  met: AccessibilityAttributeKey[]; // yes
  partial: AccessibilityAttributeKey[];
  unmet: AccessibilityAttributeKey[]; // no
  unknown: AccessibilityAttributeKey[]; // unknown, or not reported at all
  notApplicable: AccessibilityAttributeKey[];
};
export function matchScore(placeAttributes, userNeeds): MatchResult;
```

Needs are de-duplicated defensively (the mutation already rejects duplicates). Output lists follow
the user's need order. All needs `not_applicable` → `score: 0`, every key in `notApplicable`.

### Tests

- `testing/matchScore.test.ts`, covering "all access-need combinations" in a way that's actually
  enumerable (19 keys make 2^19 need sets, so not literally):
  - every one of the 6 states (`yes`, `partial`, `no`, `unknown`, `not_applicable`, not reported)
    for a single need: score and bucket;
  - every ordered pair of states for two needs (6 × 6 = 36, table-driven): score and buckets;
  - every taxonomy key as a single need with `yes` → score 1 (no key is silently dropped);
  - empty needs → `null`; duplicate needs counted once; all `not_applicable` → 0; score always in [0, 1].
- `testing/placeAttributes.test.ts`: last-write-wins, inactive reports ignored, empty input.
- `testing/places.test.ts`: `nearest` and `search` include aggregated `attributes`; a place with no
  reports gets `[]`.

## Mobile

| File                                    | Change                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/rank-places.ts` (new, pure)      | `rankPlaces(places, needs)` → places with `match` attached, sorted by the rule above (stable; unchanged order when `needs` is empty). `matchExplanation(result)` → `{ short, accessibilityLabel }` using `ATTRIBUTE_METADATA` labels. |
| `utils/rank-places.test.ts` (new)       | Sort: score beats distance; equal score → fewer `no` first → nearer first; missing distance last; no needs → input order kept. Explanation copy for each bucket mix, including singular/plural and the all-met case.                  |
| `hooks/use-nearby-places.ts`            | Read `api.users.currentUser` needs; `NearbyPlace` gains `attributes`; return `ranked` (category-filtered, then ranked). `filtered` / `highlightedIds` unchanged, so map pins are unaffected.                                          |
| `components/map/PlaceListItem.tsx`      | Optional `matchExplanation` prop: renders the chip under the category line and appends its accessibility label to the row's label, so the row is still read as one node.                                                              |
| `app/(tabs)/mapbox/index.tsx`           | List mode renders `ranked` and passes the explanation. Edited with the local Mapbox stub stashed, so the commit carries only this change.                                                                                             |
| `components/home/HomeNearbySection.tsx` | Same chip; Home's preview is the top 5 of `rankedLocations` (see As built).                                                                                                                                                           |

### Accessibility

- Row stays one focusable node: "KFC, food and drink, 120 m away. Ranked here because it meets 2 of
  your 3 needs: step-free entrance, elevator. No information on hearing loop."
- Chip colour is never the only signal; the text says it all.

## Task mapping

| ClickUp task                                           | Covered by                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `matchScore(placeAttributes, userNeeds)` pure function | `convex/matchScore.ts`                                                            |
| Sort nearby results by score desc, distance tiebreak   | `utils/rank-places.ts`, `use-nearby-places`; `nearest`/`search` return attributes |
| "Why this ranked here" chip on each row                | `matchExplanation`, `PlaceListItem`                                               |
| "Matches my profile" quick filter (from US-02 profile) | **Deferred** — dropped from this ticket (see Non-goals)                           |
| Unit tests over the scorer for all need combinations   | `testing/matchScore.test.ts` (single states, all 36 pairs, every key)             |

## Build order (one commit each, held for review)

1. `placeAttributes.ts` extracted from `getPlace` + tests (refactor only, behaviour unchanged).
2. `nearest` / `search` return `attributes` + tests.
3. `matchScore.ts` + exhaustive tests.
4. `rank-places.ts` (sort + explanation copy) + tests.
5. Hook wiring, `PlaceListItem` chip, both list screens.
6. This plan doc. (`docs/traceability.md` is not updated for this ticket.)

## Manual test checklist

- [ ] Signed out / no needs: list in distance order, no chips.
- [ ] Needs set: a farther place meeting all needs ranks above a nearer one meeting none.
- [ ] Two places with the same score: the nearer one is first; a known "no" ranks below "no info".
- [ ] Chip text matches the place detail screen's attributes for that place.
- [ ] A category pill still narrows the list, and the narrowed list is still ranked.
- [ ] Editing needs in the profile re-ranks the list without a restart.
- [ ] Submitting a report that changes an attribute re-ranks the list live.
- [ ] Search results are ranked and chipped the same way.
- [ ] VoiceOver / TalkBack read each row as one node, including the reason.
- [ ] 200% font: chip wraps, nothing clipped.

## Risks

- **Read cost on `nearest` / `search`:** up to 40 `by_place` reads per call, re-run reactively when
  any of those places' reports change. Fine at this data size. If it grows, store the aggregate on
  `places` and update it in `submitReport`.
- **Sparse data:** real places mostly have no reports, so many rows will say "No info on your
  needs" and rank by distance. That's honest. For demos, the seed now gives ~70% of places varied
  sample reports (see As built).
- **`NearbyPlace` is a hand-written type** cast over the query result in the hook. `attributes` was
  added to it by hand to match what the queries return; it was not switched to a derived type, so
  a future change to `nearest`/`search` can still drift from it without a type error.

## Decisions taken (2026-10-02)

1. `not_applicable` is excluded from the score.
2. The "Matches my profile" filter is dropped from this ticket.
3. Branch from `main`. The local Mapbox stub stays uncommitted; `traceability.md` is not updated.

## As built

Commits on `feature/s3-5-rank-results-by-access-needs-match-US-16`, in order, and where they
depart from the plan above.

1. **Refactor: `aggregateAttributes`** extracted to `convex/placeAttributes.ts`. It filters
   `status === "active"` itself, so callers can pass raw `by_place` results.
2. **Seed: varied sample reports** (`chore(seed)`, not in the original plan). The old seed gave 16
   of 155 places one identical all-yes report labelled "verified", so ranking had nothing to
   separate. `seed/reportsSeedData.ts` now generates deterministic, clearly-labelled sample reports
   (44 / 88 / 23 places with 0 / 1 / 2 reports; all five values). `seedPlaces` skips places that
   already have reports, and `reseedReports: true` replaces only the seed bot's reports. Not
   US-16 scope, and separable into its own PR.
3. **`nearest` / `search` return `attributes`.** `nearest`'s `try/catch` was narrowed back to the
   `ctx.db.get` it exists for, so a failed reports read fails the query instead of silently
   dropping a row.
4. **`matchScore`** as planned. `_generated/api.d.ts` regenerated in the same commit.
5. **`rank-places.ts`.** Explanation copy as built:
   - chip: "Meets your need", "Meets all N needs", "1 of 3 needs met, 1 partly · No Hearing Loop",
     "0 of 2 needs met · 2 missing", "No info on your needs", "Your needs don't apply here";
   - the chip names only the first missing attribute and counts the rest; the accessibility label
     names every attribute in every bucket;
   - labels are `ATTRIBUTE_METADATA`'s Title Case, imported by relative path because mobile Vitest
     has no `@/` alias.
6. **UI wiring.** The hook returns two ranked lists, not one: `ranked` (category-filtered, map tab
   list mode) and `rankedLocations` (all results). **Home's preview is the top 5 of
   `rankedLocations`**, so it shows the best matches among the 40 nearest rather than the 5
   closest; with no needs set it is unchanged. Worth a product check, since the section is titled
   "nearby".

Not done: the "Matches my profile" filter (dropped), `traceability.md` (not updated by decision),
and the manual checklist above (not yet run).
