import geospatialTest from "@convex-dev/geospatial/test";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

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
  await asUser.mutation((await import("./_generated/api")).api.places.create, {
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

async function claims(t: ReturnType<typeof setup>) {
  return await t.run(async (ctx) => ctx.db.query("notificationLog").collect());
}

describe("notifications.sweep", () => {
  test("claims a notification for an opted-in user near an unreported place", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const placeId = await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(1);
    const rows = await claims(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(userId);
    expect(rows[0]?.placeId).toBe(placeId);
    expect(rows[0]?.status).toBe("pending");
    expect(rows[0]?.reason).toBe("never_reported");
    expect(rows[0]?.scheduledAt).toBe(NOW);
  });

  test("ignores users who have not opted in", async () => {
    const t = setup();
    const owner = await seedUser(t, { enabled: false });
    await seedPlace(t, owner);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
    expect(await claims(t)).toHaveLength(0);
  });

  test("skips a user whose location is too stale to trust", async () => {
    const t = setup();
    const userId = await seedUser(t, { locationAgeMs: 8 * DAY });
    await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips a user who has never reported a location", async () => {
    const t = setup();
    const owner = await seedUser(t, { hasLocation: false });
    // A separate opted-in user supplies the place so one exists nearby.
    const other = await seedUser(t);
    await seedPlace(t, other, "Far Away", { latitude: 80, longitude: 80 });
    void owner;

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("skips a place outside the user's radius", async () => {
    const t = setup();
    const userId = await seedUser(t, { radius: 500 });
    await seedPlace(t, userId, "Distant Hall", {
      latitude: 40,
      longitude: 40,
    });

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("does not claim twice for the same user in one day", async () => {
    const t = setup();
    const userId = await seedUser(t);
    await seedPlace(t, userId);

    await t.mutation(internal.notifications.sweep, { now: NOW });
    const second = await t.mutation(internal.notifications.sweep, {
      now: NOW + 60_000,
    });

    expect(second.claimed).toBe(0);
    expect(await claims(t)).toHaveLength(1);
  });

  test("respects quiet hours in the user's local time", async () => {
    const t = setup();
    // UTC+7 → 05:13 local, inside the overnight quiet window.
    const userId = await seedUser(t, { offset: 420 });
    await seedPlace(t, userId);

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("does not re-claim the same place inside its cooldown", async () => {
    const t = setup();
    const userId = await seedUser(t);
    await seedPlace(t, userId);

    await t.mutation(internal.notifications.sweep, { now: NOW });
    // A day later the daily cap has reset, but the place cooldown has not.
    const second = await t.mutation(internal.notifications.sweep, {
      now: NOW + 2 * DAY,
    });

    expect(second.claimed).toBe(0);
  });

  test("claims the place again once its cooldown has elapsed", async () => {
    const t = setup();
    const userId = await seedUser(t);
    await seedPlace(t, userId);

    await t.mutation(internal.notifications.sweep, { now: NOW });
    // Refresh the location, otherwise the user is skipped 20 days later for
    // having a stale position rather than for the cooldown under test.
    await t.run(async (ctx) =>
      ctx.db.patch(userId, {
        lastKnownLocation: {
          latitude: 10,
          longitude: 10,
          updatedAt: NOW + 20 * DAY,
          timeZoneOffsetMinutes: AWAKE_OFFSET,
        },
      }),
    );
    const second = await t.mutation(internal.notifications.sweep, {
      now: NOW + 20 * DAY,
    });

    expect(second.claimed).toBe(1);
    expect(await claims(t)).toHaveLength(2);
  });

  test("ignores a place whose reports are recent enough", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const placeId = await seedPlace(t, userId);
    await t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
        evidence: [],
        observedAt: NOW - 5 * DAY,
        status: "active",
        updatedAt: 1,
      }),
    );

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(0);
  });

  test("claims a stale place and records the age for the copy", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const placeId = await seedPlace(t, userId);
    await t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
        evidence: [],
        observedAt: NOW - 210 * DAY,
        status: "active",
        updatedAt: 1,
      }),
    );

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(1);
    const rows = await claims(t);
    expect(rows[0]?.reason).toBe("stale");
    expect(rows[0]?.ageDays).toBe(210);
  });

  test("targets the attribute a user actually needs", async () => {
    const t = setup();
    const userId = await seedUser(t, {
      needs: ["vision.braille_signage"],
    });
    const placeId = await seedPlace(t, userId);
    // The elevator is covered, but braille signage is not.
    await t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
        evidence: [],
        observedAt: NOW - 5 * DAY,
        status: "active",
        updatedAt: 1,
      }),
    );

    const result = await t.mutation(internal.notifications.sweep, { now: NOW });

    expect(result.claimed).toBe(1);
    const rows = await claims(t);
    expect(rows[0]?.attributeKey).toBe("vision.braille_signage");
  });

  test("does not notify a needs-filtered user when their needs are covered", async () => {
    const t = setup();
    const userId = await seedUser(t, { needs: ["mobility.elevator"] });
    const placeId = await seedPlace(t, userId);
    await t.run(async (ctx) =>
      ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
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

    // A scheduled function exists for the claim we just created.
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
