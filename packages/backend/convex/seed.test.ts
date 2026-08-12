import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

function createTest() {
  const t = convexTest(schema, modules);
  geospatialTest.register(t);
  return t;
}

test("seedPlaces seeds places from dataset and creates seed user", async () => {
  const t = createTest();

  const result = await t.mutation(api.seed.seedPlaces, {});

  expect(result.inserted).toBeGreaterThanOrEqual(100);
  expect(result.currentTotalInDb).toBe(result.inserted);

  // Verify places in DB
  const places = await t.run(async (ctx) => {
    return await ctx.db.query("places").collect();
  });

  expect(places.length).toBe(result.inserted);

  // Verify seed user was created
  const seedUser = await t.run(async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "[seed@wayble.app](mailto:seed@wayble.app)"))
      .first();
  });

  expect(seedUser).toBeDefined();
  expect(seedUser?.displayName).toBe("Wayble Seeder");
});

test("seedPlaces is idempotent on subsequent runs", async () => {
  const t = createTest();

  // Run 1
  const run1 = await t.mutation(api.seed.seedPlaces, {});
  expect(run1.inserted).toBeGreaterThanOrEqual(100);

  // Run 2 without clearing existing places
  const run2 = await t.mutation(api.seed.seedPlaces, {});

  expect(run2.inserted).toBe(0);
  expect(run2.skipped).toBe(run1.inserted);
  expect(run2.currentTotalInDb).toBe(run1.inserted);
});
