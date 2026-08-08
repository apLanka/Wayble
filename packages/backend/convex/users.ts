import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  accessibilityAttributeKeyValidator,
  type AccessibilityAttributeKey,
} from "./accessibility";

export { getAuthUserId };

/**
 * Returns the currently authenticated user's profile, or null if unauthenticated.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

/**
 * Update the signed-in user's profile fields.
 *
 * Every field is optional and omitted fields are left untouched, so a caller
 * editing one part of the profile never clobbers another. `accessibilityNeeds`
 * is replaced wholesale rather than merged — passing `[]` clears it.
 *
 * Throws if called by an unauthenticated client.
 */
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    accessibilityNeeds: v.optional(v.array(accessibilityAttributeKeyValidator)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to update profile");
    }

    if (args.accessibilityNeeds !== undefined) {
      assertNoDuplicateNeeds(args.accessibilityNeeds);
    }

    await ctx.db.patch(userId, {
      ...(args.displayName !== undefined && { displayName: args.displayName }),
      ...(args.avatarUrl !== undefined && { avatarUrl: args.avatarUrl }),
      ...(args.accessibilityNeeds !== undefined && {
        accessibilityNeeds: args.accessibilityNeeds,
      }),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(userId);
  },
});

/**
 * The validator guarantees every entry is a known attribute key, but not that
 * the list is a set. Duplicates would double-count a need in downstream
 * matching (US-04 filtering, US-16 ranking), so reject them at the boundary.
 */
function assertNoDuplicateNeeds(needs: AccessibilityAttributeKey[]) {
  const seen = new Set<AccessibilityAttributeKey>();
  for (const key of needs) {
    if (seen.has(key)) {
      throw new Error(`Duplicate accessibility need: ${key}`);
    }
    seen.add(key);
  }
}

/** Default notification radius in metres, applied when a user opts in. */
export const DEFAULT_VERIFY_NEARBY_RADIUS_METERS = 2000;
const MIN_RADIUS_METERS = 250;
const MAX_RADIUS_METERS = 20_000;

/**
 * Rounds to 3 decimal places, roughly 110 m.
 *
 * The feature needs to know which neighbourhood someone is in, not where they
 * are standing, so precision beyond this is data we choose not to keep.
 */
export function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Records a coarse last-known location for the signed-in user.
 *
 * Called by the app on foreground transitions, throttled client-side. Never
 * prompts for permission itself — the caller only invokes this when foreground
 * location permission has already been granted.
 */
export const updateLastKnownLocation = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    timeZoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to report location");
    }

    await ctx.db.patch(userId, {
      lastKnownLocation: {
        latitude: roundCoordinate(args.latitude),
        longitude: roundCoordinate(args.longitude),
        updatedAt: Date.now(),
        timeZoneOffsetMinutes: args.timeZoneOffsetMinutes,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Updates nearby-verification notification preferences.
 *
 * Opting in for the first time applies the default radius, so an enabled user
 * always has one and the sweep never has to guess.
 */
export const updateNotificationPrefs = mutation({
  args: {
    verifyNearbyEnabled: v.optional(v.boolean()),
    verifyNearbyRadiusMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "Unauthenticated: must be logged in to update notification preferences",
      );
    }

    if (args.verifyNearbyRadiusMeters !== undefined) {
      const r = args.verifyNearbyRadiusMeters;
      if (r < MIN_RADIUS_METERS || r > MAX_RADIUS_METERS) {
        throw new Error(
          `Unsupported radius: ${r}m must be between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS}`,
        );
      }
    }

    const user = await ctx.db.get(userId);
    const enabling = args.verifyNearbyEnabled === true;
    const hasRadius =
      args.verifyNearbyRadiusMeters !== undefined ||
      user?.verifyNearbyRadiusMeters !== undefined;

    await ctx.db.patch(userId, {
      ...(args.verifyNearbyEnabled !== undefined && {
        verifyNearbyEnabled: args.verifyNearbyEnabled,
      }),
      ...(args.verifyNearbyRadiusMeters !== undefined && {
        verifyNearbyRadiusMeters: args.verifyNearbyRadiusMeters,
      }),
      ...(enabling &&
        !hasRadius && {
          verifyNearbyRadiusMeters: DEFAULT_VERIFY_NEARBY_RADIUS_METERS,
        }),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(userId);
  },
});
