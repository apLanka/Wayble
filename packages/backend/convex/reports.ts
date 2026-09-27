import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeValidator,
  type AccessibilityAttribute,
  type AccessibilityAttributeKey,
} from "./accessibility";
import {
  DUPLICATE_WINDOW_MS,
  MAX_CLOCK_SKEW_MS,
  MAX_NOTE_LENGTH,
  MAX_OBSERVATION_AGE_MS,
  MAX_SUMMARY_LENGTH,
} from "./reportLimits";

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

    const now = Date.now();

    if (
      !Number.isFinite(args.observedAt) ||
      args.observedAt > now + MAX_CLOCK_SKEW_MS ||
      args.observedAt < now - MAX_OBSERVATION_AGE_MS
    ) {
      throw new Error("Observation time is outside the allowed range");
    }

    const cutoff = now - DUPLICATE_WINDOW_MS;
    const recent = await ctx.db
      .query("reports")
      .withIndex("by_place_and_author", (q) =>
        q.eq("placeId", args.placeId).eq("authorId", userId),
      )
      // `.filter()` is handed a FilterBuilder rather than a document, so
      // the conditions are built from that builder and returned; see
      // places.ts:109 for the same form in production, and
      // sweep.test.ts:70 for a test-side example. This site composes two
      // conditions with `q.and(...)` rather than a lone `q.eq`.
      //
      // The window keys on `updatedAt`, the server clock value written at
      // insert time, so a caller cannot back-date `observedAt` past it and
      // escape the check.
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.gt(q.field("updatedAt"), cutoff),
        ),
      )
      .first();
    if (recent) {
      throw new Error(
        "Duplicate report: you already reported on this place in the last 24 hours",
      );
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
      updatedAt: now,
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

/**
 * US-10 — every active report on a place, with per-report verification tallies.
 *
 * This is the read path the app did not have. `places.getPlace` returns a
 * flattened aggregate — attributes, reportCount, lastReportedAt — and discards
 * the reports behind it, so before this there was no way for a user to see a
 * report in order to verify it.
 *
 * Only `status === "active"` is returned, deliberately: the place detail screen
 * shows an `N reports` badge computed from active reports (see `getPlace`), and
 * two numbers on one screen that disagree are worse than either.
 *
 * Tallying is one pass over `verifications` keyed by report id rather than a
 * `by_report` read per report, which would be 155 index reads for a fully
 * seeded place. The scan is over the whole table, so it is bounded by
 * verifications rather than by this place's reports; that is the trade, and it
 * is the right one until the table outgrows a single read.
 *
 * The author's `email` is never returned. A report is public, an address is
 * not, and this is a query any client can call.
 */
export const listForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    type Tally = {
      confirm: number;
      dispute: number;
      mine: "confirm" | "dispute" | null;
    };
    const tallies = new Map<string, Tally>();
    const verifications = await ctx.db.query("verifications").collect();
    for (const verification of verifications) {
      const current = tallies.get(verification.reportId) ?? {
        confirm: 0,
        dispute: 0,
        mine: null,
      };
      if (verification.verdict === "confirm") current.confirm += 1;
      else current.dispute += 1;
      if (verification.authorId === userId) current.mine = verification.verdict;
      tallies.set(verification.reportId, current);
    }

    const authors = new Map<string, string>();
    for (const id of new Set(reports.map((r) => r.authorId))) {
      const author = await ctx.db.get(id);
      authors.set(id, author?.displayName ?? author?.name ?? "A Wayble user");
    }

    return reports
      .filter((r) => r.status === "active")
      .map((r) => {
        const tally = tallies.get(r._id);
        return {
          _id: r._id,
          authorId: r.authorId,
          // The map already holds the fallback for a nameless author; this
          // second one is what keeps the field non-optional in the return type.
          authorDisplayName: authors.get(r.authorId) ?? "A Wayble user",
          summary: r.summary,
          attributes: r.attributes,
          observedAt: r.observedAt,
          confirmCount: tally?.confirm ?? 0,
          disputeCount: tally?.dispute ?? 0,
          myVerdict: tally?.mine ?? null,
        };
      })
      .sort((a, b) => b.observedAt - a.observedAt);
  },
});
