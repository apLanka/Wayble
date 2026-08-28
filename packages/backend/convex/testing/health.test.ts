import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

test("ping works without health record", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.health.ping, {});
  expect(result.count).toBe(0);
});

test("touch creates health record and increments", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.health.touch, {});

  let result = await t.query(api.health.ping, {});
  expect(result.count).toBe(1);

  await t.mutation(api.health.touch, {});

  result = await t.query(api.health.ping, {});
  expect(result.count).toBe(2);
});
