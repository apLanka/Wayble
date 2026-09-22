import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

function setup() {
  return convexTest(schema, modules);
}

async function seedUser(
  t: ReturnType<typeof setup>,
  email: string,
  role?: "member" | "moderator" | "admin",
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email,
      displayName: email,
      ...(role ? { role } : {}),
      updatedAt: 1,
    });
  });
}

async function seedReport(
  t: ReturnType<typeof setup>,
  authorId: Id<"users">,
  placeName = "Community Library",
) {
  return await t.run(async (ctx) => {
    const placeId = await ctx.db.insert("places", {
      name: placeName,
      category: "education",
      address: "1 Main Street",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: authorId,
      updatedAt: 1,
    });
    return await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "mobility.elevator", value: "yes" }],
      summary: "Elevator works",
      evidence: [],
      observedAt: 1,
      status: "active",
      updatedAt: 1,
    });
  });
}

async function seedFlag(
  t: ReturnType<typeof setup>,
  reportId: Id<"reports">,
  authorId: Id<"users">,
  reason: "inaccurate" | "spam" | "abusive" = "spam",
  status: "open" | "resolved" | "dismissed" = "open",
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("flags", {
      reportId,
      authorId,
      reason,
      status,
      updatedAt: 1,
    });
  });
}

describe("moderation gating", () => {
  test("rejects unauthenticated callers", async () => {
    const t = setup();
    await expect(t.query(api.moderation.getFlaggedReports, {})).rejects.toThrow(
      "Unauthenticated",
    );
  });

  test("rejects members and users with no role", async () => {
    const t = setup();
    const member = await seedUser(t, "member@example.com", "member");
    const noRole = await seedUser(t, "norole@example.com");
    const author = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, member);

    for (const id of [member, noRole]) {
      const as = t.withIdentity({ subject: id });
      await expect(
        as.query(api.moderation.getFlaggedReports, {}),
      ).rejects.toThrow("Forbidden");
      await expect(
        as.mutation(api.moderation.dismissFlag, { reportId }),
      ).rejects.toThrow("Forbidden");
    }

    const flags = await t.run(async (ctx) => ctx.db.query("flags").collect());
    expect(flags.every((flag) => flag.status === "open")).toBe(true);
  });
});

describe("moderation.getFlaggedReports", () => {
  test("lists flagged reports with place name, summary, reasons and count", async () => {
    const t = setup();
    const mod = await seedUser(t, "mod@example.com", "moderator");
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const b = await seedUser(t, "b@example.com");
    const c = await seedUser(t, "c@example.com");
    const flagged = await seedReport(t, author, "Flagged Cafe");
    await seedReport(t, author, "Clean Cafe");
    await seedFlag(t, flagged, a, "spam");
    await seedFlag(t, flagged, b, "spam");
    await seedFlag(t, flagged, c, "abusive");
    // A closed flag must not count.
    await seedFlag(t, flagged, author, "inaccurate", "dismissed");

    const result = await t
      .withIdentity({ subject: mod })
      .query(api.moderation.getFlaggedReports, {});

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reportId: flagged,
      placeName: "Flagged Cafe",
      summary: "Elevator works",
      flagCount: 3,
      reasons: ["spam", "abusive"],
    });
  });

  test("returns an empty list when nothing is flagged", async () => {
    const t = setup();
    const mod = await seedUser(t, "mod@example.com", "moderator");
    expect(
      await t
        .withIdentity({ subject: mod })
        .query(api.moderation.getFlaggedReports, {}),
    ).toEqual([]);
  });
});

describe("moderation.dismissFlag", () => {
  test("dismisses every open flag and removes the report from the queue", async () => {
    const t = setup();
    const mod = await seedUser(t, "mod@example.com", "moderator");
    const author = await seedUser(t, "author@example.com");
    const a = await seedUser(t, "a@example.com");
    const b = await seedUser(t, "b@example.com");
    const reportId = await seedReport(t, author);
    await seedFlag(t, reportId, a);
    await seedFlag(t, reportId, b, "abusive");
    const earlier = await seedFlag(
      t,
      reportId,
      author,
      "inaccurate",
      "resolved",
    );

    const asMod = t.withIdentity({ subject: mod });
    expect(await asMod.mutation(api.moderation.dismissFlag, { reportId })).toBe(
      2,
    );

    const flags = await t.run(async (ctx) => ctx.db.query("flags").collect());
    const dismissed = flags.filter((flag) => flag.status === "dismissed");
    expect(dismissed).toHaveLength(2);
    for (const flag of dismissed) {
      expect(flag.resolvedBy).toBe(mod);
      expect(flag.resolvedAt).toBeTypeOf("number");
    }
    expect(flags.find((flag) => flag._id === earlier)?.status).toBe("resolved");

    expect(await asMod.query(api.moderation.getFlaggedReports, {})).toEqual([]);
    const report = await t.run(async (ctx) => ctx.db.get(reportId));
    expect(report?.status).toBe("active");
  });

  test("rejects a report with no open flags", async () => {
    const t = setup();
    const mod = await seedUser(t, "mod@example.com", "moderator");
    const author = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, author);

    await expect(
      t
        .withIdentity({ subject: mod })
        .mutation(api.moderation.dismissFlag, { reportId }),
    ).rejects.toThrow("No open flags on this report");
  });

  test("rejects an unknown report", async () => {
    const t = setup();
    const mod = await seedUser(t, "mod@example.com", "moderator");
    const author = await seedUser(t, "author@example.com");
    const reportId = await seedReport(t, author);
    await t.run(async (ctx) => ctx.db.delete(reportId));

    await expect(
      t
        .withIdentity({ subject: mod })
        .mutation(api.moderation.dismissFlag, { reportId }),
    ).rejects.toThrow("Unknown report");
  });
});

describe("moderation.setUserRole", () => {
  test("promotes a user by email, who can then read the queue", async () => {
    const t = setup();
    const id = await seedUser(t, "promote@example.com", "member");

    await t.mutation(internal.moderation.setUserRole, {
      email: "promote@example.com",
      role: "moderator",
    });

    expect(
      await t
        .withIdentity({ subject: id })
        .query(api.moderation.getFlaggedReports, {}),
    ).toEqual([]);
  });

  test("rejects an unknown email", async () => {
    const t = setup();
    await expect(
      t.mutation(internal.moderation.setUserRole, {
        email: "nobody@example.com",
        role: "moderator",
      }),
    ).rejects.toThrow("No user with email");
  });
});
