import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

/** Seeds a member user and returns its id. */
async function seedUser(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: "member@example.com",
      displayName: "Initial Name",
      role: "member",
      updatedAt: 1,
    });
  });
}

describe("US-02 accessibility needs profile", () => {
  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.users.updateProfile, {
        accessibilityNeeds: ["mobility.step_free_entrance"],
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("stores the selected needs on the user document", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const updated = await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: [
        "mobility.step_free_entrance",
        "mobility.accessible_restroom",
        "vision.braille_signage",
      ],
    });

    expect(updated?.accessibilityNeeds).toEqual([
      "mobility.step_free_entrance",
      "mobility.accessible_restroom",
      "vision.braille_signage",
    ]);

    const dbUser = await t.run(async (ctx) => ctx.db.get(userId));
    expect(dbUser?.accessibilityNeeds).toHaveLength(3);
  });

  test("replaces the previous needs wholesale rather than merging", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: ["mobility.step_free_entrance", "mobility.elevator"],
    });
    const updated = await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: ["hearing.hearing_loop"],
    });

    expect(updated?.accessibilityNeeds).toEqual(["hearing.hearing_loop"]);
  });

  test("an empty array clears the stored needs", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: ["sensory.quiet_space"],
    });
    const updated = await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: [],
    });

    expect(updated?.accessibilityNeeds).toEqual([]);
  });

  test("rejects duplicate attribute keys", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.users.updateProfile, {
        accessibilityNeeds: ["mobility.elevator", "mobility.elevator"],
      }),
    ).rejects.toThrow("Duplicate");
  });

  test("updating needs alone leaves displayName untouched", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const updated = await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: ["assistance.service_animals"],
    });

    expect(updated?.displayName).toBe("Initial Name");
  });

  test("updating displayName alone leaves stored needs untouched", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateProfile, {
      accessibilityNeeds: ["vision.tactile_guidance"],
    });
    const updated = await asUser.mutation(api.users.updateProfile, {
      displayName: "Renamed",
    });

    expect(updated?.displayName).toBe("Renamed");
    expect(updated?.accessibilityNeeds).toEqual(["vision.tactile_guidance"]);
  });
});
