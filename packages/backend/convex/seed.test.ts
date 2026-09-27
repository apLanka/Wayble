import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { SEED_PLACES } from "./seed/placesSeedData";

const modules = import.meta.glob("./**/*.*s");

/** `convexTest` with the geospatial component registered, as `seedAllPlaces`
 *  writes to the geo index that `places.nearest` reads. */
function geoTest() {
  const t = convexTest(schema, modules);
  geospatialTest.register(t);
  return t;
}

async function seedUser(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email: "seeder@example.com",
      displayName: "Seed Caller",
      role: "member",
      updatedAt: 1,
    });
    return userId;
  });
}

describe("seedAllPlaces", () => {
  test("rejects unauthenticated callers", async () => {
    const t = geoTest();

    await expect(t.mutation(api.seed.seedAllPlaces, {})).rejects.toThrow(
      "Unauthenticated",
    );
    expect(
      await t.run(async (ctx) => ctx.db.query("places").collect()),
    ).toHaveLength(0);
  });

  test("inserts the whole dataset and reports the counts", async () => {
    const t = geoTest();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const result = await asUser.mutation(api.seed.seedAllPlaces, {});

    expect(result).toEqual({
      inserted: SEED_PLACES.length,
      skipped: 0,
      total: SEED_PLACES.length,
    });
    expect(
      await t.run(async (ctx) => ctx.db.query("places").collect()),
    ).toHaveLength(SEED_PLACES.length);
  });

  test("is idempotent — a second run inserts nothing", async () => {
    const t = geoTest();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.seed.seedAllPlaces, {});
    const second = await asUser.mutation(api.seed.seedAllPlaces, {});

    expect(second).toEqual({
      inserted: 0,
      skipped: SEED_PLACES.length,
      total: SEED_PLACES.length,
    });
    expect(
      await t.run(async (ctx) => ctx.db.query("places").collect()),
    ).toHaveLength(SEED_PLACES.length);
  });

  test("skips a place that already exists, case-insensitively", async () => {
    const t = geoTest();
    const userId = await seedUser(t);

    const existingName = SEED_PLACES[0]!.name;
    await t.run(async (ctx) => {
      await ctx.db.insert("places", {
        // Different case and padding: the seed trims and lowercases before
        // comparing, so this has to count as the same place.
        name: `  ${existingName.toUpperCase()}  `,
        category: "other",
        address: "Somewhere else",
        location: { latitude: 0, longitude: 0 },
        createdBy: userId,
        updatedAt: 1,
      });
    });

    const asUser = t.withIdentity({ subject: userId });
    const result = await asUser.mutation(api.seed.seedAllPlaces, {});

    expect(result.inserted).toBe(SEED_PLACES.length - 1);
    expect(result.skipped).toBe(1);
  });

  test("preserves each place's real category rather than flattening it", async () => {
    const t = geoTest();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.seed.seedAllPlaces, {});

    const places = await t.run(async (ctx) => ctx.db.query("places").collect());
    const categories = new Set(places.map((p) => p.category));

    // The dataset spans nine business types. Collapsing them all to "other",
    // as the old seedMockPlaces did, would leave one category here.
    expect(categories.size).toBeGreaterThan(1);
    expect(categories.has("other")).toBe(false);
  });

  test("every seeded place has at least one accessibility category", async () => {
    const t = geoTest();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.seed.seedAllPlaces, {});

    const places = await t.run(async (ctx) => ctx.db.query("places").collect());

    // The client filters on this field, so an empty array here would make
    // every filter chip except "all" return nothing.
    const missing = places.filter(
      (p) => (p.accessibilityCategories ?? []).length === 0,
    );
    expect(missing).toHaveLength(0);
  });

  test("all four accessibility categories are represented", async () => {
    const t = geoTest();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.seed.seedAllPlaces, {});

    const places = await t.run(async (ctx) => ctx.db.query("places").collect());
    const seen = new Set(
      places.flatMap((p) => p.accessibilityCategories ?? []),
    );

    expect([...seen].sort()).toEqual([
      "bathroom",
      "elevator",
      "multi",
      "wheelchair",
    ]);
  });

  test("attributes every place to the caller", async () => {
    const t = geoTest();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.seed.seedAllPlaces, {});

    const places = await t.run(async (ctx) => ctx.db.query("places").collect());
    expect(places.every((p) => p.createdBy === userId)).toBe(true);
  });
});
