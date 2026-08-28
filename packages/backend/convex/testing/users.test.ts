import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { roundCoordinate } from "../users";

const modules = import.meta.glob("../**/*.*s");

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

describe("users.currentUser", () => {
  test("currentUser returns null when not logged in", async () => {
    const t = convexTest(schema, modules);
    const user = await t.query(api.users.currentUser, {});
    expect(user).toBeNull();
  });

  test("currentUser returns authenticated user profile", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const user = await asUser.query(api.users.currentUser, {});
    expect(user).not.toBeNull();
    expect(user?._id).toBe(userId);
    expect(user?.email).toBe("member@example.com");
    expect(user?.displayName).toBe("Initial Name");
  });
});

describe("roundCoordinate utility", () => {
  test("rounds positive coordinates to 3 decimal places (~110m)", () => {
    expect(roundCoordinate(6.927079)).toBe(6.927);
    expect(roundCoordinate(79.861244)).toBe(79.861);
    expect(roundCoordinate(10.12345)).toBe(10.123);
    expect(roundCoordinate(10.1236)).toBe(10.124);
  });

  test("rounds negative coordinates correctly", () => {
    expect(roundCoordinate(-33.8688197)).toBe(-33.869);
    expect(roundCoordinate(-0.0004)).toBe(-0);
    expect(roundCoordinate(-122.419416)).toBe(-122.419);
  });
});

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

  test("updating avatarUrl updates avatar and preserves other fields", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const updated = await asUser.mutation(api.users.updateProfile, {
      avatarUrl: "https://example.com/photo.jpg",
    });

    expect(updated?.avatarUrl).toBe("https://example.com/photo.jpg");
    expect(updated?.displayName).toBe("Initial Name");
  });
});

describe("US-21 location and notification preferences", () => {
  test("updateLastKnownLocation rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.users.updateLastKnownLocation, {
        latitude: 6.9061234,
        longitude: 79.8612345,
        timeZoneOffsetMinutes: 330,
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("updateLastKnownLocation rounds coordinates to about 110 metres", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateLastKnownLocation, {
      latitude: 6.9061234,
      longitude: 79.8612345,
      timeZoneOffsetMinutes: 330,
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.lastKnownLocation?.latitude).toBe(6.906);
    expect(user?.lastKnownLocation?.longitude).toBe(79.861);
    expect(user?.lastKnownLocation?.timeZoneOffsetMinutes).toBe(330);
  });

  test("updateNotificationPrefs rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.users.updateNotificationPrefs, {
        verifyNearbyEnabled: true,
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("enabling notifications applies the default radius", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyEnabled: true,
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.verifyNearbyEnabled).toBe(true);
    expect(user?.verifyNearbyRadiusMeters).toBe(2000);
  });

  test("an explicit radius is kept and does not clobber the toggle", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyEnabled: true,
      verifyNearbyRadiusMeters: 500,
    });
    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyRadiusMeters: 5000,
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.verifyNearbyEnabled).toBe(true);
    expect(user?.verifyNearbyRadiusMeters).toBe(5000);
  });

  test("accepts boundary values: minimum radius 250m and maximum 20,000m", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    // Minimum 250m
    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyRadiusMeters: 250,
    });
    let user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.verifyNearbyRadiusMeters).toBe(250);

    // Maximum 20,000m
    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyRadiusMeters: 20000,
    });
    user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.verifyNearbyRadiusMeters).toBe(20000);
  });

  test("rejects a radius below 250m or above 20,000m", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.users.updateNotificationPrefs, {
        verifyNearbyRadiusMeters: 249,
      }),
    ).rejects.toThrow("Unsupported radius");

    await expect(
      asUser.mutation(api.users.updateNotificationPrefs, {
        verifyNearbyRadiusMeters: 20001,
      }),
    ).rejects.toThrow("Unsupported radius");
  });

  test("disabling notification toggle preserves previously set radius", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyEnabled: true,
      verifyNearbyRadiusMeters: 3500,
    });

    await asUser.mutation(api.users.updateNotificationPrefs, {
      verifyNearbyEnabled: false,
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.verifyNearbyEnabled).toBe(false);
    expect(user?.verifyNearbyRadiusMeters).toBe(3500);
  });
});
