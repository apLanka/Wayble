import { v } from "convex/values";
import { query } from "./_generated/server";
import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "./accessibility";

/**
 * Fetches a single place by ID, joining its active reports and returning
 * aggregated accessibility attributes using a last-write-wins strategy
 * (most recent `observedAt` per attribute key).
 *
 * Public query — accessibility data should be viewable by anyone.
 */
export const getPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) {
      return null;
    }

    // Fetch all active reports for this place, ordered by the index.
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    const activeReports = reports.filter((r) => r.status === "active");

    // Aggregate attributes using last-write-wins (most recent observedAt).
    // For each attribute key, keep the value from the report with the latest
    // observedAt timestamp.
    const attributeMap = new Map<
      AccessibilityAttributeKey,
      { attribute: AccessibilityAttribute; observedAt: number }
    >();

    for (const report of activeReports) {
      for (const attr of report.attributes) {
        const existing = attributeMap.get(attr.key);
        if (!existing || report.observedAt > existing.observedAt) {
          attributeMap.set(attr.key, {
            attribute: attr,
            observedAt: report.observedAt,
          });
        }
      }
    }

    const attributes = Array.from(attributeMap.values()).map(
      (entry) => entry.attribute,
    );

    // Determine the most recent report timestamp.
    const lastReportedAt =
      activeReports.length > 0
        ? Math.max(...activeReports.map((r) => r.observedAt))
        : null;

    return {
      _id: place._id,
      name: place.name,
      category: place.category,
      address: place.address,
      location: place.location,
      attributes,
      reportCount: activeReports.length,
      lastReportedAt,
    };
  },
});
