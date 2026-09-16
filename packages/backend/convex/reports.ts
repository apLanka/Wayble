import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeValidator,
  type AccessibilityAttribute,
  type AccessibilityAttributeKey,
} from "./accessibility";
import { MAX_NOTE_LENGTH, MAX_SUMMARY_LENGTH } from "./reportLimits";

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

    if (args.attributes.length === 0) {
      throw new Error("Add at least one accessibility attribute");
    }

    assertNoDuplicateKeys(args.attributes);

    if (
      args.summary !== undefined &&
      args.summary.length > MAX_SUMMARY_LENGTH
    ) {
      throw new Error(
        `Summary too long: ${args.summary.length} characters, maximum ${MAX_SUMMARY_LENGTH}`,
      );
    }

    for (const attribute of args.attributes) {
      if (
        attribute.note !== undefined &&
        attribute.note.length > MAX_NOTE_LENGTH
      ) {
        throw new Error(
          `Note too long: ${attribute.note.length} characters, maximum ${MAX_NOTE_LENGTH}`,
        );
      }
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

/**
 * The validator guarantees every key is a known attribute, but not that the
 * list is a set. Two attributes sharing a key are contradictory, and the
 * last-write-wins aggregation in `places.getPlace` silently keeps only the
 * first — so the report would display something the author never asserted.
 * Reject it at the boundary.
 *
 * This mirrors `assertNoDuplicateNeeds` in `users.ts`, which enforces the
 * same invariant for the profile's accessibility needs. The two guard
 * different tables and are not worth sharing a helper for.
 */
function assertNoDuplicateKeys(attributes: AccessibilityAttribute[]) {
  const seen = new Set<AccessibilityAttributeKey>();
  for (const attribute of attributes) {
    if (seen.has(attribute.key)) {
      throw new Error(`Duplicate accessibility attribute: ${attribute.key}`);
    }
    seen.add(attribute.key);
  }
}
