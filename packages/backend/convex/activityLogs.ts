import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { activityRatingValidator, placeCategoryValidator } from "./schema";

/**
 * Activity Logs — personal and community accessibility visit journal with
 * Instagram-style media post features (photos, alt-text, helpful likes, tags).
 */

export const createLog = mutation({
  args: {
    placeId: v.optional(v.id("places")),
    placeName: v.string(),
    title: v.string(),
    notes: v.optional(v.string()),
    category: v.optional(placeCategoryValidator),
    accessibilityRating: activityRatingValidator,
    imageUrl: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visitedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "Unauthenticated: must be logged in to create an activity log",
      );
    }

    const trimmedTitle = args.title.trim();
    if (!trimmedTitle) {
      throw new Error("Title cannot be empty");
    }

    const trimmedPlaceName = args.placeName.trim();
    if (!trimmedPlaceName) {
      throw new Error("Place name cannot be empty");
    }

    const now = Date.now();
    const visitedAt = args.visitedAt ?? now;

    return await ctx.db.insert("activityLogs", {
      userId,
      placeId: args.placeId,
      placeName: trimmedPlaceName,
      title: trimmedTitle,
      notes: args.notes?.trim() || undefined,
      category: args.category,
      accessibilityRating: args.accessibilityRating,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageAlt: args.imageAlt?.trim() || undefined,
      helpfulCount: 0,
      helpfulUserIds: [],
      commentsCount: 0,
      tags: args.tags ?? [],
      visitedAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listMyLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort newest visit first
    logs.sort((a, b) => b.visitedAt - a.visitedAt);

    return logs.slice(0, limit);
  },
});

export const listPublicFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    const limit = Math.min(Math.max(args.limit ?? 30, 1), 50);

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);

    return await Promise.all(
      logs.map(async (log) => {
        const author = await ctx.db.get(log.userId);
        const authorName =
          author?.displayName || author?.name || "Community Member";
        const authorAvatar = author?.avatarUrl || author?.image;
        const helpfulUserIds = log.helpfulUserIds ?? [];
        const isHelpful = currentUserId
          ? helpfulUserIds.includes(currentUserId)
          : false;

        return {
          ...log,
          authorName,
          authorAvatar,
          isHelpful,
          helpfulCount: log.helpfulCount ?? helpfulUserIds.length,
          commentsCount: log.commentsCount ?? 0,
        };
      }),
    );
  },
});

export const toggleHelpful = mutation({
  args: {
    id: v.id("activityLogs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to react to posts");
    }

    const log = await ctx.db.get(args.id);
    if (!log) {
      throw new Error("Activity log not found");
    }

    const currentHelpful = new Set(log.helpfulUserIds ?? []);
    let isHelpfulNow = false;

    if (currentHelpful.has(userId)) {
      currentHelpful.delete(userId);
      isHelpfulNow = false;
    } else {
      currentHelpful.add(userId);
      isHelpfulNow = true;
    }

    const updatedUserIds = Array.from(currentHelpful);
    const updatedCount = updatedUserIds.length;

    await ctx.db.patch(args.id, {
      helpfulUserIds: updatedUserIds,
      helpfulCount: updatedCount,
    });

    return {
      helpfulCount: updatedCount,
      isHelpful: isHelpfulNow,
    };
  },
});

export const addComment = mutation({
  args: {
    logId: v.id("activityLogs"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to comment");
    }

    const trimmedText = args.text.trim();
    if (!trimmedText) {
      throw new Error("Comment cannot be empty");
    }

    if (trimmedText.length > 500) {
      throw new Error("Comment cannot exceed 500 characters");
    }

    const log = await ctx.db.get(args.logId);
    if (!log) {
      throw new Error("Activity log not found");
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("activityComments", {
      logId: args.logId,
      userId,
      text: trimmedText,
      createdAt: now,
    });

    const currentCount = log.commentsCount ?? 0;
    await ctx.db.patch(args.logId, {
      commentsCount: currentCount + 1,
    });

    return commentId;
  },
});

export const listComments = query({
  args: {
    logId: v.id("activityLogs"),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);
    if (!log) return [];

    const comments = await ctx.db
      .query("activityComments")
      .withIndex("by_log", (q) => q.eq("logId", args.logId))
      .collect();

    comments.sort((a, b) => a.createdAt - b.createdAt);

    const currentUserId = await getAuthUserId(ctx);

    return await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.userId);
        const authorName =
          author?.displayName || author?.name || "Community Member";
        const authorAvatar = author?.avatarUrl || author?.image;
        const isPostOwner = comment.userId === log.userId;
        const canDelete =
          currentUserId !== null &&
          (comment.userId === currentUserId || log.userId === currentUserId);

        return {
          ...comment,
          authorName,
          authorAvatar,
          isPostOwner,
          canDelete,
        };
      }),
    );
  },
});

export const removeComment = mutation({
  args: {
    commentId: v.id("activityComments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: must be logged in to delete a comment");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const log = await ctx.db.get(comment.logId);

    // User can delete if they wrote the comment OR if they are the post owner
    const isCommentAuthor = comment.userId === userId;
    const isPostOwner = log?.userId === userId;

    if (!isCommentAuthor && !isPostOwner) {
      throw new Error("Unauthorized to delete this comment");
    }

    await ctx.db.delete(args.commentId);

    if (log && (log.commentsCount ?? 0) > 0) {
      await ctx.db.patch(log._id, {
        commentsCount: Math.max(0, (log.commentsCount ?? 1) - 1),
      });
    }

    return args.commentId;
  },
});

export const getLog = query({
  args: {
    id: v.id("activityLogs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const log = await ctx.db.get(args.id);
    if (!log || log.userId !== userId) {
      return null;
    }

    return log;
  },
});

export const updateLog = mutation({
  args: {
    id: v.id("activityLogs"),
    placeId: v.optional(v.id("places")),
    placeName: v.string(),
    title: v.string(),
    notes: v.optional(v.string()),
    category: v.optional(placeCategoryValidator),
    accessibilityRating: activityRatingValidator,
    imageUrl: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visitedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "Unauthenticated: must be logged in to update an activity log",
      );
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Activity log not found");
    }

    if (existing.userId !== userId) {
      throw new Error("Unauthorized: cannot edit another user's activity log");
    }

    const trimmedTitle = args.title.trim();
    if (!trimmedTitle) {
      throw new Error("Title cannot be empty");
    }

    const trimmedPlaceName = args.placeName.trim();
    if (!trimmedPlaceName) {
      throw new Error("Place name cannot be empty");
    }

    await ctx.db.patch(args.id, {
      placeId: args.placeId,
      placeName: trimmedPlaceName,
      title: trimmedTitle,
      notes: args.notes?.trim() || undefined,
      category: args.category,
      accessibilityRating: args.accessibilityRating,
      imageUrl: args.imageUrl?.trim() || undefined,
      imageAlt: args.imageAlt?.trim() || undefined,
      tags: args.tags ?? existing.tags,
      visitedAt: args.visitedAt,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const removeLog = mutation({
  args: {
    id: v.id("activityLogs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "Unauthenticated: must be logged in to delete an activity log",
      );
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Activity log not found");
    }

    if (existing.userId !== userId) {
      throw new Error(
        "Unauthorized: cannot delete another user's activity log",
      );
    }

    // Cascade delete any comments on this log
    const comments = await ctx.db
      .query("activityComments")
      .withIndex("by_log", (q) => q.eq("logId", args.id))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        totalCount: 0,
        accessibleCount: 0,
        partialCount: 0,
        inaccessibleCount: 0,
      };
    }

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let accessibleCount = 0;
    let partialCount = 0;
    let inaccessibleCount = 0;

    for (const log of logs) {
      if (log.accessibilityRating === "accessible") {
        accessibleCount++;
      } else if (log.accessibilityRating === "partially_accessible") {
        partialCount++;
      } else if (log.accessibilityRating === "inaccessible") {
        inaccessibleCount++;
      }
    }

    return {
      totalCount: logs.length,
      accessibleCount,
      partialCount,
      inaccessibleCount,
    };
  },
});
