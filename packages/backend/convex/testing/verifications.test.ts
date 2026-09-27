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

  test("rejects a note longer than the cap", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com");
    const otherId = await seedUser(t, "other@example.com");
    const reportId = await seedReport(t, authorId);
    const asOther = t.withIdentity({ subject: otherId });

    await expect(
      asOther.mutation(api.verifications.verifyReport, {
        reportId,
        verdict: "dispute",
        note: "x".repeat(MAX_NOTE_LENGTH + 1),
      }),
    ).rejects.toThrow("Note too long");
  });
});
