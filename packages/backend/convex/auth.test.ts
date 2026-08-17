import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

describe("Convex Auth User Identity & Protection", () => {
  test("currentUser returns null when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const user = await t.query(api.users.currentUser, {});
    expect(user).toBeNull();
  });

  test("currentUser returns user document when authenticated", async () => {
    const t = convexTest(schema, modules);

    // Insert a test user into the database
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
        displayName: "Wayble Tester",
        role: "member",
        updatedAt: 1,
      });
    });

    // Query currentUser with authenticated identity
    const asAuthedUser = t.withIdentity({ subject: `${userId}|session123` });
    const user = await asAuthedUser.query(api.users.currentUser, {});

    expect(user).not.toBeNull();
    expect(user?._id).toBe(userId);
    expect(user?.email).toBe("test@example.com");
    expect(user?.displayName).toBe("Wayble Tester");
  });

  test("protected mutation rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.users.updateProfile, {
        displayName: "Hacker",
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("protected mutation updates profile for authenticated callers", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "member@example.com",
        displayName: "Initial Name",
        role: "member",
        updatedAt: 1,
      });
    });

    const asAuthedUser = t.withIdentity({ subject: userId });
    const updated = await asAuthedUser.mutation(api.users.updateProfile, {
      displayName: "Updated Name",
      avatarUrl: "https://example.com/avatar.png",
    });

    expect(updated?.displayName).toBe("Updated Name");
    expect(updated?.avatarUrl).toBe("https://example.com/avatar.png");
    expect(updated?.updatedAt).toBeGreaterThan(1);

    // Verify in database
    const dbUser = await t.run(async (ctx) => ctx.db.get(userId));
    expect(dbUser?.displayName).toBe("Updated Name");
  });
});
