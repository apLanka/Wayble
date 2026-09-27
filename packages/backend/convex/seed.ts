import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { geo } from "./places";
import { SEED_PLACES } from "./seed/placesSeedData";

/**
 * One-shot dev seed: load the 155 bundled public places into `content-camel-71`
 * so the nearby list has something to show.
 *
 * Server-side on purpose. The dataset lives here rather than in the mobile
 * bundle so it cannot be tampered with in transit, and so the button on the
 * debug screen is a no-argument trigger rather than 155 records posted from a
 * device. A previous `seedMockPlaces` mutation took the payload as client args
 * and forced every place to category `"other"`; it was never called and has
 * been removed rather than left as a footgun beside this one.
 *
 * Idempotent, keyed on the lowercased name, so the button is safe to press
 * more than once and re-seeding a partially populated database fills only the
 * gaps.
 */
export const seedAllPlaces = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "Unauthenticated: must be logged in to seed the places database",
      );
    }

    // One pass to build the name set rather than a query per record: the
    // dataset is fixed at 155, and 155 filtered full-table scans is a
    // noticeable mutation on a free deployment.
    const existing = await ctx.db.query("places").collect();
    const seenNames = new Set(existing.map((p) => p.name.trim().toLowerCase()));

    const now = Date.now();
    let inserted = 0;
    let skipped = 0;

    for (const place of SEED_PLACES) {
      const key = place.name.trim().toLowerCase();

      // A name duplicated within the dataset itself would otherwise insert
      // twice, so the set is updated as we go rather than only seeded from
      // what is already in the table.
      if (seenNames.has(key)) {
        skipped += 1;
        continue;
      }
      seenNames.add(key);

      const placeId = await ctx.db.insert("places", {
        name: place.name,
        category: place.category,
        address: place.address,
        location: place.location,
        accessibilityCategories: place.accessibilityCategories,
        features: place.features,
        createdBy: userId,
        updatedAt: now,
      });

      // `nearest` reads this index, not the table, so a place missing from it
      // is invisible to the map and the list even though the row exists.
      await geo.insert(ctx, placeId, place.location, {
        category: place.category,
      });

      inserted += 1;
    }

    return { inserted, skipped, total: SEED_PLACES.length };
  },
});
