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

describe("flags.flagReport", () => {
  test("rejects unauthenticated callers", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);

    await expect(
      t.mutation(api.flags.flagReport, {
        reportId,
        reason: "spam",
      }),
    ).rejects.toThrow("Unauthenticated: must be logged in to flag a report");

    expect(
      await t.run(async (ctx) => ctx.db.query("flags").collect()),
    ).toHaveLength(0);
  });

  test("rejects an unknown report", async () => {
    const t = setup();
    const userId = await seedUser(t, "user@example.com");
    const authorId = await seedUser(t, "author@example.com");
    const asUser = t.withIdentity({ subject: userId });

    const deletedReportId = await seedReport(t, authorId);
    await t.run(async (ctx) => {
      await ctx.db.delete(deletedReportId);
    });

    await expect(
      asUser.mutation(api.flags.flagReport, {
        reportId: deletedReportId,
        reason: "spam",
      }),
    ).rejects.toThrow("Unknown report");
  });

  test("rejects self-flag and writes no row", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, authorId);
    const asAuthor = t.withIdentity({ subject: authorId });

    await expect(
      asAuthor.mutation(api.flags.flagReport, {
        reportId,
        reason: "spam",
      }),
    ).rejects.toThrow("Cannot flag your own report");

    expect(
      await t.run(async (ctx) => ctx.db.query("flags").collect()),
    ).toHaveLength(0);
  });

  test("a different user can flag the report", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    const result = await asOther.mutation(api.flags.flagReport, {
      reportId,
      reason: "spam",
    });

    expect(result?.reason).toBe("spam");
    expect(result?.authorId).toBe(otherId);
    expect(result?.status).toBe("open");
  });

  test("a second flag from the same author while the first is still open is rejected", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await asOther.mutation(api.flags.flagReport, {
      reportId,
      reason: "spam",
    });

    await expect(
      asOther.mutation(api.flags.flagReport, {
        reportId,
        reason: "inaccurate",
      }),
    ).rejects.toThrow("You already flagged this report");

    const rows = await t.run(async (ctx) => ctx.db.query("flags").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reason).toBe("spam");
  });

  test("a second flag from the same author is allowed once the first flag is not open", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await asOther.mutation(api.flags.flagReport, {
      reportId,
      reason: "spam",
    });

    await t.run(async (ctx) => {
      const row = await ctx.db.query("flags").first();
      if (row) {
        await ctx.db.patch(row._id, { status: "resolved" });
      }
    });

    await asOther.mutation(api.flags.flagReport, {
      reportId,
      reason: "inaccurate",
    });

    const rows = await t.run(async (ctx) => ctx.db.query("flags").collect());
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.status).sort()).toEqual(["open", "resolved"]);
  });

  test("two different users can each open a flag on the same report", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const firstId = await seedUser(t, "first@example.com");
    const secondId = await seedUser(t, "second@example.com");
    const reportId = await seedReport(t, authorId);
    const asFirst = t.withIdentity({ subject: firstId });
    const asSecond = t.withIdentity({ subject: secondId });

    await asFirst.mutation(api.flags.flagReport, {
      reportId,
      reason: "spam",
    });
    await asSecond.mutation(api.flags.flagReport, {
      reportId,
      reason: "inaccurate",
    });

    const rows = await t.run(async (ctx) => ctx.db.query("flags").collect());
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.authorId).sort()).toEqual(
      [firstId, secondId].sort(),
    );
  });

  test("details accepted and stored when reason is other and within cap", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    const result = await asOther.mutation(api.flags.flagReport, {
      reportId,
      reason: "other",
      details: "This is a custom reason",
    });

    expect(result?.reason).toBe("other");
    expect(result?.details).toBe("This is a custom reason");
  });

  test("details rejected over MAX_NOTE_LENGTH when reason is other", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await expect(
      asOther.mutation(api.flags.flagReport, {
        reportId,
        reason: "other",
        details: "x".repeat(MAX_NOTE_LENGTH + 1),
      }),
    ).rejects.toThrow(
      `Details too long: ${MAX_NOTE_LENGTH + 1} characters, maximum ${MAX_NOTE_LENGTH}`,
    );
  });

  test("details provided with a non-other reason is rejected", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await expect(
      asOther.mutation(api.flags.flagReport, {
        reportId,
        reason: "spam",
        details: "Spammy stuff",
      }),
    ).rejects.toThrow('details is only accepted when reason is "other"');
  });

  test("at least one non-other reason plus other accepted end-to-end", async () => {
    // Already covered in previous tests ("spam" and "other" both pass)
    // We'll write one specifically to hit the checklist requirement directly:
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const firstId = await seedUser(t, "first@example.com");
    const secondId = await seedUser(t, "second@example.com");
    const reportId = await seedReport(t, authorId);
    const asFirst = t.withIdentity({ subject: firstId });
    const asSecond = t.withIdentity({ subject: secondId });

    const result1 = await asFirst.mutation(api.flags.flagReport, {
      reportId,
      reason: "inaccurate",
    });

    const result2 = await asSecond.mutation(api.flags.flagReport, {
      reportId,
      reason: "other",
      details: "it is a test",
    });

    expect(result1?.reason).toBe("inaccurate");
    expect(result2?.reason).toBe("other");
  });
});
