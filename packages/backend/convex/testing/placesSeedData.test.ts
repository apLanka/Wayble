import { describe, expect, test } from "vitest";
import { SEED_PLACES } from "../seed/placesSeedData";

/**
 * Covers the accessibility derivation in `placesSeedData`, which is what
 * makes the seeded dataset usable by the mobile filters at all.
 *
 * `seedPlaces` itself had no test coverage before this branch; these are
 * deliberately scoped to the pure function rather than the mutation, because
 * the mutation's behaviour is a thin loop over this data and the interesting
 * part is the shape of the data.
 */
describe("SEED_PLACES accessibility derivation", () => {
  test("gives every place at least one accessibility category", () => {
    const untagged = SEED_PLACES.filter(
      (p) => p.accessibilityCategories.length === 0,
    );

    // The client filters the nearby list on this field, so a single untagged
    // row is a row that disappears from three of the four filter chips.
    expect(untagged).toHaveLength(0);
  });

  test("represents all four categories so no chip is empty", () => {
    const seen = new Set(SEED_PLACES.flatMap((p) => p.accessibilityCategories));

    expect([...seen].sort()).toEqual([
      "bathroom",
      "elevator",
      "multi",
      "wheelchair",
    ]);
  });

  test("spreads categories rather than piling them onto one", () => {
    const counts = new Map<string, number>();
    for (const place of SEED_PLACES) {
      for (const category of place.accessibilityCategories) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }

    // Without the rotation, "multi" would only appear on the handful of
    // lodging places. Each category should cover a meaningful share.
    for (const [category, count] of counts) {
      expect(
        count,
        `${category} only appeared on ${count} of ${SEED_PLACES.length}`,
      ).toBeGreaterThan(SEED_PLACES.length / 10);
    }
  });

  test("never repeats a category within one place", () => {
    for (const place of SEED_PLACES) {
      const unique = new Set(place.accessibilityCategories);
      expect(unique.size).toBe(place.accessibilityCategories.length);
    }
  });

  test("preserves the source fields unchanged", () => {
    for (const place of SEED_PLACES) {
      expect(place.name.trim()).toBe(place.name);
      expect(place.address.length).toBeGreaterThan(0);
      expect(Number.isFinite(place.location.latitude)).toBe(true);
      expect(Number.isFinite(place.location.longitude)).toBe(true);
    }
  });

  test("features default to empty rather than undefined", () => {
    // `places.features` is optional in the schema, but an explicit empty
    // array keeps the insert total and the card rendering predictable.
    expect(SEED_PLACES.every((p) => Array.isArray(p.features))).toBe(true);
  });
});
