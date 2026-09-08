import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  type AccessibilityAttributeKey,
} from "./accessibility";

export type ConfidenceLevel =
  "high_confidence" | "confirmed" | "verified" | "under_review" | "disputed";

export type VerificationConfidence = {
  score: number;
  level: ConfidenceLevel;
  label: string;
};

/**
 * Calculates a confidence level and badge descriptor from confirmation & dispute counts.
 */
export function calculateConfidence(
  confirms: number,
  disputes: number,
): VerificationConfidence {
  const total = confirms + disputes;
  if (total === 0) {
    return {
      score: 50,
      level: "under_review",
      label: "Under Review",
    };
  }

  if (disputes > confirms) {
    return {
      score: Math.max(10, Math.round((confirms / total) * 100)),
      level: "disputed",
      label: "Disputed",
    };
  }

  if (confirms >= 3 && disputes === 0) {
    return {
      score: 95,
      level: "high_confidence",
      label: "High Confidence",
    };
  }

  if (confirms >= 2) {
    return {
      score: 80,
      level: "confirmed",
      label: "Community Confirmed",
    };
  }

  if (confirms === 1) {
    return {
      score: 65,
      level: "verified",
      label: "Verified",
    };
  }

  return {
    score: 50,
    level: "under_review",
    label: "Under Review",
  };
}

/**
 * Query recent community verifications.
 *
 * Supports:
 * - Specific `placeId` scoping
 * - Map region scoping via `placeIds` (array of nearby place IDs)
 * - Global recent feed when no place scoping is provided
 *
 * Returns fully enriched feed items with verifier, place, attributes,
 * verdict, note, and confidence metrics.
 */
export const recentVerifications = query({
  args: {
    placeId: v.optional(v.id("places")),
    placeIds: v.optional(v.array(v.id("places"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = Math.min(args.limit ?? 20, 100);

    let reportIdsToFetch: Set<string> | null = null;

    if (args.placeId) {
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_place", (q) => q.eq("placeId", args.placeId!))
        .collect();
      reportIdsToFetch = new Set(reports.map((r) => r._id));
    } else if (args.placeIds && args.placeIds.length > 0) {
      const allReports: Doc<"reports">[] = [];
      for (const pId of args.placeIds) {
        const reports = await ctx.db
          .query("reports")
          .withIndex("by_place", (q) => q.eq("placeId", pId))
          .collect();
        allReports.push(...reports);
      }
      reportIdsToFetch = new Set(allReports.map((r) => r._id));
    }

    // Fetch all verifications
    let verifications = await ctx.db.query("verifications").collect();

    // Filter by scoped report IDs if applicable
    if (reportIdsToFetch !== null) {
      verifications = verifications.filter((vRecord) =>
        reportIdsToFetch!.has(vRecord.reportId),
      );
    }

    // Sort descending by updatedAt
    verifications.sort((a, b) => b.updatedAt - a.updatedAt);

    // Limit records
    const sliced = verifications.slice(0, maxLimit);

    // Cache report, place, and user lookups
    const reportCache = new Map<string, Doc<"reports"> | null>();
    const placeCache = new Map<string, Doc<"places"> | null>();
    const userCache = new Map<string, Doc<"users"> | null>();
    const reportVerificationsCache = new Map<string, Doc<"verifications">[]>();

    const enrichedItems = await Promise.all(
      sliced.map(async (vRecord) => {
        // 1. Report
        let report = reportCache.get(vRecord.reportId);
        if (report === undefined) {
          report = await ctx.db.get(vRecord.reportId);
          reportCache.set(vRecord.reportId, report);
        }
        if (!report) return null;

        // 2. Place
        let place = placeCache.get(report.placeId);
        if (place === undefined) {
          place = await ctx.db.get(report.placeId);
          placeCache.set(report.placeId, place);
        }
        if (!place) return null;

        // 3. Verifier User
        let user = userCache.get(vRecord.authorId);
        if (user === undefined) {
          user = await ctx.db.get(vRecord.authorId);
          userCache.set(vRecord.authorId, user);
        }

        // 4. All verifications for this report to determine overall confidence
        let reportAllVerifications = reportVerificationsCache.get(
          vRecord.reportId,
        );
        if (reportAllVerifications === undefined) {
          reportAllVerifications = await ctx.db
            .query("verifications")
            .withIndex("by_report", (q) => q.eq("reportId", vRecord.reportId))
            .collect();
          reportVerificationsCache.set(
            vRecord.reportId,
            reportAllVerifications,
          );
        }

        const confirms = reportAllVerifications.filter(
          (vItem) => vItem.verdict === "confirm",
        ).length;
        const disputes = reportAllVerifications.filter(
          (vItem) => vItem.verdict === "dispute",
        ).length;
        const confidence = calculateConfidence(confirms, disputes);

        const primaryAttribute =
          report.attributes.length > 0 ? report.attributes[0] : null;

        return {
          _id: vRecord._id,
          reportId: vRecord.reportId,
          verdict: vRecord.verdict,
          note: vRecord.note,
          updatedAt: vRecord.updatedAt,
          confidence,
          totalVerifications: reportAllVerifications.length,
          verifier: {
            _id: vRecord.authorId,
            name: user?.displayName || user?.name || "Community Member",
            avatarUrl: user?.avatarUrl || user?.image || null,
            role: user?.role || "member",
          },
          place: {
            _id: place._id,
            name: place.name,
            category: place.category,
            address: place.address,
            location: place.location,
          },
          primaryAttribute,
          attributes: report.attributes,
        };
      }),
    );

    return enrichedItems.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
  },
});

/**
 * Submit a verification on an existing accessibility report.
 */
export const submitVerification = mutation({
  args: {
    reportId: v.id("reports"),
    verdict: v.union(v.literal("confirm"), v.literal("dispute")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = await getAuthUserId(ctx);

    // If no authenticated user, resolve or create a fallback community user for demo/guest support
    if (!userId) {
      const guestUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", "community@wayble.app"))
        .first();
      if (!guestUser) {
        const guestId = await ctx.db.insert("users", {
          name: "Community Verifier",
          displayName: "Active Contributor",
          email: "community@wayble.app",
          role: "member",
          updatedAt: Date.now(),
        });
        userId = guestId;
      } else {
        userId = guestUser._id;
      }
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    const now = Date.now();

    // Check if verification already exists from this author
    const existing = await ctx.db
      .query("verifications")
      .withIndex("by_report_and_author", (q) =>
        q.eq("reportId", args.reportId).eq("authorId", userId!),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        verdict: args.verdict,
        note: args.note,
        updatedAt: now,
      });
      return existing._id;
    }

    const verificationId = await ctx.db.insert("verifications", {
      reportId: args.reportId,
      authorId: userId,
      verdict: args.verdict,
      note: args.note,
      updatedAt: now,
    });

    return verificationId;
  },
});

/**
 * Helper mutation to verify a place directly.
 * Locates the active report or creates a base report if none exists,
 * then records the verification. Useful for UI actions and two-device demo testing.
 */
export const submitPlaceVerification = mutation({
  args: {
    placeId: v.id("places"),
    attributeKey: v.optional(v.string()),
    attributeValue: v.optional(v.string()),
    verdict: v.union(v.literal("confirm"), v.literal("dispute")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = await getAuthUserId(ctx);
    if (!userId) {
      const guestUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", "community@wayble.app"))
        .first();
      if (!guestUser) {
        const guestId = await ctx.db.insert("users", {
          name: "Community Verifier",
          displayName: "Active Contributor",
          email: "community@wayble.app",
          role: "member",
          updatedAt: Date.now(),
        });
        userId = guestId;
      } else {
        userId = guestUser._id;
      }
    }

    const place = await ctx.db.get(args.placeId);
    if (!place) {
      throw new Error("Place not found");
    }

    const now = Date.now();

    // Find active report or create one
    let report = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!report) {
      const defaultAttributeKey =
        (args.attributeKey as AccessibilityAttributeKey) ||
        "mobility.step_free_entrance";
      const defaultAttributeValue =
        (args.attributeValue as "yes" | "no" | "partial") || "yes";

      const reportId = await ctx.db.insert("reports", {
        placeId: args.placeId,
        authorId: userId,
        taxonomyVersion: ACCESSIBILITY_TAXONOMY_VERSION,
        attributes: [
          {
            key: defaultAttributeKey,
            value: defaultAttributeValue,
            note: args.note,
          },
        ],
        summary: "Community accessibility assessment",
        evidence: [],
        observedAt: now,
        status: "active",
        updatedAt: now,
      });
      report = (await ctx.db.get(reportId))!;
    }

    // Insert verification
    const verificationId = await ctx.db.insert("verifications", {
      reportId: report._id,
      authorId: userId,
      verdict: args.verdict,
      note: args.note,
      updatedAt: now,
    });

    return verificationId;
  },
});
