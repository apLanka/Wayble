import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

type T = ReturnType<typeof setup>;

function setup() {
  return convexTest(schema, modules);
}

async function seedUser(t: T, name: string, displayName: string | undefined) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: `${name}@example.com`,
      name,
      displayName,
      role: "member",
      updatedAt: 1,
    }),
  );
}

async function seedPlace(t: T, authorId: Id<"users">, name: string) {
  return await t.run(async (ctx) => {
    const placeId = await ctx.db.insert("places", {
      name,
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
      attributes: [{ key: "mobility.elevator", value: "yes", note: "private" }],
      evidence: [],
      observedAt: Date.now(),
      status: "active",
      updatedAt: Date.now(),
    });
    return { placeId, reportId };
  });
}

async function vote(
  t: T,
  reportId: Id<"reports">,
  authorId: Id<"users">,
  verdict: "confirm" | "dispute",
  updatedAt: number,
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("verifications", { reportId, authorId, verdict, updatedAt }),
  );
}

describe("verificationFeed.recentVerifications", () => {
  test("returns [] with no scope", async () => {
    const t = setup();
    const author = await seedUser(t, "a", "Author");
    const { reportId } = await seedPlace(t, author, "Library");
    const voter = await seedUser(t, "v", "Voter");
    await vote(t, reportId, voter, "confirm", 10);

    expect(await t.query(api.verificationFeed.recentVerifications, {})).toEqual(
      [],
    );
  });

  test("scopes to placeId and placeIds, newest first", async () => {
    const t = setup();
    const author = await seedUser(t, "a", "Author");
    const voter = await seedUser(t, "v", "Voter");
    const one = await seedPlace(t, author, "Library");
    const two = await seedPlace(t, author, "Cafe");
    const far = await seedPlace(t, author, "Far Away");
    await vote(t, one.reportId, voter, "confirm", 10);
    await vote(t, two.reportId, voter, "dispute", 20);
    await vote(t, far.reportId, voter, "confirm", 30);

    const region = await t.query(api.verificationFeed.recentVerifications, {
      placeIds: [one.placeId, two.placeId],
    });
    expect(region.map((i) => i.placeName)).toEqual(["Cafe", "Library"]);

    const single = await t.query(api.verificationFeed.recentVerifications, {
      placeId: far.placeId,
    });
    expect(single.map((i) => i.placeName)).toEqual(["Far Away"]);
  });

  test("honours limit and clamps it to at least 1", async () => {
    const t = setup();
    const author = await seedUser(t, "a", "Author");
    const { placeId, reportId } = await seedPlace(t, author, "Library");
    for (let i = 0; i < 3; i++) {
      const voter = await seedUser(t, `v${i}`, `Voter ${i}`);
      await vote(t, reportId, voter, "confirm", 10 + i);
    }

    const two = await t.query(api.verificationFeed.recentVerifications, {
      placeId,
      limit: 2,
    });
    expect(two).toHaveLength(2);
    expect(two[0]!.updatedAt).toBe(12);

    const zero = await t.query(api.verificationFeed.recentVerifications, {
      placeId,
      limit: 0,
    });
    expect(zero).toHaveLength(1);
  });

  test("skips votes on non-active reports", async () => {
    const t = setup();
    const author = await seedUser(t, "a", "Author");
    const voter = await seedUser(t, "v", "Voter");
    const { placeId, reportId } = await seedPlace(t, author, "Library");
    await vote(t, reportId, voter, "confirm", 10);
    await t.run(async (ctx) => ctx.db.patch(reportId, { status: "removed" }));

    expect(
      await t.query(api.verificationFeed.recentVerifications, { placeId }),
    ).toEqual([]);
  });

  test("item shape: verifier, attributes without notes, confidence, no email", async () => {
    const t = setup();
    const author = await seedUser(t, "a", "Author");
    const voter = await seedUser(t, "v", "  ");
    const { placeId, reportId } = await seedPlace(t, author, "Library");
    await vote(t, reportId, voter, "confirm", 10);

    const [item] = await t.query(api.verificationFeed.recentVerifications, {
      placeId,
    });
    // Blank displayName falls through to `name`.
    expect(item!.verifierName).toBe("v");
    expect(item!.verifierId).toBe(voter);
    expect(item!.verdict).toBe("confirm");
    expect(item!.attributes).toEqual([
      { key: "mobility.elevator", value: "yes" },
    ]);
    // 1 agree / 1 vote * 1 verifier * fresh = 1 → medium.
    expect(item!.confidence).toEqual({ tier: "medium", isStale: false });
    expect(JSON.stringify(item!)).not.toContain("@example.com");
  });

  test("a changed vote moves to the top with a new updatedAt", async () => {
    const t = setup();
    const author = await seedUser(t, "a", "Author");
    const v1 = await seedUser(t, "v1", "One");
    const v2 = await seedUser(t, "v2", "Two");
    const { placeId, reportId } = await seedPlace(t, author, "Library");
    const first = await vote(t, reportId, v1, "confirm", 10);
    await vote(t, reportId, v2, "confirm", 20);
    await t.run(async (ctx) =>
      ctx.db.patch(first, { verdict: "dispute", updatedAt: 30 }),
    );

    const items = await t.query(api.verificationFeed.recentVerifications, {
      placeId,
    });
    expect(items.map((i) => i.verifierName)).toEqual(["One", "Two"]);
    expect(items[0]!.verdict).toBe("dispute");
  });
});
