import { GeospatialIndex } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { SEED_PLACES } from "./seed/placesSeedData";
import { seedReportsFor } from "./seed/reportsSeedData";
import { ACCESSIBILITY_TAXONOMY_VERSION } from "./accessibility";

export const geo = new GeospatialIndex<
  string,
  { category: string; name: string }
>(components.geospatial);

/**
 * Seeds the database with real public spaces in Greater Colombo & Malabe.
 * Idempotent: checks for existing places by name to avoid duplicate insertions.
 *
 * `reseedReports: true` replaces the seed bot's own reports with a fresh
 * generation (see `seed/reportsSeedData.ts`) without touching places or any
 * report a real user wrote. Use it to move an existing dev database onto new
 * sample data: `convex run seed:seedPlaces '{"reseedReports": true}'`.
 */
export const seedPlaces = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
    reseedReports: v.optional(v.boolean()),
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
        // Derived in placesSeedData. Without these the seeded rows carry no
        // accessibility tags at all, and the mobile client's filter chips
        // match nothing against them.
        accessibilityCategories: item.accessibilityCategories,
        features: item.features,
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

    // 4. Sample reports for every place that has none yet.
    const removedReports = args.reseedReports
      ? await removeSeedReports(ctx, seedUser._id)
      : 0;
    const reports = await seedSampleReports(ctx, seedUser._id, now);

    return {
      totalInDataset: SEED_PLACES.length,
      inserted: insertedCount,
      skipped: skippedCount,
      currentTotalInDb: (await ctx.db.query("places").collect()).length,
      reportsRemoved: removedReports,
      reportsInserted: reports.inserted,
      placesWithSampleReports: reports.places,
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
 * Inserts generated sample reports for every place with no reports.
 *
 * A place that already has any report — a real user's, or the seed bot's
 * from an earlier run — is left alone, so seeded data never mixes into a
 * place someone actually assessed, and a re-run inserts nothing twice.
 *
 * Reads `reports` once rather than `by_place` per place: this runs over every
 * place in one mutation, and one scan is cheaper than 155 index reads.
 */
async function seedSampleReports(
  ctx: MutationCtx,
  authorId: Id<"users">,
  now: number,
) {
  const reported = new Set(
    (await ctx.db.query("reports").collect()).map((r) => r.placeId),
  );
  const places = await ctx.db.query("places").collect();

  let inserted = 0;
  let placesSeeded = 0;
  for (const place of places) {
    if (reported.has(place._id)) continue;
    const generated = seedReportsFor(place, now);
    if (generated.length === 0) continue;
    for (const report of generated) {
      await ctx.db.insert("reports", {
        placeId: place._id,
        authorId,
        taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
        attributes: report.attributes,
        summary: report.summary,
        evidence: [],
        observedAt: report.observedAt,
        status: "active",
        updatedAt: now,
      });
      inserted++;
    }
    placesSeeded++;
  }
  return { inserted, places: placesSeeded };
}

/**
 * Deletes every report the seed bot wrote, with the verifications and flags
 * that point at them, so nothing is left referencing a deleted report.
 * Reports by any other author are untouched.
 */
async function removeSeedReports(ctx: MutationCtx, authorId: Id<"users">) {
  const own = await ctx.db
    .query("reports")
    .withIndex("by_author", (q) => q.eq("authorId", authorId))
    .collect();
  for (const report of own) {
    for (const table of ["verifications", "flags"] as const) {
      const linked = await ctx.db
        .query(table)
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .collect();
      for (const row of linked) await ctx.db.delete(row._id);
    }
    await ctx.db.delete(report._id);
  }
  return own.length;
}
