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
