import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { computeConfidence, type ConfidenceTier } from "./confidence";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
// Bounds the reads a single subscription can cost, whatever the client sends.
const MAX_PLACES = 100;

/**
 * S3-7 (US-23) — recent verifications across one place or a set of nearby
 * places, newest activity first.
 *
 * `verifications` has no time index, so the read is bounded by *scope*
 * instead: place → its active reports (`by_place`) → each report's votes
 * (`by_report`). With no scope the result is `[]` rather than a table scan; a
 * feed with no region has nothing meaningful to show.
 *
 * Live updates come from Convex itself — the query re-runs whenever any
 * document it read changes, so a vote on another device reaches every
 * `useQuery` subscriber without a refresh.
 *
 * Confidence is the place's, computed the same way `places.getPlace` does, so a
 * badge in the feed and the badge on the place detail cannot disagree. Emails
 * are never returned.
 */
export const recentVerifications = query({
  args: {
    placeId: v.optional(v.id("places")),
    placeIds: v.optional(v.array(v.id("places"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const scope = new Set<Id<"places">>(args.placeIds ?? []);
    if (args.placeId) scope.add(args.placeId);
    const limit = clampLimit(args.limit);
    const now = Date.now();

    const names = new Map<string, string>();
    const items: FeedItem[] = [];

    for (const placeId of [...scope].slice(0, MAX_PLACES)) {
      const place = await ctx.db.get(placeId);
      if (!place) continue;

      const reports = (
        await ctx.db
          .query("reports")
          .withIndex("by_place", (q) => q.eq("placeId", placeId))
          .collect()
      ).filter((r) => r.status === "active");
      if (reports.length === 0) continue;

      const votes: { vote: Doc<"verifications">; report: Doc<"reports"> }[] =
        [];
      for (const report of reports) {
        const rows = await ctx.db
          .query("verifications")
          .withIndex("by_report", (q) => q.eq("reportId", report._id))
          .collect();
        for (const vote of rows) votes.push({ vote, report });
      }
      if (votes.length === 0) continue;

      const lastReportedAt = Math.max(...reports.map((r) => r.observedAt));
      const confidence = computeConfidence({
        agreeCount: votes.filter((x) => x.vote.verdict === "confirm").length,
        totalVotes: votes.length,
        distinctVerifiers: new Set(votes.map((x) => x.vote.authorId)).size,
        reportAgeDays: Math.floor((now - lastReportedAt) / DAY_MS),
        now,
        lastVerifiedAt: lastReportedAt,
      });

      for (const { vote, report } of votes) {
        if (!names.has(vote.authorId)) {
          const author = await ctx.db.get(vote.authorId);
          // Same fallback chain as `reports.listForPlace`: blank strings are
          // storable, so `||` rather than `??`.
          names.set(
            vote.authorId,
            author?.displayName?.trim() ||
              author?.name?.trim() ||
              "A Wayble user",
          );
        }
        items.push({
          _id: vote._id,
          reportId: report._id,
          placeId,
          placeName: place.name,
          verifierId: vote.authorId,
          verifierName: names.get(vote.authorId) ?? "A Wayble user",
          verdict: vote.verdict,
          attributes: report.attributes.map((a) => ({
            key: a.key,
            value: a.value,
          })),
          updatedAt: vote.updatedAt,
          confidence: { tier: confidence.tier, isStale: confidence.isStale },
        });
      }
    }

    return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
  },
});

type FeedItem = {
  _id: Id<"verifications">;
  reportId: Id<"reports">;
  placeId: Id<"places">;
  placeName: string;
  verifierId: Id<"users">;
  verifierName: string;
  verdict: "confirm" | "dispute";
  attributes: Doc<"reports">["attributes"];
  updatedAt: number;
  confidence: { tier: ConfidenceTier; isStale: boolean };
};

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
}
