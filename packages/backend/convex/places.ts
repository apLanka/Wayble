import { getAuthUserId } from "@convex-dev/auth/server";
import { GeospatialIndex, point } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  accessibilityCategoryValidator,
  placeCategoryValidator,
} from "./schema";
import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "./accessibility";

// Component has no DB triggers — create/update/remove mutations below keep
// the places table and this index in sync manually, in the same mutation.
export const geo = new GeospatialIndex<Id<"places">, { category: string }>(
  components.geospatial,
);

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
        try {
          const place = await ctx.db.get(hit.key);
          return place && { ...place, distance: hit.distance };
        } catch {
          // Ignore invalid IDs from stale/corrupted index entries
          return null;
        }
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
    return await ctx.db
      .query("places")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(args.limit ?? 10);
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

    // Aggregate attributes using last-write-wins (most recent observedAt).
    // For each attribute key, keep the value from the report with the latest
    // observedAt timestamp.
    const attributeMap = new Map<
      AccessibilityAttributeKey,
      { attribute: AccessibilityAttribute; observedAt: number }
    >();

    for (const report of activeReports) {
      for (const attr of report.attributes) {
        const existing = attributeMap.get(attr.key);
        if (!existing || report.observedAt > existing.observedAt) {
          attributeMap.set(attr.key, {
            attribute: attr,
            observedAt: report.observedAt,
          });
        }
      }
    }

    const attributes = Array.from(attributeMap.values()).map(
      (entry) => entry.attribute,
    );

    // Determine the most recent report timestamp.
    const lastReportedAt =
      activeReports.length > 0
        ? Math.max(...activeReports.map((r) => r.observedAt))
        : null;

    return {
      _id: place._id,
      name: place.name,
      category: place.category,
      address: place.address,
      location: place.location,
      attributes,
      reportCount: activeReports.length,
      lastReportedAt,
    };
  },
});
