import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import type { Id } from "../_generated/dataModel";

const modules = import.meta.glob("../**/*.*s");

async function seedAuthor(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const authorId = await ctx.db.insert("users", {
      email: "author@example.com",
      displayName: "Report Author",
      role: "member",
      updatedAt: 1,
    });
    const ownerId = await ctx.db.insert("users", {
      email: "owner@example.com",
      displayName: "Place Owner",
      role: "member",
      updatedAt: 1,
    });
    const placeId = await ctx.db.insert("places", {
      name: "Community Library",
      category: "education",
      address: "1 Main Street",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: ownerId,
      updatedAt: 1,
    });
    return { authorId, placeId };
  });
}

const validAttribute = {
  key: "mobility.step_free_entrance" as const,
  value: "yes" as const,
};

describe("US-08 report submission", () => {
  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedAuthor(t);

    await expect(
      t.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Unauthenticated");

    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(0);
  });

  test("persists a report and derives the author from the session", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const observedAt = Date.now();

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [
        validAttribute,
        { key: "mobility.elevator", value: "partial", note: "Keypad is tall." },
      ],
      summary: "Library entrance is step free.",
      observedAt,
    });

    // The place's creator is a different user, so an authorId of
    // place.createdBy would fail this assertion rather than pass by
    // coincidence.
    const placeRow = await t.run(async (ctx) => ctx.db.get(placeId));
    expect(placeRow?.createdBy).not.toBe(userId);
    expect(created?.authorId).toBe(userId);
    expect(created?.placeId).toBe(placeId);
    expect(created?.taxonomyVersion).toBe(1);
    expect(created?.status).toBe("active");
    expect(created?.summary).toBe("Library entrance is step free.");
    expect(created?.observedAt).toBe(observedAt);
    expect(created?.evidence).toEqual([]);
    expect(created?.attributes).toHaveLength(2);

    const stored = await t.run(async (ctx) =>
      ctx.db
        .query("reports")
        .withIndex("by_place_and_author", (q) =>
          q.eq("placeId", placeId).eq("authorId", userId),
        )
        .collect(),
    );
    expect(stored).toHaveLength(1);
  });

  test("rejects an empty attributes array", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Add at least one accessibility attribute");
  });

  test("rejects duplicate attribute keys", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [
          validAttribute,
          { key: "mobility.step_free_entrance", value: "no" },
        ],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow(
      "Duplicate accessibility attribute: mobility.step_free_entrance",
    );
  });

  test("rejects a summary over the cap", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        summary: "x".repeat(501),
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Summary too long: 501 characters, maximum 500");
  });

  test("accepts a summary exactly at the cap", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const summary = "x".repeat(500);

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      summary,
      observedAt: Date.now(),
    });

    expect(created?.summary).toBe(summary);
  });

  test("rejects a per-attribute note over the cap", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [
          validAttribute,
          {
            key: "mobility.elevator",
            value: "partial",
            note: "x".repeat(281),
          },
        ],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Note too long: 281 characters, maximum 280");
  });

  test("rejects a place that does not exist", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    // Convex validates `v.id("places")` as a well-formed id, not as a row
    // that still exists, so a deleted row is the only way to reach the
    // handler's existence check.
    const ghostPlaceId = await t.run(async (ctx) => {
      const ghost = await ctx.db.insert("places", {
        name: "Ghost Place",
        category: "other",
        address: "Nowhere",
        location: { latitude: 6.9, longitude: 79.8 },
        createdBy: userId,
        updatedAt: 1,
      });
      await ctx.db.delete(ghost);
      return ghost;
    });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId: ghostPlaceId,
        attributes: [validAttribute],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Unknown place");
  });

  test("rejects an observedAt beyond the forward clock-skew tolerance", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        observedAt: Date.now() + 10 * 60 * 1000,
      }),
    ).rejects.toThrow("Observation time is outside the allowed range");
  });

  test("accepts an observedAt inside the forward clock-skew tolerance", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const observedAt = Date.now() + 60 * 1000;

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      observedAt,
    });

    expect(created?.observedAt).toBe(observedAt);
  });

  test("rejects a second report on the same place within 24 hours", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      observedAt: Date.now() - 60 * 1000,
    });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow(
      "Duplicate report: you already reported on this place in the last 24 hours",
    );
  });

  test("allows a new report once the previous one is older than 24 hours", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await t.run(async (ctx) => {
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [validAttribute],
        evidence: [],
        observedAt: Date.now() - 25 * 60 * 60 * 1000,
        status: "active",
        updatedAt: Date.now() - 25 * 60 * 60 * 1000,
      });
    });

    await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      observedAt: Date.now(),
    });

    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(2);
  });

  test("ignores a removed prior report when applying the 24 hour guard", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    // Filed a minute ago, so only the status filter can let this through.
    await t.run(async (ctx) => {
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [validAttribute],
        evidence: [],
        observedAt: Date.now() - 60 * 1000,
        status: "removed",
        updatedAt: Date.now() - 60 * 1000,
      });
    });

    await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      observedAt: Date.now(),
    });

    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(2);
  });

  test("rejects a repeat report even when the prior one back-dates observedAt", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    // The prior report claims to have been observed 25 hours ago, but it was
    // FILED a minute ago. Keying the duplicate window on observedAt would let
    // this through; keying it on updatedAt does not.
    await t.run(async (ctx) => {
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [validAttribute],
        evidence: [],
        observedAt: Date.now() - 25 * 60 * 60 * 1000,
        status: "active",
        updatedAt: Date.now() - 60 * 1000,
      });
    });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Duplicate report:");
  });

  test("rejects a NaN observedAt", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        observedAt: Number.NaN,
      }),
    ).rejects.toThrow("Observation time is outside the allowed range");
  });

  test("rejects an observedAt older than the maximum observation age", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        observedAt: Date.now() - 366 * 24 * 60 * 60 * 1000,
      }),
    ).rejects.toThrow("Observation time is outside the allowed range");
  });

  test("accepts an observedAt exactly at the forward clock-skew tolerance", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const observedAt = Date.now() + 5 * 60 * 1000;

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      observedAt,
    });

    expect(created?.observedAt).toBe(observedAt);
  });

  test("allows a new report once the prior one is exactly 24 hours old", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await t.run(async (ctx) => {
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [validAttribute],
        evidence: [],
        observedAt: Date.now() - 24 * 60 * 60 * 1000,
        status: "active",
        updatedAt: Date.now() - 24 * 60 * 60 * 1000,
      });
    });

    await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      observedAt: Date.now(),
    });

    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(2);
  });
});

describe("reports.listForPlace", () => {
  /**
   * One place, `count` reports by a single author, and optionally one
   * verification by `voterId` on the oldest report.
   *
   * `authorName: null` is the "never chose a name" case, which is not the same
   * as "no such user": `users.name` and `users.displayName` are both optional,
   * so the author is inserted with neither and the email is always present, so
   * the "never returns email" test below has something to leak.
   */
  async function seedReports(
    t: ReturnType<typeof convexTest>,
    opts: {
      authorName?: string | null;
      count: number;
      status?: "active" | "superseded";
      voterId?: Id<"users">;
      verdict?: "confirm" | "dispute";
    },
  ) {
    return await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("users", {
        email: "author@example.com",
        displayName: opts.authorName ?? undefined,
        role: "member",
        updatedAt: 1,
      });
      const placeId = await ctx.db.insert("places", {
        name: "Community Library",
        category: "education",
        address: "1 Main Street",
        location: { latitude: 6.9271, longitude: 79.8612 },
        createdBy: authorId,
        updatedAt: 1,
      });
      const reportIds: Id<"reports">[] = [];
      for (let i = 0; i < opts.count; i++) {
        reportIds.push(
          await ctx.db.insert("reports", {
            placeId,
            authorId,
            taxonomyVersion: 1,
            attributes: [{ key: "mobility.elevator", value: "yes" as const }],
            summary: i === 0 ? "Lift works well" : undefined,
            evidence: [],
            observedAt: 1000 + i,
            status: opts.status ?? "active",
            updatedAt: 1000 + i,
          }),
        );
      }
      if (opts.voterId) {
        await ctx.db.insert("verifications", {
          reportId: reportIds[0]!,
          authorId: opts.voterId,
          verdict: opts.verdict ?? "confirm",
          updatedAt: 1,
        });
      }
      return { placeId, reportIds };
    });
  }

  test("returns individual reports, newest first", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedReports(t, { count: 3 });

    const reports = await t.query(api.reports.listForPlace, { placeId });

    expect(reports).toHaveLength(3);
    expect(reports.map((r) => r.observedAt)).toEqual([1002, 1001, 1000]);
    // The report's own content has to survive, or this is the flattened
    // aggregate it exists to replace with the same numbers.
    expect(reports[0]?.attributes).toEqual([
      { key: "mobility.elevator", value: "yes" },
    ]);
    // The seeded summary is on the oldest report, which sorts last.
    expect(reports[2]?.summary).toBe("Lift works well");
    expect(reports[0]?.summary).toBeUndefined();
  });

  test("excludes reports that are not active", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedReports(t, {
      count: 2,
      status: "superseded",
    });

    expect(await t.query(api.reports.listForPlace, { placeId })).toHaveLength(
      0,
    );
  });

  test("never returns the author's email", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedReports(t, {
      count: 1,
      authorName: "Pasindu",
    });

    const reports = await t.query(api.reports.listForPlace, { placeId });

    expect(reports[0]?.authorDisplayName).toBe("Pasindu");
    expect(JSON.stringify(reports)).not.toContain("@example.com");
  });

  test("falls back to a generic label when the author has no display name", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedReports(t, { count: 1, authorName: null });

    const reports = await t.query(api.reports.listForPlace, { placeId });

    expect(reports[0]?.authorDisplayName).toBe("A Wayble user");
  });

  test("carries per-report tallies and the caller's own verdict", async () => {
    const t = convexTest(schema, modules);
    const voterId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "voter@example.com",
        displayName: "Voter",
        role: "member",
        updatedAt: 1,
      });
    });
    // A second voter on the same report, confirming rather than disputing, so
    // the tally's confirm branch is covered here too. Seeding only disputes
    // would leave `confirmCount` unproven by this file.
    const confirmerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "confirmer@example.com",
        displayName: "Confirmer",
        role: "member",
        updatedAt: 1,
      });
    });
    const { placeId, reportIds } = await seedReports(t, {
      count: 2,
      voterId,
      verdict: "dispute",
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("verifications", {
        reportId: reportIds[0]!,
        authorId: confirmerId,
        verdict: "confirm",
        updatedAt: 1,
      });
    });

    const reports = await t
      .withIdentity({ subject: voterId })
      .query(api.reports.listForPlace, { placeId });

    // Newest first, so the unvoted report (observedAt 1001) leads and the
    // twice-voted one (observedAt 1000) trails it.
    expect(reports[0]?.confirmCount).toBe(0);
    expect(reports[0]?.disputeCount).toBe(0);
    expect(reports[0]?.myVerdict).toBeNull();
    expect(reports[1]?.confirmCount).toBe(1);
    expect(reports[1]?.disputeCount).toBe(1);
    // The confirmer's row must not overwrite the caller's own verdict.
    expect(reports[1]?.myVerdict).toBe("dispute");
  });
});
