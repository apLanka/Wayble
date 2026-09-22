import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { userRoleValidator } from "./schema";

/**
 * S4-7 (US-14 lite) — the moderator's view of flagged reports.
 *
 * A report is "flagged" while at least one of its `flags` rows is `open`.
 * Dismissing closes those rows; the report itself is never modified.
 */

/**
 * Resolves the caller and throws unless they hold the moderator role.
 * `admin` is deliberately not implied: the ticket gates on `moderator`.
 */
async function requireModerator(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthenticated: must be logged in");
  }
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "moderator") {
    throw new Error("Forbidden: moderator role required");
  }
  return user;
}

export const getFlaggedReports = query({
  args: {},
  handler: async (ctx) => {
    await requireModerator(ctx);

    // No status index on `flags`; the open set is small, so filter after read.
    const flags = await ctx.db.query("flags").collect();
    const openFlags = flags.filter((flag) => flag.status === "open");

    const byReport = new Map<string, Doc<"flags">[]>();
    for (const flag of openFlags) {
      const group = byReport.get(flag.reportId);
      if (group) group.push(flag);
      else byReport.set(flag.reportId, [flag]);
    }

    const items = [];
    for (const group of byReport.values()) {
      const [first] = group;
      if (!first) continue;
      const report = await ctx.db.get(first.reportId);
      if (!report) continue;
      const place = await ctx.db.get(report.placeId);
      if (!place) continue;

      const reasonCounts = new Map<Doc<"flags">["reason"], number>();
      for (const flag of group) {
        reasonCounts.set(flag.reason, (reasonCounts.get(flag.reason) ?? 0) + 1);
      }
      const reasons = [...reasonCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([reason]) => reason);

      items.push({
        reportId: report._id,
        placeId: place._id,
        placeName: place.name,
        summary: report.summary,
        flagCount: group.length,
        reasons,
        details: group.flatMap((flag) => (flag.details ? [flag.details] : [])),
        lastFlaggedAt: Math.max(...group.map((flag) => flag._creationTime)),
      });
    }

    return items.sort((a, b) => b.lastFlaggedAt - a.lastFlaggedAt);
  },
});

export const dismissFlag = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const moderator = await requireModerator(ctx);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error(`Unknown report: ${args.reportId}`);
    }

    const openFlags = await ctx.db
      .query("flags")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    if (openFlags.length === 0) {
      throw new Error("No open flags on this report");
    }

    const now = Date.now();
    for (const flag of openFlags) {
      await ctx.db.patch(flag._id, {
        status: "dismissed",
        resolvedBy: moderator._id,
        resolvedAt: now,
        updatedAt: now,
      });
    }

    return openFlags.length;
  },
});

/**
 * Operator-only: assigns a role by email. Internal, so it is callable from
 * the Convex dashboard / CLI but never from an app client — roles must not be
 * self-assignable at sign-up.
 *
 *   bunx convex run moderation:setUserRole '{"email":"a@b.com","role":"moderator"}'
 */
export const setUserRole = internalMutation({
  args: { email: v.string(), role: userRoleValidator },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (!user) {
      throw new Error(`No user with email: ${args.email}`);
    }
    await ctx.db.patch(user._id, { role: args.role, updatedAt: Date.now() });
    return { userId: user._id, role: args.role };
  },
});
