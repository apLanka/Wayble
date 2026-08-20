import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

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
