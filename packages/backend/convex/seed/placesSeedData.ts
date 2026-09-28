// Import the predefined public-place data from the JSON file.
import placesJson from "./places.json";

/**
 * Defines the required structure of each place in the seed dataset.
 */
export type SeedPlace = {
  name: string;
  // Category used to classify and filter the place.
  category:
    | "education"
    | "food_and_drink"
    | "government"
    | "healthcare"
    | "lodging"
    | "outdoor"
    | "retail"
    | "transport"
    | "workplace"
    | "other";
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  // Derived below, not present in the JSON.
  accessibilityCategories: AccessibilityCategory[];
  features: string[];
};

/** The four values `accessibilityCategoryValidator` accepts. */
export type AccessibilityCategory =
  "wheelchair" | "elevator" | "bathroom" | "multi";

/**
 * Which accessibility categories plausibly apply to each business type.
 *
 * A guess, and deliberately a labelled one. The dataset records what a place
 * *is* and carries no accessibility information whatsoever, but the mobile
 * client filters the nearby list on `accessibilityCategories`
 * (`use-nearby-places.ts`) — so seeding it verbatim leaves every filter chip
 * except "all" returning nothing, and the seeded data looks broken.
 *
 * Anything this table produces is fabricated. It exists so the filters, the
 * map marker colours and the report flow have rows to exercise, and must
 * never be presented as a real accessibility observation.
 */
const BY_CATEGORY: Record<string, AccessibilityCategory[]> = {
  healthcare: ["wheelchair", "bathroom"],
  transport: ["wheelchair", "elevator"],
  government: ["wheelchair", "elevator"],
  education: ["wheelchair", "bathroom"],
  workplace: ["wheelchair", "elevator"],
  lodging: ["multi", "elevator"],
  food_and_drink: ["bathroom"],
  retail: ["wheelchair"],
  outdoor: [],
};

/**
 * Fills the gaps the per-category table cannot cover.
 *
 * The table is a floor, not a ceiling: with it alone, "multi" would have only
 * the five lodging places and the remaining 150 records would leave that chip
 * near-empty. Each record therefore also takes the next value in this
 * rotation, which spreads 155 places roughly 39 per chip.
 */
const ROTATION: AccessibilityCategory[] = [
  "wheelchair",
  "elevator",
  "bathroom",
  "multi",
];

/**
 * Convert the imported JSON data into a typed array of seed places, deriving
 * an accessibility tag for every record.
 *
 * The cast is unchecked because the JSON carries no type information; the
 * `category` values themselves are validated for real by the insert in
 * `seedPlaces`, which rejects anything outside `placeCategoryValidator`.
 */
export const SEED_PLACES: SeedPlace[] = (
  placesJson as Omit<SeedPlace, "accessibilityCategories" | "features">[]
).map((place, index) => {
  const merged = new Set<AccessibilityCategory>(
    BY_CATEGORY[place.category] ?? [],
  );
  merged.add(ROTATION[index % ROTATION.length]!);

  return {
    ...place,
    accessibilityCategories: Array.from(merged),
    features: [],
  };
});
