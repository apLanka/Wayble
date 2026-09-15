import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { SEED_REPORT_SUMMARY } from "../seed/reportsSeedData";

const modules = import.meta.glob("../**/*.*s");

function setup() {
  const t = convexTest(schema, modules);
  geospatialTest.register(t);
  return t;
}

async function seedBotId(t: ReturnType<typeof setup>) {
  return await t.run(async (ctx) => {
    const bot = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "seed@wayble.app"))
      .first();
    return bot!._id;
  });
}

describe("seed.seedPlaces sample reports", () => {
  test("seeds sample reports, all by the seed bot and labelled as samples", async () => {
    const t = setup();

    const result = await t.mutation(api.seed.seedPlaces, {});
    const botId = await seedBotId(t);
    const reports = await t.run(async (ctx) =>
      ctx.db.query("reports").collect(),
    );

    expect(result.reportsInserted).toBe(reports.length);
    expect(result.reportsInserted).toBeGreaterThan(0);
    // Some places are left without reports on purpose.
    expect(result.placesWithSampleReports).toBeLessThan(
      result.currentTotalInDb,
    );
    for (const report of reports) {
      expect(report.authorId).toBe(botId);
      expect(report.summary?.startsWith(SEED_REPORT_SUMMARY)).toBe(true);
      expect(report.status).toBe("active");
    }
  });

  test("a second run inserts nothing", async () => {
    const t = setup();
    await t.mutation(api.seed.seedPlaces, {});

    const again = await t.mutation(api.seed.seedPlaces, {});

    expect(again.inserted).toBe(0);
    expect(again.reportsInserted).toBe(0);
  });

  test("reseedReports replaces the bot's reports and their votes and flags", async () => {
    const t = setup();
    const first = await t.mutation(api.seed.seedPlaces, {});
    const { reportId, voterId } = await t.run(async (ctx) => {
      const report = (await ctx.db.query("reports").first())!;
      const voterId = await ctx.db.insert("users", {
        email: "voter@example.com",
        role: "member",
        updatedAt: 1,
      });
      await ctx.db.insert("verifications", {
        reportId: report._id,
        authorId: voterId,
        verdict: "confirm",
        updatedAt: 1,
      });
      await ctx.db.insert("flags", {
        reportId: report._id,
        authorId: voterId,
        reason: "spam",
        status: "open",
        updatedAt: 1,
      });
      return { reportId: report._id, voterId };
    });

    const again = await t.mutation(api.seed.seedPlaces, {
      reseedReports: true,
    });

    expect(again.reportsRemoved).toBe(first.reportsInserted);
    expect(again.reportsInserted).toBe(first.reportsInserted);
    const leftovers = await t.run(async (ctx) => ({
      report: await ctx.db.get(reportId),
      verifications: await ctx.db
        .query("verifications")
        .withIndex("by_author", (q) => q.eq("authorId", voterId))
        .collect(),
      flags: await ctx.db
        .query("flags")
        .withIndex("by_author", (q) => q.eq("authorId", voterId))
        .collect(),
    }));
    expect(leftovers.report).toBeNull();
    expect(leftovers.verifications).toHaveLength(0);
    expect(leftovers.flags).toHaveLength(0);
  });

  test("never touches a real user's report, or seeds that place", async () => {
    const t = setup();
    await t.mutation(api.seed.seedPlaces, {});
    const { placeId, userReportId } = await t.run(async (ctx) => {
      // A place the generator *does* seed. A reseed removes the bot's reports
      // there, and must then skip the place because a user has reported it;
      // picking a place the generator leaves empty would pass either way.
      const seeded = (await ctx.db.query("reports").first())!;
      const place = (await ctx.db.get(seeded.placeId))!;
      const userId = await ctx.db.insert("users", {
        email: "reporter@example.com",
        role: "member",
        updatedAt: 1,
      });
      const userReportId = await ctx.db.insert("reports", {
        placeId: place._id,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.elevator", value: "no" }],
        evidence: [],
        observedAt: Date.now(),
        status: "active",
        updatedAt: Date.now(),
      });
      return { placeId: place._id, userReportId };
    });

    await t.mutation(api.seed.seedPlaces, { reseedReports: true });

    const atPlace = await t.run(async (ctx) =>
      ctx.db
        .query("reports")
        .withIndex("by_place", (q) => q.eq("placeId", placeId))
        .collect(),
    );
    expect(atPlace.map((r) => r._id)).toEqual([userReportId]);
  });
});
