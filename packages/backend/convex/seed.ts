import { GeospatialIndex } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { SEED_PLACES } from "./seed/placesSeedData";

export const geo = new GeospatialIndex<
  string,
  { category: string; name: string }
>(components.geospatial);

/**
 * Seeds the database with public spaces.
 * Idempotent: checks for existing places by name to avoid duplicates.
 */
export const seedPlaces = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let seedUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "seed@wayble.app"))
      .first();

    if (!seedUser) {
      const seedUserId = await ctx.db.insert("users", {
        name: "Wayble Seed Bot",
        displayName: "Wayble Seeder",
        email: "seed@wayble.app",
        role: "admin",
        updatedAt: Date.now(),
      });

      seedUser = await ctx.db.get(seedUserId);
    }

    if (!seedUser) {
      throw new Error("Failed to initialize seed user");
    }

    if (args.clearExisting) {
      const existingPlaces = await ctx.db.query("places").collect();

      for (const place of existingPlaces) {
        await ctx.db.delete(place._id);
      }
    }

    const currentPlaces = await ctx.db.query("places").collect();

    const existingNameSet = new Set(
      currentPlaces.map((place) => place.name.trim().toLowerCase()),
    );

    let insertedCount = 0;
    let skippedCount = 0;
    const now = Date.now();

    for (const item of SEED_PLACES) {
      const normalizedName = item.name.trim().toLowerCase();

      if (existingNameSet.has(normalizedName)) {
        skippedCount++;
        continue;
      }

      await ctx.db.insert("places", {
        name: item.name.trim(),
        category: item.category,
        address: item.address,
        location: {
          latitude: item.location.latitude,
          longitude: item.location.longitude,
        },
        createdBy: seedUser._id,
        updatedAt: now,
      });

      existingNameSet.add(normalizedName);
      insertedCount++;
    }

    return {
      totalInDataset: SEED_PLACES.length,
      inserted: insertedCount,
      skipped: skippedCount,
      currentTotalInDb: (await ctx.db.query("places").collect()).length,
    };
  },
});