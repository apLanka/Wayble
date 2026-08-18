import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("seed + nearest returns closest point first, distance-sorted", async () => {
  const t = convexTest(schema, import.meta.glob("./**/*.*s"));
  geospatialTest.register(t);

  const { inserted } = await t.mutation(api.geoSpike.seed, {});
  expect(inserted).toBe(22);

  const results = await t.query(api.geoSpike.nearest, {
    point: { latitude: 6.9147, longitude: 79.9723 }, // SLIIT coords
    limit: 3,
  });

  expect(results).toHaveLength(3);
  expect(results[0]?.key).toBe("spike:SLIIT Campus");
  expect(results[0]?.distance).toBeLessThanOrEqual(
    results[1]?.distance ?? Infinity,
  );
  expect(results[1]?.distance).toBeLessThanOrEqual(
    results[2]?.distance ?? Infinity,
  );
});
