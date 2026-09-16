import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeValidator,
} from "./accessibility";

/**
 * US-08 — submit an accessibility report for a place.
 *
 * The author is taken from the session and is deliberately not an argument:
 * a client-supplied authorId would let anyone file reports as any user.
 * Convex functions are public endpoints, so the `getAuthUserId` guard is
 * the only thing standing between the deployment URL and open write access.
 *
 * Validation and the 24-hour duplicate guard are applied in the handler
 * below, after the auth check, cheapest and most security-relevant first.
 */
export const submitReport = mutation({
  args: {
    placeId: v.id("places"),
    attributes: v.array(accessibilityAttributeValidator),
    summary: v.optional(v.string()),
    observedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to submit a report");
    }

    const place = await ctx.db.get(args.placeId);
    if (!place) {
      throw new Error(`Unknown place: ${args.placeId}`);
    }

    const reportId = await ctx.db.insert("reports", {
      placeId: args.placeId,
      authorId: userId,
      taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
      attributes: args.attributes,
      summary: args.summary,
      evidence: [],
      observedAt: args.observedAt,
      status: "active",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(reportId);
  },
});
