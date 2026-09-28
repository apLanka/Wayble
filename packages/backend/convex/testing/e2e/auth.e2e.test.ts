import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { actingAs, createPlace, seedUser, setup, stepFree } from "./helpers";

describe("Flow 1 — Auth", () => {
  test("sign up > log in > session survives restart > unauthenticated mutation rejected", async () => {
    const t = setup();

    // Sign up: the Password provider persists a user and a session row.
    const userId = await seedUser(t, "newcomer@example.com");
    const sessionId = await t.run(async (ctx) =>
      ctx.db.insert("authSessions", {
        userId,
        expirationTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }),
    );

    // Log in: the session identity resolves to the stored profile.
    const session = actingAs(t, userId, sessionId);
    const me = await session.query(api.users.currentUser, {});
    expect(me?._id).toBe(userId);
    expect(me?.email).toBe("newcomer@example.com");

    // The signed-in user can write.
    const updated = await session.mutation(api.users.updateProfile, {
      displayName: "Newcomer",
    });
    expect(updated?.displayName).toBe("Newcomer");

    // App restart: a brand-new client with only the persisted session id.
    const restarted = actingAs(t, userId, sessionId);
    const afterRestart = await restarted.query(api.users.currentUser, {});
    expect(afterRestart?._id).toBe(userId);
    expect(afterRestart?.displayName).toBe("Newcomer");
    const storedSession = await t.run(async (ctx) => ctx.db.get(sessionId));
    expect(storedSession?.userId).toBe(userId);

    // No session at all: reads are null, writes are rejected and write nothing.
    expect(await t.query(api.users.currentUser, {})).toBeNull();
    await expect(
      t.mutation(api.users.updateProfile, { displayName: "Hacker" }),
    ).rejects.toThrow("Unauthenticated");
    await expect(
      t.mutation(api.places.create, {
        name: "Ghost",
        category: "other",
        address: "nowhere",
        location: { latitude: 0, longitude: 0 },
      }),
    ).rejects.toThrow("Unauthenticated");

    const placeId = await createPlace(t, userId);
    await expect(
      t.mutation(api.reports.submitReport, {
        placeId,
        attributes: [stepFree],
        observedAt: Date.now(),
      }),
    ).rejects.toThrow("Unauthenticated");
    expect(
      await t.run(async (ctx) => ctx.db.query("reports").collect()),
    ).toHaveLength(0);
    const unchanged = await t.run(async (ctx) => ctx.db.get(userId));
    expect(unchanged?.displayName).toBe("Newcomer");
  });
});
