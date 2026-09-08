import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ACCESSIBILITY_TAXONOMY_VERSION } from "./accessibility";

/**
 * Debug-only mutation: exercises the report/verification pipeline end to
 * end without a full authoring UI. Ensures the place has a report (creates
 * a minimal one if not), then appends one verification vote from a fresh
 * throwaway user — so agreeCount/totalVotes/distinctVerifiers, and
 * therefore getPlace's confidence tier, actually move. Debug screen only.
 */
export const debugAddVerification = mutation({
  args: {
    placeId: v.id("places"),
    verdict: v.union(v.literal("confirm"), v.literal("dispute")),
  },
  handler: async (ctx, { placeId, verdict }) => {
    const now = Date.now();

    const voterId = await ctx.db.insert("users", {
      name: "Debug Voter",
      displayName: "Debug Voter",
      email: `debug-voter-${now}-${Math.random().toString(36).slice(2)}@wayble.app`,
      role: "member",
      updatedAt: now,
    });

    let report = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", placeId))
      .first();

    if (!report) {
      const reportId = await ctx.db.insert("reports", {
        placeId,
        authorId: voterId,
        taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
        attributes: [
          {
            key: "mobility.step_free_entrance",
            value: "yes",
            note: "Debug seed report",
          },
        ],
        summary: "Debug seed report.",
        evidence: [],
        observedAt: now,
        status: "active",
        updatedAt: now,
      });
      report = await ctx.db.get(reportId);
    }
    if (!report) throw new Error("Failed to create debug report");

    await ctx.db.insert("verifications", {
      reportId: report._id,
      authorId: voterId,
      verdict,
      updatedAt: now,
    });

    return { reportId: report._id };
  },
});
