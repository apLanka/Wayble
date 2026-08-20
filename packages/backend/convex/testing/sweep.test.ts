import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

const DAY = 24 * 60 * 60 * 1000;
/** 2023-11-14T22:13:20Z. At UTC-8 that is 14:13 local — outside quiet hours. */
const NOW = 1_700_000_000_000;
const AWAKE_OFFSET = -480;

function setup() {
  const t = convexTest(schema, modules);
  geospatialTest.register(t);
  return t;
}

type UserOpts = {
  enabled?: boolean;
  radius?: number;
  locationAgeMs?: number;
  offset?: number;
  needs?: string[];
  hasLocation?: boolean;
};

/** An opted-in user standing at (10, 10) with a fresh location. */
async function seedUser(t: ReturnType<typeof setup>, opts: UserOpts = {}) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      role: "member",
      updatedAt: 1,
      verifyNearbyEnabled: opts.enabled ?? true,
      verifyNearbyRadiusMeters: opts.radius ?? 2000,
      ...(opts.needs ? { accessibilityNeeds: opts.needs as never } : {}),
      ...((opts.hasLocation ?? true)
        ? {
            lastKnownLocation: {
              latitude: 10,
              longitude: 10,
              updatedAt: NOW - (opts.locationAgeMs ?? 0),
              timeZoneOffsetMinutes: opts.offset ?? AWAKE_OFFSET,
            },
          }
        : {}),
    }),
  );
}

/** A place at (10, 10) plus its geospatial index entry. */
async function seedPlace(
  t: ReturnType<typeof setup>,
  creator: Id<"users">,
  name = "Central Library",
  location = { latitude: 10, longitude: 10 },
) {
  const asUser = t.withIdentity({ subject: creator });
  await asUser.mutation((await import("../_generated/api")).api.places.create, {
    name,
    category: "education",
    address: "1 Main St",
    location,
  });
  return await t.run(async (ctx) => {
    const place = await ctx.db
      .query("places")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    return place!._id;
  });
}

describe("notifications.sweep", () => {
  test("claims a notification for an opted-in user near an unreported place", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const placeId = await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(1);
    expect(result.usersConsidered).toBe(1);

    const logs = await t.run(async (ctx) =>
      ctx.db.query("notificationLog").collect(),
    );
    expect(logs).toHaveLength(1);
    expect(logs[0]?.userId).toBe(userId);
    expect(logs[0]?.placeId).toBe(placeId);
    expect(logs[0]?.reason).toBe("never_reported");
    expect(logs[0]?.status).toBe("pending");
  });

  test("skips users who have not opted in", async () => {
    const t = setup();
    const userId = await seedUser(t, { enabled: false });
    await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
    expect(result.usersConsidered).toBe(0);
  });

  test("skips users with no recorded location", async () => {
    const t = setup();
    const userId = await seedUser(t, { hasLocation: false });
    await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips users whose location is older than seven days", async () => {
    const t = setup();
    const userId = await seedUser(t, { locationAgeMs: 8 * DAY });
    await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips users during their local quiet hours", async () => {
    const t = setup();
    // At UTC, 22:13 is inside the evening quiet window (21:00-08:00).
    const userId = await seedUser(t, { offset: 0 });
    await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips users who already hit the daily cap", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const placeId = await seedPlace(t, userId);
    await t.run(async (ctx) =>
      ctx.db.insert("notificationLog", {
        userId,
        placeId,
        kind: "verify_nearby",
        reason: "never_reported",
        status: "sent",
        scheduledAt: NOW - 2 * 60 * 60 * 1000,
      }),
    );

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips places outside the user's radius", async () => {
    const t = setup();
    const userId = await seedUser(t, { radius: 500 });
    // ~11 km away
    await seedPlace(t, userId, "Far Away Place", { latitude: 10.1, longitude: 10.1 });

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips places that are still inside the cooldown for this user", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const placeId = await seedPlace(t, userId);
    await t.run(async (ctx) =>
      ctx.db.insert("notificationLog", {
        userId,
        placeId,
        kind: "verify_nearby",
        reason: "never_reported",
        status: "sent",
        scheduledAt: NOW - 3 * DAY, // cooldown is 14 days
      }),
    );

    const result = await t.mutation(internal.notifications.sweep, {
      now: NOW,
    });

    expect(result.claimed).toBe(0);
  });

  test("targets a specific accessibility need when the user has one", async () => {
    const t = setup();
    const userId = await seedUser(t, {
      needs: ["mobility.step_free_entrance"],
    });
    const placeId = await seedPlace(t, userId);

    await t.mutation(internal.notifications.sweep, { now: NOW });

    const log = await t.run(async (ctx) =>
      ctx.db.query("notificationLog").first(),
    );
    expect(log?.attributeKey).toBe("mobility.step_free_entrance");
    expect(log?.reason).toBe("never_reported");
  });

  test("does not ask about a place whose needs are all freshly confirmed", async () => {
    const t = setup();
    const userId = await seedUser(t, {
      needs: ["mobility.step_free_entrance"],
    });
    const placeId = await seedPlace(t, userId);
    await t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [
          { key: "mobility.step_free_entrance", value: "yes" },
        ],
        evidence: [],
        observedAt: NOW - 5 * DAY,
        status: "active",
        updatedAt: 1,
      }),
    );

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("schedules delivery for each claim it makes", async () => {
    const t = setup();
    const userId = await seedUser(t);
    await seedPlace(t, userId);

    await t.mutation(internal.notifications.sweep, { now: NOW });

    const scheduled = await t.run(async (ctx) =>
      ctx.db.system.query("_scheduled_functions").collect(),
    );
    expect(scheduled.length).toBeGreaterThan(0);
  });
});

describe("notifications.retryStalledDeliveries", () => {
  async function seedStalledClaim(
    t: ReturnType<typeof setup>,
    scheduledAt: number,
  ) {
    return await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        role: "member",
        updatedAt: 1,
      });
      const placeId = await ctx.db.insert("places", {
        name: "Central Library",
        category: "education",
        address: "1 Main St",
        location: { latitude: 10, longitude: 10 },
        createdBy: userId,
        updatedAt: 1,
      });
      return await ctx.db.insert("notificationLog", {
        userId,
        placeId,
        kind: "verify_nearby",
        reason: "never_reported",
        status: "pending",
        scheduledAt,
      });
    });
  }

  test("reschedules a claim stuck pending past the grace period", async () => {
    const t = setup();
    const logId = await seedStalledClaim(t, NOW - 30 * 60_000);

    const result = await t.mutation(
      internal.notifications.retryStalledDeliveries,
      { now: NOW },
    );

    expect(result.retried).toBe(1);
    const log = await t.run(async (ctx) => ctx.db.get(logId));
    expect(log?.status).toBe("pending");
  });

  test("leaves a recently scheduled claim alone", async () => {
    const t = setup();
    await seedStalledClaim(t, NOW - 60_000);

    const result = await t.mutation(
      internal.notifications.retryStalledDeliveries,
      { now: NOW },
    );

    expect(result.retried).toBe(0);
  });

  test("gives up on a claim that has been pending for over a day", async () => {
    const t = setup();
    const logId = await seedStalledClaim(t, NOW - 2 * DAY);

    const result = await t.mutation(
      internal.notifications.retryStalledDeliveries,
      { now: NOW },
    );

    expect(result.retried).toBe(0);
    expect(result.abandoned).toBe(1);
    const log = await t.run(async (ctx) => ctx.db.get(logId));
    expect(log?.status).toBe("failed");
    expect(log?.errorCode).toBe("DeliveryStalled");
  });

  test("ignores claims that already resolved", async () => {
    const t = setup();
    const logId = await seedStalledClaim(t, NOW - 30 * 60_000);
    await t.run(async (ctx) => ctx.db.patch(logId, { status: "sent" }));

    const result = await t.mutation(
      internal.notifications.retryStalledDeliveries,
      { now: NOW },
    );

    expect(result.retried).toBe(0);
    expect(result.abandoned).toBe(0);
  });
});
