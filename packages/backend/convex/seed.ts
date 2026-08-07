import { GeospatialIndex } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { SEED_PLACES } from "./seed/placesSeedData";
import { ACCESSIBILITY_TAXONOMY_VERSION } from "./accessibility";

export const geo = new GeospatialIndex<string, { category: string; name: string }>(
  components.geospatial,
);

/**
 * Seeds the database with real public spaces in Greater Colombo & Malabe.
 * Idempotent: checks for existing places by name to avoid duplicate insertions.
 */
export const seedPlaces = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Ensure a system seed user exists
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

    // 2. Optionally clear existing places if requested
    if (args.clearExisting) {
      const existingPlaces = await ctx.db.query("places").collect();
      for (const p of existingPlaces) {
        // Clear related reports
        const reports = await ctx.db
          .query("reports")
          .withIndex("by_place", (q) => q.eq("placeId", p._id))
          .collect();
        for (const r of reports) {
          await ctx.db.delete(r._id);
        }
        await ctx.db.delete(p._id);
      }
    }

    // 3. Collect existing place names for idempotency
    const currentPlaces = await ctx.db.query("places").collect();
    const existingNameSet = new Set(
      currentPlaces.map((p) => p.name.trim().toLowerCase()),
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

      const placeId = await ctx.db.insert("places", {
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

      // Insert into geospatial index
      await geo.insert(
        ctx,
        placeId,
        {
          latitude: item.location.latitude,
          longitude: item.location.longitude,
        },
        {
          category: item.category,
          name: item.name.trim(),
        },
      );

      existingNameSet.add(normalizedName);
      insertedCount++;
    }

    // 4. Seed initial accessibility reports for well-known demo hubs if they have none
    await seedDemoReports(ctx, seedUser._id, now);

    return {
      totalInDataset: SEED_PLACES.length,
      inserted: insertedCount,
      skipped: skippedCount,
      currentTotalInDb: (await ctx.db.query("places").collect()).length,
    };
  },
});

/**
 * Backfills the geospatial index for all existing places in the database.
 */
export const backfillGeoIndex = mutation({
  args: {},
  handler: async (ctx) => {
    const places = await ctx.db.query("places").collect();
    let indexedCount = 0;

    for (const place of places) {
      await geo.insert(
        ctx,
        place._id,
        {
          latitude: place.location.latitude,
          longitude: place.location.longitude,
        },
        {
          category: place.category,
          name: place.name,
        },
      );
      indexedCount++;
    }

    return { indexed: indexedCount };
  },
});

/**
 * Helper to seed sample accessibility reports for iconic demo venues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedDemoReports(ctx: any, authorId: any, timestamp: number) {
  const demoVenues = [
    {
      namePattern: /SLIIT|Hospital|Mall|Park|Station|Cargills/i,
      attributes: [
        { key: "mobility.step_free_entrance" as const, value: "yes" as const, note: "Level entrance with ramp" },
        { key: "mobility.wide_entrance" as const, value: "yes" as const },
        { key: "mobility.accessible_parking" as const, value: "yes" as const, note: "Designated spots near main lobby" },
        { key: "mobility.accessible_restroom" as const, value: "yes" as const },
        { key: "mobility.elevator" as const, value: "yes" as const },
        { key: "vision.braille_signage" as const, value: "partial" as const, note: "Braille in elevators only" },
        { key: "vision.tactile_guidance" as const, value: "yes" as const },
        { key: "assistance.service_animals" as const, value: "yes" as const },
      ],
    },
  ];

  const places = await ctx.db.query("places").collect();

  for (const place of places) {
    for (const demo of demoVenues) {
      if (demo.namePattern.test(place.name)) {
        // Check if report already exists
        const existingReport = await ctx.db
          .query("reports")
          .withIndex("by_place", (q: any) => q.eq("placeId", place._id))
          .first();

        if (!existingReport) {
          await ctx.db.insert("reports", {
            placeId: place._id,
            authorId,
            taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
            attributes: demo.attributes,
            summary: "Initial verified accessibility assessment.",
            evidence: [],
            observedAt: timestamp,
            status: "active",
            updatedAt: timestamp,
          });
        }
      }



    }
  }
}
