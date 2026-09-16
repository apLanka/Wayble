import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

async function seedAuthor(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const authorId = await ctx.db.insert("users", {
      email: "author@example.com",
      displayName: "Report Author",
      role: "member",
      updatedAt: 1,
    });
    const ownerId = await ctx.db.insert("users", {
      email: "owner@example.com",
      displayName: "Place Owner",
      role: "member",
      updatedAt: 1,
    });
    const placeId = await ctx.db.insert("places", {
      name: "Community Library",
      category: "education",
      address: "1 Main Street",
      location: { latitude: 6.9271, longitude: 79.8612 },
      createdBy: ownerId,
      updatedAt: 1,
    });
    return { authorId, placeId };
  });
}

const validAttribute = {
  key: "mobility.step_free_entrance" as const,
  value: "yes" as const,
};

describe("US-08 report submission", () => {
  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    const { placeId } = await seedAuthor(t);

    await expect(
      t.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Unauthenticated");

    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(0);
  });

  test("persists a report and derives the author from the session", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const observedAt = Date.now();

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [
        validAttribute,
        { key: "mobility.elevator", value: "partial", note: "Keypad is tall." },
      ],
      summary: "Library entrance is step free.",
      observedAt,
    });

    // The place's creator is a different user, so an authorId of
    // place.createdBy would fail this assertion rather than pass by
    // coincidence.
    const placeRow = await t.run(async (ctx) => ctx.db.get(placeId));
    expect(placeRow?.createdBy).not.toBe(userId);
    expect(created?.authorId).toBe(userId);
    expect(created?.placeId).toBe(placeId);
    expect(created?.taxonomyVersion).toBe(1);
    expect(created?.status).toBe("active");
    expect(created?.summary).toBe("Library entrance is step free.");
    expect(created?.observedAt).toBe(observedAt);
    expect(created?.evidence).toEqual([]);
    expect(created?.attributes).toHaveLength(2);

    const stored = await t.run(async (ctx) =>
      ctx.db
        .query("reports")
        .withIndex("by_place_and_author", (q) =>
          q.eq("placeId", placeId).eq("authorId", userId),
        )
        .collect(),
    );
    expect(stored).toHaveLength(1);
  });

  test("rejects an empty attributes array", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Add at least one accessibility attribute");
  });

  test("rejects duplicate attribute keys", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [
          validAttribute,
          { key: "mobility.step_free_entrance", value: "no" },
        ],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Duplicate accessibility attribute");
  });

  test("rejects a summary over the cap", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [validAttribute],
        summary: "x".repeat(501),
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Summary too long");
  });

  test("accepts a summary exactly at the cap", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });
    const summary = "x".repeat(500);

    const created = await asUser.mutation(api.reports.submitReport, {
      placeId,
      attributes: [validAttribute],
      summary,
      observedAt: Date.now(),
    });

    expect(created?.summary).toBe(summary);
  });

  test("rejects a per-attribute note over the cap", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId, placeId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId,
        attributes: [
          { key: "mobility.elevator", value: "partial", note: "x".repeat(281) },
        ],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Note too long");
  });

  test("rejects a place that does not exist", async () => {
    const t = convexTest(schema, modules);
    const { authorId: userId } = await seedAuthor(t);
    const asUser = t.withIdentity({ subject: userId });

    // Convex validates `v.id("places")` as a well-formed id, not as a row
    // that still exists, so a deleted row is the only way to reach the
    // handler's existence check.
    const ghostPlaceId = await t.run(async (ctx) => {
      const ghost = await ctx.db.insert("places", {
        name: "Ghost Place",
        category: "other",
        address: "Nowhere",
        location: { latitude: 6.9, longitude: 79.8 },
        createdBy: userId,
        updatedAt: 1,
      });
      await ctx.db.delete(ghost);
      return ghost;
    });

    await expect(
      asUser.mutation(api.reports.submitReport, {
        placeId: ghostPlaceId,
        attributes: [validAttribute],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Unknown place");
  });
});
