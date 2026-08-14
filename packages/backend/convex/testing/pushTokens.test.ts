import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

async function seedUser(t: ReturnType<typeof convexTest>, email: string) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", { email, role: "member", updatedAt: 1 }),
  );
}

describe("pushTokens.register", () => {
  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.pushTokens.register, {
        token: "ExponentPushToken[abc]",
        platform: "android",
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("stores a token for the signed-in user", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t, "a@example.com");
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
      deviceName: "Pixel 7",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("pushTokens").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(userId);
    expect(rows[0]?.deviceName).toBe("Pixel 7");
  });

  test("re-registering the same token updates rather than duplicating", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t, "a@example.com");
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });
    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
      deviceName: "Pixel 7",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("pushTokens").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.deviceName).toBe("Pixel 7");
  });

  test("re-registering revives a token disabled by DeviceNotRegistered", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t, "a@example.com");
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });
    await t.run(async (ctx) => {
      const row = await ctx.db.query("pushTokens").first();
      await ctx.db.patch(row!._id, { disabledAt: 123 });
    });

    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });

    const row = await t.run(async (ctx) => ctx.db.query("pushTokens").first());
    expect(row?.disabledAt).toBeUndefined();
  });

  test("a token moving to a different account is reassigned, not duplicated", async () => {
    const t = convexTest(schema, modules);
    const first = await seedUser(t, "a@example.com");
    const second = await seedUser(t, "b@example.com");

    await t.withIdentity({ subject: first }).mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });
    await t
      .withIdentity({ subject: second })
      .mutation(api.pushTokens.register, {
        token: "ExponentPushToken[abc]",
        platform: "android",
      });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("pushTokens").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(second);
  });

  test("two devices for one user coexist", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t, "a@example.com");
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });
    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[xyz]",
      platform: "ios",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("pushTokens").collect(),
    );
    expect(rows).toHaveLength(2);
  });
});

describe("pushTokens.unregister", () => {
  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.pushTokens.unregister, {
        token: "ExponentPushToken[abc]",
      }),
    ).rejects.toThrow("Unauthenticated");
  });

  test("removes the caller's own token", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t, "a@example.com");
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });
    await asUser.mutation(api.pushTokens.unregister, {
      token: "ExponentPushToken[abc]",
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("pushTokens").collect(),
    );
    expect(rows).toHaveLength(0);
  });

  test("will not remove another user's token", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedUser(t, "a@example.com");
    const other = await seedUser(t, "b@example.com");

    await t.withIdentity({ subject: owner }).mutation(api.pushTokens.register, {
      token: "ExponentPushToken[abc]",
      platform: "android",
    });
    await t
      .withIdentity({ subject: other })
      .mutation(api.pushTokens.unregister, { token: "ExponentPushToken[abc]" });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("pushTokens").collect(),
    );
    expect(rows).toHaveLength(1);
  });
});
