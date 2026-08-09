import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

const platformValidator = v.union(v.literal("ios"), v.literal("android"));

/**
 * Registers this device's Expo push token for the signed-in user.
 *
 * Upserts by token rather than by user: one user has many devices, and a
 * token can move between accounts on a shared handset, in which case the
 * existing row is reassigned instead of a duplicate being created.
 * Re-registering also clears `disabledAt`, so a device that Expo previously
 * reported as unregistered starts receiving pushes again.
 */
export const register = mutation({
  args: {
    token: v.string(),
    platform: platformValidator,
    deviceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "Unauthenticated: must be logged in to register a device",
      );
    }

    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        platform: args.platform,
        ...(args.deviceName !== undefined && { deviceName: args.deviceName }),
        updatedAt: Date.now(),
        disabledAt: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushTokens", {
      userId,
      token: args.token,
      platform: args.platform,
      deviceName: args.deviceName,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Removes this device's token. Called on sign-out so a shared handset stops
 * receiving the previous account's notifications.
 */
export const unregister = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to unregister");
    }

    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    // Only the owner may remove a token, so one account cannot silence another.
    if (existing && existing.userId === userId) {
      await ctx.db.delete(existing._id);
    }
  },
});
