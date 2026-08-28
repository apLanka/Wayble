import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

function setup() {
  const t = convexTest(schema, modules);
  geospatialTest.register(t);
  return t;
}

async function seedUser(t: ReturnType<typeof setup>) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      displayName: "Place Test User",
      role: "member",
      updatedAt: 1,
    });
  });
}

describe("places.search and places.nearest", () => {
  test("search places by name", async () => {
    const t = setup();
    const userId = await seedUser(t);
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

  test("places sync with geospatial index on create, update, and remove", async () => {
    const t = setup();
    const userId = await seedUser(t);
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

    // Update location
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

    // Remove
    await asUser.mutation(api.places.remove, { id: placeId });

    nearest = await asUser.query(api.places.nearest, {
      point: { latitude: 10.1, longitude: 10.1 },
      limit: 1,
    });
    expect(nearest).toHaveLength(0);
  });

  test("nearest query ignores stale index entries when place is deleted directly", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const placeId = await asUser.mutation(api.places.create, {
      name: "Direct Delete Place",
      category: "retail",
      address: "55 Mall Rd",
      location: { latitude: 10, longitude: 10 },
    });

    // Delete directly from DB without unindexing to simulate stale index entry
    await t.run(async (ctx) => {
      await ctx.db.delete(placeId);
    });

    const nearest = await asUser.query(api.places.nearest, {
      point: { latitude: 10.05, longitude: 10.05 },
      limit: 5,
    });
    expect(nearest).toHaveLength(0);
  });
});

describe("places.create and places.update auth & validations", () => {
  test("create rejects unauthenticated callers", async () => {
    const t = setup();
    await expect(
      t.mutation(api.places.create, {
        name: "Unauthorized Place",
        category: "food_and_drink",
        address: "789 Street",
        location: { latitude: 10, longitude: 10 },
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("update throws error if place does not exist", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const placeId = await asUser.mutation(api.places.create, {
      name: "Temp",
      category: "other",
      address: "Temp",
      location: { latitude: 1, longitude: 1 },
    });
    await asUser.mutation(api.places.remove, { id: placeId });

    await expect(
      asUser.mutation(api.places.update, {
        id: placeId,
        name: "New Name",
      }),
    ).rejects.toThrow("Place not found");
  });

  test("update with category change updates category and geo index", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const placeId = await asUser.mutation(api.places.create, {
      name: "Category Place",
      category: "education",
      address: "123 School Rd",
      location: { latitude: 10, longitude: 10 },
    });

    await asUser.mutation(api.places.update, {
      id: placeId,
      category: "workplace",
    });

    const place = await t.run(async (ctx) => ctx.db.get(placeId));
    expect(place?.category).toBe("workplace");
  });
});

describe("places.seedMockPlaces", () => {
  test("seedMockPlaces rejects unauthenticated callers", async () => {
    const t = setup();
    await expect(
      t.mutation(api.places.seedMockPlaces, {
        places: [
          {
            name: "Mock Place 1",
            address: "123 Mock",
            location: { latitude: 10, longitude: 10 },
            accessibilityCategory: "wheelchair",
            features: ["Ramp"],
          },
        ],
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("seedMockPlaces seeds places and skips existing duplicates", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.places.create, {
      name: "Existing Place",
      category: "other",
      address: "100 Existing Ave",
      location: { latitude: 10, longitude: 10 },
    });

    await asUser.mutation(api.places.seedMockPlaces, {
      places: [
        {
          name: "Existing Place",
          address: "Should be skipped",
          location: { latitude: 10, longitude: 10 },
          accessibilityCategory: "wheelchair",
          features: ["Ramp"],
        },
        {
          name: "Brand New Mock Place",
          address: "200 New St",
          location: { latitude: 12, longitude: 12 },
          accessibilityCategory: "elevator",
          features: ["Elevator access"],
        },
      ],
    });

    const places = await t.run(async (ctx) => ctx.db.query("places").collect());
    expect(places).toHaveLength(2);

    const existing = places.find((p) => p.name === "Existing Place");
    expect(existing?.address).toBe("100 Existing Ave");

    const brandNew = places.find((p) => p.name === "Brand New Mock Place");
    expect(brandNew?.address).toBe("200 New St");
    expect(brandNew?.accessibilityCategories).toEqual(["elevator"]);
  });
});

describe("places.getPlace aggregation and last-write-wins", () => {
  test("getPlace returns null if place does not exist", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const placeId = await asUser.mutation(api.places.create, {
      name: "Temporary",
      category: "other",
      address: "Temp",
      location: { latitude: 10, longitude: 10 },
    });
    await asUser.mutation(api.places.remove, { id: placeId });

    const result = await asUser.query(api.places.getPlace, { placeId });
    expect(result).toBeNull();
  });

  test("getPlace returns place details with empty attributes when no reports exist", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const placeId = await asUser.mutation(api.places.create, {
      name: "Empty Place",
      category: "healthcare",
      address: "10 Health Ave",
      location: { latitude: 15, longitude: 15 },
    });

    const result = await asUser.query(api.places.getPlace, { placeId });
    expect(result).not.toBeNull();
    expect(result?._id).toBe(placeId);
    expect(result?.name).toBe("Empty Place");
    expect(result?.category).toBe("healthcare");
    expect(result?.attributes).toEqual([]);
    expect(result?.reportCount).toBe(0);
    expect(result?.lastReportedAt).toBeNull();
  });

  test("getPlace aggregates active reports with last-write-wins and computes lastReportedAt", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const placeId = await asUser.mutation(api.places.create, {
      name: "Aggregated Hospital",
      category: "healthcare",
      address: "1 Hospital Rd",
      location: { latitude: 10, longitude: 10 },
    });

    // Older report (observedAt: 1000)
    await t.run(async (ctx) => {
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [
          { key: "mobility.step_free_entrance", value: "no" },
          { key: "mobility.elevator", value: "yes" },
        ],
        evidence: [],
        observedAt: 1000,
        status: "active",
        updatedAt: 1000,
      });

      // Newer report (observedAt: 2000) overriding step_free_entrance and adding visual_alarms
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [
          {
            key: "mobility.step_free_entrance",
            value: "yes",
            note: "New ramp installed",
          },
          { key: "hearing.visual_alarms", value: "yes" },
        ],
        evidence: [],
        observedAt: 2000,
        status: "active",
        updatedAt: 2000,
      });

      // Inactive report (status: superseded) - should be ignored
      await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [
          { key: "sensory.quiet_space", value: "yes" },
        ],
        evidence: [],
        observedAt: 3000,
        status: "superseded",
        updatedAt: 3000,
      });
    });

    const result = await asUser.query(api.places.getPlace, { placeId });
    expect(result).not.toBeNull();
    expect(result?.reportCount).toBe(2);
    expect(result?.lastReportedAt).toBe(2000);

    const attrMap = new Map(result?.attributes.map((a) => [a.key, a]));
    expect(attrMap.size).toBe(3);

    expect(attrMap.get("mobility.step_free_entrance")).toEqual({
      key: "mobility.step_free_entrance",
      value: "yes",
      note: "New ramp installed",
    });

    expect(attrMap.get("mobility.elevator")).toEqual({
      key: "mobility.elevator",
      value: "yes",
    });

    expect(attrMap.get("hearing.visual_alarms")).toEqual({
      key: "hearing.visual_alarms",
      value: "yes",
    });

    expect(attrMap.has("sensory.quiet_space")).toBe(false);
  });
});
