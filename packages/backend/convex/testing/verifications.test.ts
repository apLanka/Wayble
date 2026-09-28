import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_NOTE_LENGTH } from "../reportLimits";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

function setup() {
  return convexTest(schema, modules);
}

async function seedUser(t: ReturnType<typeof setup>, email: string) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email,
      displayName: email,
      role: "member",
      updatedAt: 1,
    });
  });
}

/** One place, one report authored by `authorId`. */
async function seedReport(t: ReturnType<typeof setup>, authorId: Id<"users">) {
  return await t.run(async (ctx) => {
    const placeId = await ctx.db.insert("places", {
      name: "Community Library",
      category: "education",
      address: "1 Main Street",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: authorId,
      updatedAt: 1,
    });
    const reportId = await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      evidence: [],
      observedAt: 1,
      status: "active",
      updatedAt: 1,
    });
    return reportId;
  });
}

describe("verifications.verifyReport", () => {
  test("rejects unauthenticated callers", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);

    await expect(
      t.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Unauthenticated");

    expect(
      await t.run(async (ctx) => ctx.db.query("verifications").collect()),
    ).toHaveLength(0);
  });

  test("rejects an unknown report", async () => {
    const t = setup();
    const userId = await seedUser(t, "user@example.com");
    const authorId = await seedUser(t, "author@example.com");
    const asUser = t.withIdentity({ subject: userId });

    // Convex validates `v.id("reports")` as a well-formed id, not as a row
    // that still exists, so a deleted row is the only way to reach the
    // handler's existence check — a hand-written id string is refused by the
    // argument validator first, with a different error entirely. Same shape
    // as reports.test.ts:191.
    const deletedReportId = await seedReport(t, authorId);
    await t.run(async (ctx) => {
      await ctx.db.delete(deletedReportId);
    });

    await expect(
      asUser.mutation(api.verifications.verifyReport, {
        reportId: deletedReportId,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Unknown report");
  });

  test("rejects self-verification and writes no row", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);
    const asAuthor = t.withIdentity({ subject: authorId });

    await expect(
      asAuthor.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      }),
    ).rejects.toThrow("Cannot verify your own report");

    expect(
      await t.run(async (ctx) => ctx.db.query("verifications").collect()),
    ).toHaveLength(0);
  });

  test("a different user can verify the report", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    const result = await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });

    expect(result?.verdict).toBe("confirm");
    expect(result?.authorId).toBe(otherId);
  });

  test("a second vote updates the existing row rather than inserting", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "dispute",
      note: "The lift is out of service.",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("verifications").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.verdict).toBe("dispute");
    expect(rows[0]?.note).toBe("The lift is out of service.");
  });

  test("two users voting on one report get a row each", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const firstId = await seedUser(t, "first@example.com");
    const secondId = await seedUser(t, "second@example.com");
    const reportId = await seedReport(t, authorId);
    const asFirst = t.withIdentity({ subject: firstId });
    const asSecond = t.withIdentity({ subject: secondId });

    await asFirst.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    await asSecond.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "dispute",
    });

    // This is what tells the two report indexes apart. A handler that looked
    // the vote up on `by_report` instead of `by_report_and_author` would see the
    // first voter's row here, take it for its own, and patch it — leaving one
    // row instead of two — so the count and the two distinct author ids are
    // both load-bearing.
    const rows = await t.run(async (ctx) =>
      ctx.db.query("verifications").collect(),
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.authorId).sort()).toEqual(
      [firstId, secondId].sort(),
    );
    // Each vote is stored under the user who cast it, not merely alongside it.
    expect(rows.find((row) => row.authorId === firstId)?.verdict).toBe(
      "confirm",
    );
    expect(rows.find((row) => row.authorId === secondId)?.verdict).toBe(
      "dispute",
    );
  });

  test("rejects a note longer than the cap", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    // The note is sized from the constant so it stays just over the boundary,
    // while the expected message is spelled out so a change to the cap fails
    // here instead of passing silently. Same pairing as reports.test.ts:180.
    await expect(
      asOther.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "dispute",
        note: "x".repeat(MAX_NOTE_LENGTH + 1),
      }),
    ).rejects.toThrow("Note too long: 281 characters, maximum 280");

    // This is the last check before the upsert, and the only guard a partial
    // write could plausibly slip past, so nothing may reach the table.
    expect(
      await t.run(async (ctx) => ctx.db.query("verifications").collect()),
    ).toHaveLength(0);
  });
});

describe("verifications.forReport", () => {
  test("counts every user's verdict and reports the caller's own", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const aId = await seedUser(t, "a@example.com");
    const bId = await seedUser(t, "b@example.com");
    const cId = await seedUser(t, "c@example.com");
    const reportId = await seedReport(t, authorId);

    await t
      .withIdentity({ subject: aId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });
    await t
      .withIdentity({ subject: bId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });
    await t
      .withIdentity({ subject: cId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "dispute",
      });

    const tally = await t
      .withIdentity({ subject: aId })
      .query(api.verifications.forReport, { reportId });

    expect(tally.confirmCount).toBe(2);
    expect(tally.disputeCount).toBe(1);
    expect(tally.totalVotes).toBe(3);
    expect(tally.myVerdict).toBe("confirm");

    // The two myVerdict assertions in this test are what make it the caller's
    // verdict rather than merely some row's. aId voted first, so a handler
    // that answered with the last matching row would say "dispute" for aId and
    // fail the assertion above; cId voted last, so a handler that answered
    // with the first would say "confirm" and fail here. Neither assertion
    // catches both mutations on its own.
    const disputeTally = await t
      .withIdentity({ subject: cId })
      .query(api.verifications.forReport, { reportId });
    expect(disputeTally.myVerdict).toBe("dispute");
  });

  test("myVerdict is null for a user who has not voted", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);

    await t
      .withIdentity({ subject: otherId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });

    const tally = await t
      .withIdentity({ subject: authorId })
      .query(api.verifications.forReport, { reportId });

    expect(tally.totalVotes).toBe(1);
    expect(tally.myVerdict).toBeNull();
  });

  test("myVerdict is null when unauthenticated", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);

    // Another user's vote has to be on the table first. With no rows at all,
    // `myVerdict` is null for *any* implementation — including one that never
    // consults the session — so the assertion below would pass even with the
    // authorId filter deleted. With a real row whose authorId belongs to
    // nobody in this test, the null has to come from the filter.
    await t
      .withIdentity({ subject: otherId })
      .mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "confirm",
      });

    const tally = await t.query(api.verifications.forReport, { reportId });

    // The tally is the report's, not the caller's: the anonymous caller still
    // sees the vote that was cast. Only myVerdict is withheld.
    expect(tally.confirmCount).toBe(1);
    expect(tally.disputeCount).toBe(0);
    expect(tally.myVerdict).toBeNull();
  });

  test("a changed vote moves the tally rather than double counting", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "confirm",
    });
    await asOther.mutation(api.verifications.verifyReport, {
      reportId,
      verdict: "dispute",
    });

    const tally = await asOther.query(api.verifications.forReport, {
      reportId,
    });

    expect(tally.confirmCount).toBe(0);
    expect(tally.disputeCount).toBe(1);
    expect(tally.totalVotes).toBe(1);
  });
});
