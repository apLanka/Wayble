import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

const validAttribute = {
  key: "mobility.step_free_entrance" as const,
  value: "yes" as const,
};

async function seedGraph(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const authorId = await ctx.db.insert("users", {
      displayName: "Report Author",
      role: "member",
      updatedAt: 1,
    });
    const verifierId = await ctx.db.insert("users", {
      displayName: "Report Verifier",
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
    const reportId = await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [
        validAttribute,
        {
          key: "vision.high_contrast_signage",
          value: "partial",
          note: "The entrance sign is clear, but interior signs are faint.",
        },
        { key: "hearing.visual_alarms", value: "unknown" },
        { key: "sensory.quiet_space", value: "not_applicable" },
        { key: "assistance.staff_support", value: "yes" },
      ],
      evidence: [],
      observedAt: 1,
      status: "active",
      updatedAt: 1,
    });
    const verificationId = await ctx.db.insert("verifications", {
      reportId,
      authorId: verifierId,
      verdict: "confirm",
      updatedAt: 1,
    });
    const flagId = await ctx.db.insert("flags", {
      reportId,
      authorId: verifierId,
      reason: "inaccurate",
      status: "open",
      updatedAt: 1,
    });

    return { authorId, verifierId, placeId, reportId, verificationId, flagId };
  });
}

test("accepts a valid user, place, report, verification, and flag graph", async () => {
  const t = convexTest(schema, modules);
  const ids = await seedGraph(t);

  const graph = await t.run(async (ctx) => {
    const place = await ctx.db.get(ids.placeId);
    const report = await ctx.db.get(ids.reportId);
    const verification = await ctx.db.get(ids.verificationId);
    const flag = await ctx.db.get(ids.flagId);

    return { place, report, verification, flag };
  });

  expect(graph.place?.createdBy).toBe(ids.authorId);
  expect(graph.report?.placeId).toBe(ids.placeId);
  expect(graph.report?.authorId).toBe(ids.authorId);
  expect(graph.report?.taxonomyVersion).toBe(1);
  expect(graph.verification?.reportId).toBe(ids.reportId);
  expect(graph.flag?.reportId).toBe(ids.reportId);
});

test("required indexes return the expected report relationships", async () => {
  const t = convexTest(schema, modules);
  const ids = await seedGraph(t);

  const result = await t.run(async (ctx) => {
    const reportsByPlace = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", ids.placeId))
      .collect();
    const reportsByAuthor = await ctx.db
      .query("reports")
      .withIndex("by_author", (q) => q.eq("authorId", ids.authorId))
      .collect();
    const verificationsByReport = await ctx.db
      .query("verifications")
      .withIndex("by_report", (q) => q.eq("reportId", ids.reportId))
      .collect();
    const verificationsByAuthor = await ctx.db
      .query("verifications")
      .withIndex("by_author", (q) => q.eq("authorId", ids.verifierId))
      .collect();
    const verificationByPair = await ctx.db
      .query("verifications")
      .withIndex("by_report_and_author", (q) =>
        q.eq("reportId", ids.reportId).eq("authorId", ids.verifierId),
      )
      .collect();
    const flagsByReport = await ctx.db
      .query("flags")
      .withIndex("by_report", (q) => q.eq("reportId", ids.reportId))
      .collect();
    const flagsByAuthor = await ctx.db
      .query("flags")
      .withIndex("by_author", (q) => q.eq("authorId", ids.verifierId))
      .collect();

    return {
      reportsByPlace,
      reportsByAuthor,
      verificationsByReport,
      verificationsByAuthor,
      verificationByPair,
      flagsByReport,
      flagsByAuthor,
    };
  });

  expect(result.reportsByPlace.map((report) => report._id)).toContain(
    ids.reportId,
  );
  expect(result.reportsByAuthor.map((report) => report._id)).toContain(
    ids.reportId,
  );
  expect(result.verificationsByReport.map((item) => item._id)).toContain(
    ids.verificationId,
  );
  expect(result.verificationsByAuthor.map((item) => item._id)).toContain(
    ids.verificationId,
  );
  expect(result.verificationByPair.map((item) => item._id)).toEqual([
    ids.verificationId,
  ]);
  expect(result.flagsByReport.map((item) => item._id)).toContain(ids.flagId);
  expect(result.flagsByAuthor.map((item) => item._id)).toContain(ids.flagId);
});

test("rejects invalid taxonomy keys and values", async () => {
  const t = convexTest(schema, modules);
  const ids = await seedGraph(t);

  await expect(
    t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId: ids.placeId,
        authorId: ids.authorId,
        taxonomyVersion: 1,
        attributes: [
          {
            key: "mobility.unknown_key" as never,
            value: "yes",
          },
        ],
        evidence: [],
        observedAt: 1,
        status: "active",
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();

  await expect(
    t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId: ids.placeId,
        authorId: ids.authorId,
        taxonomyVersion: 1,
        attributes: [
          {
            key: "mobility.step_free_entrance",
            value: "maybe" as never,
          },
        ],
        evidence: [],
        observedAt: 1,
        status: "active",
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();
});

test("rejects invalid entity enum values", async () => {
  const t = convexTest(schema, modules);
  const ids = await seedGraph(t);

  await expect(
    t.run((ctx) =>
      ctx.db.insert("users", {
        displayName: "Invalid Role",
        role: "owner" as never,
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();

  await expect(
    t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        displayName: "Invalid Category Creator",
        role: "member",
        updatedAt: 1,
      });
      return ctx.db.insert("places", {
        name: "Invalid Category Place",
        category: "venue" as never,
        address: "1 Main Street",
        location: { latitude: 6.9271, longitude: 79.8612 },
        createdBy: userId,
        updatedAt: 1,
      });
    }),
  ).rejects.toThrow();

  await expect(
    t.run((ctx) =>
      ctx.db.insert("reports", {
        placeId: ids.placeId,
        authorId: ids.authorId,
        taxonomyVersion: 1,
        attributes: [validAttribute],
        evidence: [],
        observedAt: 1,
        status: "draft" as never,
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();

  await expect(
    t.run((ctx) =>
      ctx.db.insert("verifications", {
        reportId: ids.reportId,
        authorId: ids.verifierId,
        verdict: "maybe" as never,
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();

  await expect(
    t.run((ctx) =>
      ctx.db.insert("flags", {
        reportId: ids.reportId,
        authorId: ids.verifierId,
        reason: "unsupported" as never,
        status: "open",
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();

  await expect(
    t.run((ctx) =>
      ctx.db.insert("flags", {
        reportId: ids.reportId,
        authorId: ids.verifierId,
        reason: "spam",
        status: "pending" as never,
        updatedAt: 1,
      }),
    ),
  ).rejects.toThrow();
});

test("rejects documents with missing required fields", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.run((ctx) =>
      ctx.db.insert("places", {
        name: "Missing address",
        category: "education",
        updatedAt: 1,
      } as never),
    ),
  ).rejects.toThrow();

  await expect(
    t.run((ctx) =>
      ctx.db.insert("reports", {
        authorId: "not-a-report-id" as never,
        taxonomyVersion: 1,
        attributes: [validAttribute],
        evidence: [],
        observedAt: 1,
        status: "active",
        updatedAt: 1,
      } as never),
    ),
  ).rejects.toThrow();
});
