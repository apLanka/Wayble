import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("search places by name", async () => {
  const t = convexTest(schema, import.meta.glob("./**/*.*s"));
  geospatialTest.register(t);

  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {});
  });
  const asUser = t.withIdentity({ subject: userId });

  await asUser.mutation(api.places.create, {
    name: "Central Library",
    category: "education",
    address: "123 Main St",
    location: { latitude: 10, longitude: 10 },
  });

  await asUser.mutation(api.places.create, {
    name: "Central Park",
    category: "outdoor",
    address: "456 Park Ave",
    location: { latitude: 20, longitude: 20 },
  });

  let results = await asUser.query(api.places.search, {
    query: "Central",
  });
  expect(results).toHaveLength(2);

  results = await asUser.query(api.places.search, {
    query: "Library",
  });
  expect(results).toHaveLength(1);
  expect(results[0]?.name).toBe("Central Library");

  results = await asUser.query(api.places.search, {
    query: "Central",
    limit: 1,
  });
  expect(results).toHaveLength(1);
});

test("places sync with geospatial index", async () => {
  const t = convexTest(schema, import.meta.glob("./**/*.*s"));
  geospatialTest.register(t);

  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {});
  });
  const asUser = t.withIdentity({ subject: userId });

  const placeId = await asUser.mutation(api.places.create, {
    name: "Test Place",
    category: "education",
    address: "123 Test St",
    location: { latitude: 10, longitude: 10 },
  });

  let nearest = await asUser.query(api.places.nearest, {
    point: { latitude: 10.1, longitude: 10.1 },
    limit: 1,
  });
  expect(nearest).toHaveLength(1);
  expect(nearest[0]?._id).toBe(placeId);
  expect(nearest[0]?.name).toBe("Test Place");

  await asUser.mutation(api.places.update, {
    id: placeId,
    location: { latitude: 20, longitude: 20 },
  });

  nearest = await asUser.query(api.places.nearest, {
    point: { latitude: 10.1, longitude: 10.1 },
    limit: 1,
  });
  expect(nearest[0]?.distance).toBeGreaterThan(1_000_000);

  nearest = await asUser.query(api.places.nearest, {
    point: { latitude: 10.1, longitude: 10.1 },
    limit: 1,
    maxDistance: 1_000,
  });
  expect(nearest).toHaveLength(0);

  await asUser.mutation(api.places.remove, { id: placeId });

  nearest = await asUser.query(api.places.nearest, {
    point: { latitude: 10.1, longitude: 10.1 },
    limit: 1,
  });
  expect(nearest).toHaveLength(0);
});

describe("places.listAll", () => {
  /** Inserts `count` places plus one report on the first, optionally
   *  non-active, and returns the ids. */
  async function seedPlaces(
    t: ReturnType<typeof convexTest>,
    opts: { count: number; reportStatus?: "active" | "superseded" },
  ) {
    return await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {});
      const ids: string[] = [];
      for (let i = 0; i < opts.count; i++) {
        ids.push(
          await ctx.db.insert("places", {
            name: `Place ${String(i).padStart(2, "0")}`,
            category: "retail",
            address: `${i} Test Street`,
            location: { latitude: 6.9, longitude: 79.8 },
            accessibilityCategories: i === 0 ? ["wheelchair"] : [],
            createdBy: ownerId,
            updatedAt: 1,
          }),
        );
      }

      await ctx.db.insert("reports", {
        placeId: ids[0]!,
        authorId: ownerId,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.wheelchair_seating", value: "yes" }],
        evidence: [],
        observedAt: 1,
        status: opts.reportStatus ?? "active",
        updatedAt: 1,
      });

      return { ownerId, ids };
    });
  }

  test("returns every place without needing a location", async () => {
    const t = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(t);
    await seedPlaces(t, { count: 3 });

    const places = await t.query(api.places.listAll, {});

    expect(places).toHaveLength(3);
    // No `point` argument anywhere — that is the whole point of this query.
    expect(places.every((p) => p.location.latitude === 6.9)).toBe(true);
  });

  test("sorts by name so the list does not reshuffle", async () => {
    const t = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(t);
    await seedPlaces(t, { count: 3 });

    const places = await t.query(api.places.listAll, {});

    expect(places.map((p) => p.name)).toEqual([
      "Place 00",
      "Place 01",
      "Place 02",
    ]);
  });

  test("counts only active reports", async () => {
    const t = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(t);
    await seedPlaces(t, { count: 2, reportStatus: "active" });

    let places = await t.query(api.places.listAll, {});
    expect(places[0]?.reportCount).toBe(1);
    expect(places[1]?.reportCount).toBe(0);

    // A superseded report must stop counting, matching `getPlace` — the card
    // and the detail screen it opens cannot disagree.
    const superseded = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(superseded);
    await seedPlaces(superseded, { count: 2, reportStatus: "superseded" });

    places = await superseded.query(api.places.listAll, {});
    expect(places.every((p) => p.reportCount === 0)).toBe(true);
  });

  test("defaults accessibilityCategories to an empty array", async () => {
    const t = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(t);
    await seedPlaces(t, { count: 2 });

    const places = await t.query(api.places.listAll, {});

    // Places 0 has one tag, place 1 has none stored at all. The card branches
    // on length, so a missing field would have to be handled as undefined.
    expect(places[0]?.accessibilityCategories).toEqual(["wheelchair"]);
    expect(places[1]?.accessibilityCategories).toEqual([]);
  });

  test("respects the limit argument", async () => {
    const t = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(t);
    await seedPlaces(t, { count: 5 });

    const places = await t.query(api.places.listAll, { limit: 2 });

    expect(places).toHaveLength(2);
  });

  test("returns an empty list when there are no places", async () => {
    const t = convexTest(schema, import.meta.glob("./**/*.*s"));
    geospatialTest.register(t);

    expect(await t.query(api.places.listAll, {})).toEqual([]);
  });
});
