import { getAuthUserId } from "@convex-dev/auth/server";
import { GeospatialIndex, point } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import {
  accessibilityCategoryValidator,
  placeCategoryValidator,
} from "./schema";
import { computeConfidence } from "./confidence";
import { aggregateAttributes } from "./placeAttributes";

const DAY_MS = 24 * 60 * 60 * 1000;

// Component has no DB triggers — create/update/remove mutations below keep
// the places table and this index in sync manually, in the same mutation.
export const geo = new GeospatialIndex<Id<"places">, { category: string }>(
  components.geospatial,
);

/**
 * US-16 — a place with its current accessibility attributes, so a results
 * list can be ranked against the user's needs without a `getPlace` per row.
 *
 * One `by_place` read per place, so `nearest` and `search` cost up to `limit`
 * extra index reads a call, and re-run whenever any listed place's reports
 * change. That is the same per-place read `getPlace` makes, and fine at this
 * data size; if it grows, the aggregate belongs on the `places` row, updated
 * by `submitReport`, rather than recomputed per list.
 */
async function withAttributes<T extends Doc<"places">>(
  ctx: QueryCtx,
  place: T,
) {
  const reports = await ctx.db
    .query("reports")
    .withIndex("by_place", (q) => q.eq("placeId", place._id))
    .collect();
  return { ...place, attributes: aggregateAttributes(reports) };
}

export const nearest = query({
  args: {
    point,
    limit: v.optional(v.number()),
    maxDistance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hits = await geo.nearest(ctx, {
      point: args.point,
      limit: args.limit ?? 10,
      maxDistance: args.maxDistance,
    });
    const places = await Promise.all(
      hits.map(async (hit) => {
        let place: Doc<"places"> | null;
        try {
          place = await ctx.db.get(hit.key);
        } catch {
          // Ignore invalid IDs from stale/corrupted index entries
          return null;
        }
        if (!place) return null;
        // Outside the try on purpose: it exists for bad index IDs, and a
        // failed reports read should fail the query, not silently drop a row.
        return {
          ...(await withAttributes(ctx, place)),
          distance: hit.distance,
        };
      }),
    );
    return places.filter((p) => p !== null);
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const places = await ctx.db
      .query("places")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(args.limit ?? 10);
    return await Promise.all(places.map((p) => withAttributes(ctx, p)));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: placeCategoryValidator,
    address: v.string(),
    location: v.object({ latitude: v.number(), longitude: v.number() }),
    accessibilityCategories: v.optional(
      v.array(accessibilityCategoryValidator),
    ),
    features: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated: must be logged in");

    const placeId = await ctx.db.insert("places", {
      ...args,
      createdBy: userId,
      updatedAt: Date.now(),
    });
    await geo.insert(ctx, placeId, args.location, {
      category: args.category,
    });
    return placeId;
  },
});

// One-shot dev seed for the mobile map — no-op once places already exist.
export const seedMockPlaces = mutation({
  args: {
    places: v.array(
      v.object({
        name: v.string(),
        address: v.string(),
        location: v.object({ latitude: v.number(), longitude: v.number() }),
        accessibilityCategory: accessibilityCategoryValidator,
        features: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated: must be logged in");

    for (const p of args.places) {
      const existing = await ctx.db
        .query("places")
        .filter((q) => q.eq(q.field("name"), p.name))
        .first();

      if (existing) continue;

      const placeId = await ctx.db.insert("places", {
        name: p.name,
        category: "other",
        address: p.address,
        location: p.location,
        accessibilityCategories: [p.accessibilityCategory],
        features: p.features,
        createdBy: userId,
        updatedAt: Date.now(),
      });
      await geo.insert(ctx, placeId, p.location, { category: "other" });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("places"),
    name: v.optional(v.string()),
    category: v.optional(placeCategoryValidator),
    address: v.optional(v.string()),
    location: v.optional(
      v.object({ latitude: v.number(), longitude: v.number() }),
    ),
  },
  handler: async (ctx, { id, ...patch }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Place not found");

    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });

    // insert() upserts — re-run whenever location or category could change.
    if (patch.location || patch.category) {
      await geo.insert(ctx, id, patch.location ?? existing.location, {
        category: patch.category ?? existing.category,
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("places") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    await geo.remove(ctx, args.id);
  },
});

// Debug-only: populates the place picker on the debug screen. No pagination
// — capped list is fine for that use case, add real pagination if this ever
// serves a user-facing list.
export const listPlaces = query({
  args: {},
  handler: async (ctx) => {
    const places = await ctx.db.query("places").take(100);
    return places.map((p) => ({ _id: p._id, name: p.name }));
  },
});

export const getPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) {
      return null;
    }

    // Fetch all active reports for this place, ordered by the index.
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    const activeReports = reports.filter((r) => r.status === "active");

    // Last-write-wins per key over active reports. Shared with `nearest` and
    // `search` so a place's ranking and its detail screen use one rule.
    const attributes = aggregateAttributes(reports);

    // Determine the most recent report timestamp.
    const lastReportedAt =
      activeReports.length > 0
        ? Math.max(...activeReports.map((r) => r.observedAt))
        : null;

    // Whole-place confidence, not per-attribute — the attribute merge above
    // already discards per-report lineage, so there is no per-attribute
    // signal left to aggregate against.
    const allVerifications = (
      await Promise.all(
        activeReports.map((r) =>
          ctx.db
            .query("verifications")
            .withIndex("by_report", (q) => q.eq("reportId", r._id))
            .collect(),
        ),
      )
    ).flat();

    const agreeCount = allVerifications.filter(
      (ver) => ver.verdict === "confirm",
    ).length;
    const totalVotes = allVerifications.length;
    const distinctVerifiers = new Set(
      allVerifications.map((ver) => ver.authorId),
    ).size;

    const confidence = computeConfidence({
      agreeCount,
      totalVotes,
      distinctVerifiers,
      reportAgeDays: lastReportedAt
        ? Math.floor((Date.now() - lastReportedAt) / DAY_MS)
        : Infinity,
      now: Date.now(),
      lastVerifiedAt: lastReportedAt,
    });

    return {
      _id: place._id,
      name: place.name,
      category: place.category,
      address: place.address,
      location: place.location,
      accessibilityCategories: place.accessibilityCategories,
      attributes,
      reportCount: activeReports.length,
      lastReportedAt,
      confidence,
    };
  },
});

/**
 * Every place, with no location requirement.
 *
 * Exists for the debug screen, which has to stay useful when the device has
 * no location fix — `nearest` needs a point and `search` needs a query
 * string, so between them a simulator with no simulated location shows an
 * empty list even when the table is full. This query is the escape hatch that
 * proves the data is there.
 *
 * `reportCount` is grouped in JS from a single pass over the reports table
 * rather than a `by_place` read per place: the debug view is the only caller,
 * and 155 index reads would be a poor trade for a screen someone opens by
 * hand. If this ever grows a real caller, that trade should be revisited.
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const places = await ctx.db.query("places").collect();

    // Counts only active reports, matching `getPlace`, so a card and the
    // place detail it opens cannot disagree about the number.
    const counts = new Map<string, number>();
    for (const report of await ctx.db.query("reports").collect()) {
      if (report.status !== "active") continue;
      counts.set(report.placeId, (counts.get(report.placeId) ?? 0) + 1);
    }

    return (
      places
        .map((place) => ({
          _id: place._id,
          name: place.name,
          category: place.category,
          address: place.address,
          location: place.location,
          accessibilityCategories: place.accessibilityCategories ?? [],
          reportCount: counts.get(place._id) ?? 0,
        }))
        // Alphabetical so the list does not reshuffle between reloads, which
        // would make it impossible to tell "new row appeared" from "everything
        // moved".
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, args.limit ?? 200)
    );
  },
});
