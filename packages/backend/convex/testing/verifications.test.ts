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

async function seedUser(
  t: ReturnType<typeof setup>,
  name = "Verifier User",
  email = "verifier@test.com",
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name,
      displayName: name,
      email,
      role: "member",
      updatedAt: Date.now(),
    });
  });
}

describe("verifications.recentVerifications", () => {
  test("returns empty array when no verifications exist", async () => {
    const t = setup();
    const results = await t.query(api.verifications.recentVerifications, {});
    expect(results).toEqual([]);
  });

  test("fetches enriched recent verifications ordered by timestamp", async () => {
    const t = setup();
    const userId = await seedUser(t, "Alice Verifier");
    const asUser = t.withIdentity({ subject: userId });

    // Create a place
    const placeId = await asUser.mutation(api.places.create, {
      name: "Unity Plaza",
      category: "retail",
      address: "Bambalapitiya, Colombo 04",
      location: { latitude: 6.89, longitude: 79.85 },
    });

    // Create an active report
    const reportId = await t.run(async (ctx) => {
      return await ctx.db.insert("reports", {
        placeId,
        authorId: userId,
        taxonomyVersion: 1,
        attributes: [
          {
            key: "mobility.step_free_entrance",
            value: "yes",
            note: "Ramp at south entrance",
          },
        ],
        evidence: [],
        observedAt: 1000,
        status: "active",
        updatedAt: 1000,
      });
    });

    // Submit a verification
    const verificationId = await asUser.mutation(
      api.verifications.submitVerification,
      {
        reportId,
        verdict: "confirm",
        note: "Confirmed ramp is clear and unobstructed",
      },
    );

    expect(verificationId).toBeDefined();

    // Query recent verifications
    const feed = await t.query(api.verifications.recentVerifications, {});
    expect(feed).toHaveLength(1);
    expect(feed[0]?._id).toBe(verificationId);
    expect(feed[0]?.verdict).toBe("confirm");
    expect(feed[0]?.place.name).toBe("Unity Plaza");
    expect(feed[0]?.place.category).toBe("retail");
    expect(feed[0]?.verifier.name).toBe("Alice Verifier");
    expect(feed[0]?.confidence.label).toBe("Verified");
    expect(feed[0]?.confidence.level).toBe("verified");
    expect(feed[0]?.primaryAttribute?.key).toBe("mobility.step_free_entrance");
  });

  test("filters verifications by placeId", async () => {
    const t = setup();
    const userA = await seedUser(t, "User A", "a@test.com");
    const userB = await seedUser(t, "User B", "b@test.com");
    const asUserA = t.withIdentity({ subject: userA });
    const asUserB = t.withIdentity({ subject: userB });

    const placeA = await asUserA.mutation(api.places.create, {
      name: "Place A",
      category: "food_and_drink",
      address: "123 A St",
      location: { latitude: 6.9, longitude: 79.8 },
    });

    const placeB = await asUserB.mutation(api.places.create, {
      name: "Place B",
      category: "healthcare",
      address: "456 B Rd",
      location: { latitude: 6.95, longitude: 79.85 },
    });

    // Create reports for both
    const reportA = await t.run(async (ctx) => {
      return await ctx.db.insert("reports", {
        placeId: placeA,
        authorId: userA,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.elevator", value: "yes" }],
        evidence: [],
        observedAt: 1000,
        status: "active",
        updatedAt: 1000,
      });
    });

    const reportB = await t.run(async (ctx) => {
      return await ctx.db.insert("reports", {
        placeId: placeB,
        authorId: userB,
        taxonomyVersion: 1,
        attributes: [{ key: "sensory.quiet_space", value: "yes" }],
        evidence: [],
        observedAt: 1100,
        status: "active",
        updatedAt: 1100,
      });
    });

    // Add verifications
    await asUserA.mutation(api.verifications.submitVerification, {
      reportId: reportA,
      verdict: "confirm",
      note: "Elevator verified",
    });

    await asUserB.mutation(api.verifications.submitVerification, {
      reportId: reportB,
      verdict: "dispute",
      note: "Construction noise currently",
    });

    // Test placeId filter
    const placeAFeed = await t.query(api.verifications.recentVerifications, {
      placeId: placeA,
    });
    expect(placeAFeed).toHaveLength(1);
    expect(placeAFeed[0]?.place.name).toBe("Place A");

    const placeBFeed = await t.query(api.verifications.recentVerifications, {
      placeId: placeB,
    });
    expect(placeBFeed).toHaveLength(1);
    expect(placeBFeed[0]?.place.name).toBe("Place B");
    expect(placeBFeed[0]?.verdict).toBe("dispute");
    expect(placeBFeed[0]?.confidence.level).toBe("disputed");

    // Test placeIds array filter (scoping to both or one)
    const multiFeed = await t.query(api.verifications.recentVerifications, {
      placeIds: [placeA, placeB],
    });
    expect(multiFeed).toHaveLength(2);
  });

  test("calculates High Confidence badge when multiple confirmations exist without dispute", async () => {
    const t = setup();
    const user1 = await seedUser(t, "User 1", "u1@test.com");
    const user2 = await seedUser(t, "User 2", "u2@test.com");
    const user3 = await seedUser(t, "User 3", "u3@test.com");

    const placeId = await t
      .withIdentity({ subject: user1 })
      .mutation(api.places.create, {
        name: "Community Center",
        category: "government",
        address: "Main Plaza",
        location: { latitude: 6.9, longitude: 79.8 },
      });

    const reportId = await t.run(async (ctx) => {
      return await ctx.db.insert("reports", {
        placeId,
        authorId: user1,
        taxonomyVersion: 1,
        attributes: [{ key: "mobility.accessible_restroom", value: "yes" }],
        evidence: [],
        observedAt: 1000,
        status: "active",
        updatedAt: 1000,
      });
    });

    // Submit 3 confirmations from 3 distinct users
    await t
      .withIdentity({ subject: user1 })
      .mutation(api.verifications.submitVerification, {
        reportId,
        verdict: "confirm",
      });
    await t
      .withIdentity({ subject: user2 })
      .mutation(api.verifications.submitVerification, {
        reportId,
        verdict: "confirm",
      });
    await t
      .withIdentity({ subject: user3 })
      .mutation(api.verifications.submitVerification, {
        reportId,
        verdict: "confirm",
      });

    const feed = await t.query(api.verifications.recentVerifications, {
      placeId,
    });
    expect(feed).toHaveLength(3);
    expect(feed[0]?.confidence.level).toBe("high_confidence");
    expect(feed[0]?.confidence.label).toBe("High Confidence");
    expect(feed[0]?.totalVerifications).toBe(3);
  });

  test("submitPlaceVerification automatically creates report if none exists", async () => {
    const t = setup();
    const user = await seedUser(t, "Quick Verifier", "quick@test.com");

    const placeId = await t
      .withIdentity({ subject: user })
      .mutation(api.places.create, {
        name: "New Cafe",
        category: "food_and_drink",
        address: "7th Lane",
        location: { latitude: 6.91, longitude: 79.86 },
      });

    const verificationId = await t
      .withIdentity({ subject: user })
      .mutation(api.verifications.submitPlaceVerification, {
        placeId,
        verdict: "confirm",
        note: "Great ramp and automatic doors",
      });

    expect(verificationId).toBeDefined();

    const feed = await t.query(api.verifications.recentVerifications, {
      placeId,
    });
    expect(feed).toHaveLength(1);
    expect(feed[0]?.place.name).toBe("New Cafe");
    expect(feed[0]?.verdict).toBe("confirm");
  });
});
