import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

/**
 * Helper to seed a place with a user who created it.
 */
async function seedPlace(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const authorId = await ctx.db.insert("users", {
      displayName: "Place Creator",
      role: "member",
      updatedAt: 1,
    });
    const placeId = await ctx.db.insert("places", {
      name: "Test Library",
      category: "education",
      address: "42 Knowledge Lane",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: authorId,
      updatedAt: 1,
    });
    return { authorId, placeId };
  });
}

test("returns place with aggregated attributes from multiple active reports (last-write-wins)", async () => {
  const t = convexTest(schema, modules);
  const { authorId, placeId } = await seedPlace(t);

  // Seed two active reports with overlapping keys.
  // Report 1 (older): step_free_entrance=yes, wide_entrance=no
  // Report 2 (newer): step_free_entrance=partial (should win), elevator=yes
  await t.run(async (ctx) => {
    await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [
        { key: "mobility.step_free_entrance", value: "yes" },
        { key: "mobility.wide_entrance", value: "no" },
      ],
      evidence: [],
      observedAt: 100,
      status: "active",
      updatedAt: 100,
    });
    await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [
        {
          key: "mobility.step_free_entrance",
          value: "partial",
          note: "Ramp installed but steep",
        },
        { key: "mobility.elevator", value: "yes" },
      ],
      evidence: [],
      observedAt: 200,
      status: "active",
      updatedAt: 200,
    });
  });

  const result = await t.query(api.places.getPlace, { placeId });

  expect(result).not.toBeNull();
  expect(result!.name).toBe("Test Library");
  expect(result!.category).toBe("education");
  expect(result!.address).toBe("42 Knowledge Lane");
  expect(result!.reportCount).toBe(2);
  expect(result!.lastReportedAt).toBe(200);

  // step_free_entrance should be "partial" (from newer report)
  const stepFree = result!.attributes.find(
    (a) => a.key === "mobility.step_free_entrance",
  );
  expect(stepFree?.value).toBe("partial");
  expect(stepFree?.note).toBe("Ramp installed but steep");

  // wide_entrance should be "no" (only in older report)
  const wideEntrance = result!.attributes.find(
    (a) => a.key === "mobility.wide_entrance",
  );
  expect(wideEntrance?.value).toBe("no");

  // elevator should be "yes" (only in newer report)
  const elevator = result!.attributes.find(
    (a) => a.key === "mobility.elevator",
  );
  expect(elevator?.value).toBe("yes");

  // Total unique attributes: 3
  expect(result!.attributes).toHaveLength(3);
});

test("returns empty attributes and reportCount 0 when place has no reports", async () => {
  const t = convexTest(schema, modules);
  const { placeId } = await seedPlace(t);

  const result = await t.query(api.places.getPlace, { placeId });

  expect(result).not.toBeNull();
  expect(result!.name).toBe("Test Library");
  expect(result!.attributes).toEqual([]);
  expect(result!.reportCount).toBe(0);
  expect(result!.lastReportedAt).toBeNull();
});

test("ignores non-active (superseded/removed) reports in aggregation", async () => {
  const t = convexTest(schema, modules);
  const { authorId, placeId } = await seedPlace(t);

  await t.run(async (ctx) => {
    // Active report
    await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "mobility.step_free_entrance", value: "yes" }],
      evidence: [],
      observedAt: 100,
      status: "active",
      updatedAt: 100,
    });
    // Superseded report (should be ignored even though newer)
    await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "mobility.step_free_entrance", value: "no" }],
      evidence: [],
      observedAt: 200,
      status: "superseded",
      updatedAt: 200,
    });
    // Removed report (should be ignored)
    await ctx.db.insert("reports", {
      placeId,
      authorId,
      taxonomyVersion: 1,
      attributes: [{ key: "vision.braille_signage", value: "yes" }],
      evidence: [],
      observedAt: 300,
      status: "removed",
      updatedAt: 300,
    });
  });

  const result = await t.query(api.places.getPlace, { placeId });

  expect(result!.reportCount).toBe(1);
  expect(result!.attributes).toHaveLength(1);

  const stepFree = result!.attributes.find(
    (a) => a.key === "mobility.step_free_entrance",
  );
  expect(stepFree?.value).toBe("yes"); // From the active report, not superseded

  // braille_signage should not appear (removed report)
  const braille = result!.attributes.find(
    (a) => a.key === "vision.braille_signage",
  );
  expect(braille).toBeUndefined();
});

test("returns null for a nonexistent place ID", async () => {
  const t = convexTest(schema, modules);
  // Seed a place just to have a valid-format ID, then use a different one
  const { placeId } = await seedPlace(t);

  // Delete the place to simulate nonexistent
  await t.run(async (ctx) => {
    await ctx.db.delete(placeId);
  });

  const result = await t.query(api.places.getPlace, { placeId });
  expect(result).toBeNull();
});
