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
import { MAX_NOTE_LENGTH } from "./reportLimits";
import { userRoleValidator } from "./schema";

/**
 * S4-7 (US-14 lite) — the moderator's view of flagged reports.
 *
 * A report is "flagged" while at least one of its `flags` rows is `open`.
 * Dismissing closes those rows and leaves the report alone. Removing (S4-7b)
 * also takes the report out of circulation by marking it `removed`.
 */

const HISTORY_LIMIT = 50;

/** Trims a moderator note; blank means "no note"; over-long is rejected. */
function cleanNote(note: string | undefined): string | undefined {
  const trimmed = note?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_NOTE_LENGTH) {
    throw new Error(
      `Note too long: ${trimmed.length} characters, maximum ${MAX_NOTE_LENGTH}`,
    );
  }
  return trimmed;
}

async function openFlagsFor(
  ctx: QueryCtx | MutationCtx,
  reportId: Doc<"reports">["_id"],
) {
  return await ctx.db
    .query("flags")
    .withIndex("by_report", (q) => q.eq("reportId", reportId))
    .filter((q) => q.eq(q.field("status"), "open"))
    .collect();
}

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
  args: { reportId: v.id("reports"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const moderator = await requireModerator(ctx);
    const note = cleanNote(args.note);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error(`Unknown report: ${args.reportId}`);
    }

    const openFlags = await openFlagsFor(ctx, args.reportId);

    if (openFlags.length === 0) {
      throw new Error("No open flags on this report");
    }

    const now = Date.now();
    for (const flag of openFlags) {
      await ctx.db.patch(flag._id, {
        status: "dismissed",
        resolvedBy: moderator._id,
        resolvedAt: now,
        resolutionNote: note,
        updatedAt: now,
      });
    }

    return openFlags.length;
  },
});

/**
 * S4-7b — upholds the flags: the report is marked `removed` (so place detail,
 * the reports list and the confidence maths stop seeing it) and its open flags
 * are `resolved`. Like `dismissFlag` it needs an open flag, so removal is a
 * decision about a flagged report rather than a general-purpose delete.
 */
export const removeReport = mutation({
  args: { reportId: v.id("reports"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const moderator = await requireModerator(ctx);
    const note = cleanNote(args.note);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error(`Unknown report: ${args.reportId}`);
    }
    if (report.status === "removed") {
      throw new Error("Report already removed");
    }

    const openFlags = await openFlagsFor(ctx, args.reportId);
    if (openFlags.length === 0) {
      throw new Error("No open flags on this report");
    }

    const now = Date.now();
    await ctx.db.patch(report._id, { status: "removed", updatedAt: now });
    for (const flag of openFlags) {
      await ctx.db.patch(flag._id, {
        status: "resolved",
        resolvedBy: moderator._id,
        resolvedAt: now,
        resolutionNote: note,
        updatedAt: now,
      });
    }

    return openFlags.length;
  },
});

/**
 * S4-7b — past decisions, newest first. All flags closed by one action share
 * the same `resolvedAt`, so (reportId, resolvedAt) identifies one decision.
 */
export const getResolvedFlags = query({
  args: {},
  handler: async (ctx) => {
    await requireModerator(ctx);

    const flags = await ctx.db.query("flags").collect();
    const closed = flags.filter(
      (flag) =>
        (flag.status === "resolved" || flag.status === "dismissed") &&
        flag.resolvedAt !== undefined,
    );

    const groups = new Map<string, Doc<"flags">[]>();
    for (const flag of closed) {
      const key = `${flag.reportId}:${flag.resolvedAt}`;
      const group = groups.get(key);
      if (group) group.push(flag);
      else groups.set(key, [flag]);
    }

    const ordered = [...groups.values()]
      .sort((a, b) => (b[0]?.resolvedAt ?? 0) - (a[0]?.resolvedAt ?? 0))
      .slice(0, HISTORY_LIMIT);

    const names = new Map<string, string>();
    const items = [];
    for (const group of ordered) {
      const [first] = group;
      if (!first || first.resolvedAt === undefined) continue;
      const report = await ctx.db.get(first.reportId);
      if (!report) continue;
      const place = await ctx.db.get(report.placeId);
      if (!place) continue;

      let resolvedByName = "A moderator";
      if (first.resolvedBy) {
        const cached = names.get(first.resolvedBy);
        if (cached) resolvedByName = cached;
        else {
          const user = await ctx.db.get(first.resolvedBy);
          resolvedByName =
            user?.displayName?.trim() || user?.name?.trim() || "A moderator";
          names.set(first.resolvedBy, resolvedByName);
        }
      }

      const reasonCounts = new Map<Doc<"flags">["reason"], number>();
      for (const flag of group) {
        reasonCounts.set(flag.reason, (reasonCounts.get(flag.reason) ?? 0) + 1);
      }

      items.push({
        reportId: report._id,
        placeName: place.name,
        summary: report.summary,
        outcome:
          first.status === "resolved"
            ? ("removed" as const)
            : ("dismissed" as const),
        flagCount: group.length,
        reasons: [...reasonCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([reason]) => reason),
        resolutionNote: first.resolutionNote,
        resolvedByName,
        resolvedAt: first.resolvedAt,
      });
    }

    return items;
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
