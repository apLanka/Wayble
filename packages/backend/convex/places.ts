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
