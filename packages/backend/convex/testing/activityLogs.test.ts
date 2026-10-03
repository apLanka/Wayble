import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

type T = ReturnType<typeof setup>;

function setup() {
  return convexTest(schema, modules);
}

async function seedUser(t: T, email = "user@example.com", name = "Test User") {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email,
      name,
      displayName: name,
      role: "member",
      updatedAt: 1,
    }),
  );
}

describe("activityLogs CRUD backend", () => {
  test("createLog: rejects unauthenticated callers", async () => {
    const t = setup();
    await expect(
      t.mutation(api.activityLogs.createLog, {
        placeName: "Central Library",
        title: "Checked accessibility ramp",
        accessibilityRating: "accessible",
      }),
    ).rejects.toThrow(/Unauthenticated/);
  });

  test("createLog: rejects empty title or placeName", async () => {
    const t = setup();
    const userId = await seedUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.activityLogs.createLog, {
        placeName: "   ",
        title: "Valid Title",
        accessibilityRating: "accessible",
      }),
    ).rejects.toThrow(/Place name cannot be empty/);

    await expect(
      asUser.mutation(api.activityLogs.createLog, {
        placeName: "Valid Place",
        title: "   ",
        accessibilityRating: "accessible",
      }),
    ).rejects.toThrow(/Title cannot be empty/);
  });

  test("createLog & listMyLogs: successfully creates and lists logs in order", async () => {
    const t = setup();
    const userId1 = await seedUser(t, "user1@example.com", "User 1");
    const userId2 = await seedUser(t, "user2@example.com", "User 2");

    const asUser1 = t.withIdentity({ subject: userId1 });
    const asUser2 = t.withIdentity({ subject: userId2 });

    const log1Id = await asUser1.mutation(api.activityLogs.createLog, {
      placeName: "City Hall",
      title: "Ramp and automatic door test",
      notes: "Main entrance has a smooth ramp.",
      accessibilityRating: "accessible",
      visitedAt: 1000,
    });

    const log2Id = await asUser1.mutation(api.activityLogs.createLog, {
      placeName: "Metro Station",
      title: "Elevator out of service",
      notes: "Elevator at platform 2 was broken.",
      accessibilityRating: "inaccessible",
      visitedAt: 2000,
    });

    // User 2's log
    await asUser2.mutation(api.activityLogs.createLog, {
      placeName: "User 2 Place",
      title: "User 2 Activity",
      accessibilityRating: "partially_accessible",
      visitedAt: 1500,
    });

    // User 1 lists logs: should see their own 2 logs, newest visited first
    const user1Logs = await asUser1.query(api.activityLogs.listMyLogs, {});
    expect(user1Logs).toHaveLength(2);
    expect(user1Logs[0]!._id).toBe(log2Id);
    expect(user1Logs[0]!.placeName).toBe("Metro Station");
    expect(user1Logs[0]!.accessibilityRating).toBe("inaccessible");
    expect(user1Logs[1]!._id).toBe(log1Id);
    expect(user1Logs[1]!.placeName).toBe("City Hall");

    // User 2 lists logs: should only see their own 1 log
    const user2Logs = await asUser2.query(api.activityLogs.listMyLogs, {});
    expect(user2Logs).toHaveLength(1);
    expect(user2Logs[0]!.placeName).toBe("User 2 Place");
  });

  test("getLog: retrieves log if owned, returns null if not", async () => {
    const t = setup();
    const userId1 = await seedUser(t, "u1@example.com", "U1");
    const userId2 = await seedUser(t, "u2@example.com", "U2");

    const asUser1 = t.withIdentity({ subject: userId1 });
    const asUser2 = t.withIdentity({ subject: userId2 });

    const logId = await asUser1.mutation(api.activityLogs.createLog, {
      placeName: "Park Restroom",
      title: "Tested accessible restroom",
      accessibilityRating: "partially_accessible",
      visitedAt: 1000,
    });

    const fetchedByOwner = await asUser1.query(api.activityLogs.getLog, {
      id: logId,
    });
    expect(fetchedByOwner).not.toBeNull();
    expect(fetchedByOwner?.title).toBe("Tested accessible restroom");

    const fetchedByOther = await asUser2.query(api.activityLogs.getLog, {
      id: logId,
    });
    expect(fetchedByOther).toBeNull();
  });

  test("updateLog: updates existing log and prevents unauthorized edits", async () => {
    const t = setup();
    const userId1 = await seedUser(t, "u1@example.com", "U1");
    const userId2 = await seedUser(t, "u2@example.com", "U2");

    const asUser1 = t.withIdentity({ subject: userId1 });
    const asUser2 = t.withIdentity({ subject: userId2 });

    const logId = await asUser1.mutation(api.activityLogs.createLog, {
      placeName: "Initial Cafe",
      title: "Initial Title",
      accessibilityRating: "inaccessible",
      visitedAt: 1000,
    });

    // Other user attempts to update
    await expect(
      asUser2.mutation(api.activityLogs.updateLog, {
        id: logId,
        placeName: "Hacked Cafe",
        title: "Hacked Title",
        accessibilityRating: "accessible",
        visitedAt: 1000,
      }),
    ).rejects.toThrow(/Unauthorized/);

    // Owner updates
    await asUser1.mutation(api.activityLogs.updateLog, {
      id: logId,
      placeName: "Updated Cafe",
      title: "Updated Title - Now Accessible!",
      notes: "Installed temporary portable ramp.",
      accessibilityRating: "accessible",
      visitedAt: 1200,
    });

    const updated = await asUser1.query(api.activityLogs.getLog, { id: logId });
    expect(updated?.placeName).toBe("Updated Cafe");
    expect(updated?.title).toBe("Updated Title - Now Accessible!");
    expect(updated?.accessibilityRating).toBe("accessible");
    expect(updated?.notes).toBe("Installed temporary portable ramp.");
    expect(updated?.visitedAt).toBe(1200);
  });

  test("removeLog: deletes log and prevents unauthorized deletion", async () => {
    const t = setup();
    const userId1 = await seedUser(t, "u1@example.com", "U1");
    const userId2 = await seedUser(t, "u2@example.com", "U2");

    const asUser1 = t.withIdentity({ subject: userId1 });
    const asUser2 = t.withIdentity({ subject: userId2 });

    const logId = await asUser1.mutation(api.activityLogs.createLog, {
      placeName: "Delete Me Place",
      title: "Will be deleted",
      accessibilityRating: "partially_accessible",
      visitedAt: 1000,
    });

    // Other user attempts to delete
    await expect(
      asUser2.mutation(api.activityLogs.removeLog, { id: logId }),
    ).rejects.toThrow(/Unauthorized/);

    // Owner deletes
    await asUser1.mutation(api.activityLogs.removeLog, { id: logId });

    const logs = await asUser1.query(api.activityLogs.listMyLogs, {});
    expect(logs).toHaveLength(0);
  });

  test("getMyStats: computes user stats correctly", async () => {
    const t = setup();
    const userId = await seedUser(t, "stats@example.com", "Stats User");
    const asUser = t.withIdentity({ subject: userId });

    const emptyStats = await asUser.query(api.activityLogs.getMyStats, {});
    expect(emptyStats).toEqual({
      totalCount: 0,
      accessibleCount: 0,
      partialCount: 0,
      inaccessibleCount: 0,
    });

    await asUser.mutation(api.activityLogs.createLog, {
      placeName: "Place A",
      title: "Log A",
      accessibilityRating: "accessible",
    });
    await asUser.mutation(api.activityLogs.createLog, {
      placeName: "Place B",
      title: "Log B",
      accessibilityRating: "accessible",
    });
    await asUser.mutation(api.activityLogs.createLog, {
      placeName: "Place C",
      title: "Log C",
      accessibilityRating: "partially_accessible",
    });
    await asUser.mutation(api.activityLogs.createLog, {
      placeName: "Place D",
      title: "Log D",
      accessibilityRating: "inaccessible",
    });

    const stats = await asUser.query(api.activityLogs.getMyStats, {});
    expect(stats).toEqual({
      totalCount: 4,
      accessibleCount: 2,
      partialCount: 1,
      inaccessibleCount: 1,
    });
  });

  test("listPublicFeed: returns posts from all users with author details and tags", async () => {
    const t = setup();
    const userA = await seedUser(t, "userA@example.com", "Sarah Jenkins");
    const userB = await seedUser(t, "userB@example.com", "David Miller");

    const asA = t.withIdentity({ subject: userA });
    const asB = t.withIdentity({ subject: userB });

    await asA.mutation(api.activityLogs.createLog, {
      placeName: "City Library",
      title: "Wheelchair ramp tested",
      notes: "Smooth gradient, automatic doors.",
      accessibilityRating: "accessible",
      imageUrl: "https://example.com/ramp.jpg",
      imageAlt: "Wide concrete ramp with dual handrails",
      tags: ["WheelchairAccessible", "RampCheck"],
      visitedAt: 1000,
    });

    await asB.mutation(api.activityLogs.createLog, {
      placeName: "Metro Central",
      title: "Elevator out of order",
      accessibilityRating: "inaccessible",
      tags: ["ElevatorStatus"],
      visitedAt: 2000,
    });

    const feed = await asB.query(api.activityLogs.listPublicFeed, {});
    expect(feed).toHaveLength(2);

    // Newest post first
    expect(feed[0]!.authorName).toBe("David Miller");
    expect(feed[0]!.placeName).toBe("Metro Central");
    expect(feed[0]!.tags).toEqual(["ElevatorStatus"]);

    expect(feed[1]!.authorName).toBe("Sarah Jenkins");
    expect(feed[1]!.placeName).toBe("City Library");
    expect(feed[1]!.imageUrl).toBe("https://example.com/ramp.jpg");
    expect(feed[1]!.imageAlt).toBe("Wide concrete ramp with dual handrails");
    expect(feed[1]!.tags).toEqual(["WheelchairAccessible", "RampCheck"]);
  });

  test("toggleHelpful: increments and decrements helpful count atomically", async () => {
    const t = setup();
    const authorId = await seedUser(t, "author@example.com", "Author");
    const voterId = await seedUser(t, "voter@example.com", "Voter");

    const asAuthor = t.withIdentity({ subject: authorId });
    const asVoter = t.withIdentity({ subject: voterId });

    const logId = await asAuthor.mutation(api.activityLogs.createLog, {
      placeName: "Test Venue",
      title: "Accessible Restroom Verified",
      accessibilityRating: "accessible",
    });

    // Voter likes post
    const res1 = await asVoter.mutation(api.activityLogs.toggleHelpful, {
      id: logId,
    });
    expect(res1.helpfulCount).toBe(1);
    expect(res1.isHelpful).toBe(true);

    let feed = await asVoter.query(api.activityLogs.listPublicFeed, {});
    expect(feed[0]!.helpfulCount).toBe(1);
    expect(feed[0]!.isHelpful).toBe(true);

    // Author checks feed: should see count 1, but isHelpful false for author
    const authorFeed = await asAuthor.query(
      api.activityLogs.listPublicFeed,
      {},
    );
    expect(authorFeed[0]!.helpfulCount).toBe(1);
    expect(authorFeed[0]!.isHelpful).toBe(false);

    // Voter toggles off (unlikes)
    const res2 = await asVoter.mutation(api.activityLogs.toggleHelpful, {
      id: logId,
    });
    expect(res2.helpfulCount).toBe(0);
    expect(res2.isHelpful).toBe(false);

    feed = await asVoter.query(api.activityLogs.listPublicFeed, {});
    expect(feed[0]!.helpfulCount).toBe(0);
    expect(feed[0]!.isHelpful).toBe(false);
  });
});
