import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { MAX_NOTE_LENGTH } from "./reportLimits";
import { verificationVerdictValidator } from "./schema";

/**
 * US-10 — confirm or dispute a report.
 *
 * The voter is taken from the session and is deliberately not an argument, for
 * the same reason `reports.submitReport` does the same: Convex functions are
 * public endpoints, so a client-supplied authorId would let anyone vote as
 * anyone.
 *
 * One row per (report, user), enforced by the `by_report_and_author` index,
 * so changing a vote patches rather than inserting. `reports.submitReport`
 * keeps its author out of its arguments for the same reason and is the model
 * for the guard ordering here: auth, then existence, then the rule that is
 * specific to this feature, then cost.
 */
export const verifyReport = mutation({
  args: {
    reportId: v.id("reports"),
    verdict: verificationVerdictValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to verify a report");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error(`Unknown report: ${args.reportId}`);
    }

    // The reason this is server-side. A UI that merely hid the control would
    // leave the endpoint open to anyone who reads the function name.
    if (report.authorId === userId) {
      throw new Error("Cannot verify your own report");
    }

    if (args.note !== undefined && args.note.length > MAX_NOTE_LENGTH) {
      throw new Error(
        `Note too long: ${args.note.length} characters, maximum ${MAX_NOTE_LENGTH}`,
      );
    }

    const existing = await ctx.db
      .query("verifications")
      .withIndex("by_report_and_author", (q) =>
        q.eq("reportId", args.reportId).eq("authorId", userId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        verdict: args.verdict,
        note: args.note,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("verifications", {
      reportId: args.reportId,
      authorId: userId,
      verdict: args.verdict,
      note: args.note,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});
