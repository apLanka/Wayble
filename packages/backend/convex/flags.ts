import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { MAX_NOTE_LENGTH } from "./reportLimits";
import { flagReasonValidator } from "./schema";

export const flagReport = mutation({
  args: {
    reportId: v.id("reports"),
    reason: flagReasonValidator,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to flag a report");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error(`Unknown report: ${args.reportId}`);
    }

    if (report.authorId === userId) {
      throw new Error("Cannot flag your own report");
    }

    if (args.details !== undefined && args.reason !== "other") {
      throw new Error('details is only accepted when reason is "other"');
    }

    if (
      args.reason === "other" &&
      args.details &&
      args.details.length > MAX_NOTE_LENGTH
    ) {
      throw new Error(
        `Details too long: ${args.details.length} characters, maximum ${MAX_NOTE_LENGTH}`,
      );
    }

    const existing = await ctx.db
      .query("flags")
      .withIndex("by_report_and_author", (q) =>
        q.eq("reportId", args.reportId).eq("authorId", userId),
      )
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    if (existing) {
      throw new Error("You already flagged this report");
    }

    const id = await ctx.db.insert("flags", {
      reportId: args.reportId,
      authorId: userId,
      reason: args.reason,
      details: args.reason === "other" ? args.details : undefined,
      status: "open",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});
