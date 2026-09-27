import type { Infer } from "convex/values";
import { placeCategoryValidator } from "../schema";
import placesJson from "./places.json";

/** The literal union `places.category` accepts, derived from the schema so
 *  the two cannot drift. */
export type PlaceCategory = Infer<typeof placeCategoryValidator>;

/**
 * The raw dataset, as ported from `feature/seed-initial-places-data`.
 *
 * Each record is `{ name, category, address, location }` and nothing else —
 * notably no accessibility information, which is the whole reason the
 * derivation below exists rather than the seed inserting these fields
 * verbatim.
 *
 * `category` is cast rather than validated: the JSON has no type information,
 * so TypeScript cannot check it. The value is checked for real by the insert
 * in `seedAllPlaces`, which rejects any category outside the validator, and
 * the "preserves each place's real category" test inserts all 155 records —
 * so a bad value in the dataset fails the suite rather than reaching the
 * database.
 */
export type RawSeedPlace = {
  name: string;
  category: PlaceCategory;
  address: string;
  location: { latitude: number; longitude: number };
};

/** The four values `accessibilityCategoryValidator` accepts. */
export type AccessibilityCategory =
  "wheelchair" | "elevator" | "bathroom" | "multi";

export type SeedPlace = RawSeedPlace & {
  accessibilityCategories: AccessibilityCategory[];
  features: string[];
};

/**
 * Which accessibility categories plausibly apply to each business type.
 *
 * This is a guess, and deliberately a labelled one: the source data records
 * what a place *is*, never how accessible it is. Seeding the dataset without
 * it would leave every `accessibilityCategories` empty, and the mobile client
 * filters on that field (`use-nearby-places.ts:104`) — so every filter chip
 * except "all" would return nothing and the seeded data would look broken.
 *
 * Anything produced from this table is fabricated. It exists so the filters,
 * the map marker colours and the report flow have rows to exercise, and must
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
 * Fills the gaps the per-category table cannot cover on its own.
 *
 * The table is a floor, not a ceiling: a hospital with no elevator category
 * would leave the "elevator" chip empty, so each record also takes the next
 * value in this rotation. That keeps all four chips populated without
 * pretending the rotation means anything about the individual place.
 */
const ROTATION: AccessibilityCategory[] = [
  "wheelchair",
  "elevator",
  "bathroom",
  "multi",
];

/**
 * Builds the seed set, guaranteeing every record ends up with at least one
 * accessibility category.
 *
 * The rotation is what keeps all four chips populated: the table alone leaves
 * `outdoor` with nothing and skews the rest, whereas adding the rotated value
 * to every record spreads 155 places roughly 39 per chip. That is enough for
 * the filters to behave like the real thing.
 */
export const SEED_PLACES: SeedPlace[] = (placesJson as RawSeedPlace[]).map(
  (place, index) => {
    const fromCategory = BY_CATEGORY[place.category] ?? [];
    const rotated = ROTATION[index % ROTATION.length]!;

    const merged = new Set<AccessibilityCategory>(fromCategory);
    merged.add(rotated);

    return {
      name: place.name.trim(),
      category: place.category,
      address: place.address,
      location: {
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      },
      accessibilityCategories: Array.from(merged),
      features: [],
    };
  },
);
