import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A user with one active token, a place, and a pending claim for it. */
async function seedPendingClaim(
  t: ReturnType<typeof convexTest>,
  attributeKey?: "mobility.step_free_entrance",
) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email: "a@example.com",
      role: "member",
      updatedAt: 1,
    });
    const placeId = await ctx.db.insert("places", {
      name: "Central Library",
      category: "education",
      address: "1 Main St",
      location: { latitude: 6.9, longitude: 79.8 },
      createdBy: userId,
      updatedAt: 1,
    });
    const tokenId = await ctx.db.insert("pushTokens", {
      userId,
      token: "ExponentPushToken[abc]",
      platform: "android",
      updatedAt: 1,
    });
    const logId = await ctx.db.insert("notificationLog", {
      userId,
      placeId,
      attributeKey,
      kind: "verify_nearby",
      reason: "never_reported",
      status: "pending",
      scheduledAt: 1,
    });
    return { userId, placeId, tokenId, logId };
  });
}

function stubPushResponse(body: unknown) {
  const fetchMock = vi.fn<
    (
      url: string,
      init: RequestInit,
    ) => Promise<{
      ok: boolean;
      json: () => Promise<unknown>;
    }>
  >(async () => ({ ok: true, json: async () => body }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentPayload(
  fetchMock: ReturnType<typeof stubPushResponse>,
  index = 0,
) {
  const call = fetchMock.mock.calls[index];
  if (!call) throw new Error(`fetch was not called ${index + 1} time(s)`);
  return JSON.parse(String(call[1].body));
}

describe("notifications.getDeliveryContext", () => {
  test("returns null if notificationLog row does not exist", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t);
    await t.run(async (ctx) => ctx.db.delete(logId));

    const result = await t.query(internal.notifications.getDeliveryContext, {
      logId,
    });
    expect(result).toBeNull();
  });

  test("returns fallback placeName when place has been deleted", async () => {
    const t = convexTest(schema, modules);
    const { logId, placeId } = await seedPendingClaim(t);
    await t.run(async (ctx) => ctx.db.delete(placeId));

    const result = await t.query(internal.notifications.getDeliveryContext, {
      logId,
    });
    expect(result).not.toBeNull();
    expect(result?.placeName).toBe("A nearby place");
  });

  test("filters out disabled push tokens from the delivery context", async () => {
    const t = convexTest(schema, modules);
    const { logId, userId, tokenId } = await seedPendingClaim(t);

    // Add a second token that is disabled
    await t.run(async (ctx) => {
      await ctx.db.insert("pushTokens", {
        userId,
        token: "ExponentPushToken[dead]",
        platform: "ios",
        updatedAt: 1,
        disabledAt: 500,
      });
    });

    const result = await t.query(internal.notifications.getDeliveryContext, {
      logId,
    });
    expect(result?.tokens).toHaveLength(1);
    expect(result?.tokens[0]?.id).toBe(tokenId);
  });
});

describe("notifications.recordResult", () => {
  test("updates status to sent and sets sentAt timestamp", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t);

    await t.mutation(internal.notifications.recordResult, {
      logId,
      status: "sent",
      disableTokenIds: [],
    });

    const log = await t.run(async (ctx) => ctx.db.get(logId));
    expect(log?.status).toBe("sent");
    expect(log?.sentAt).toBeGreaterThan(0);
  });

  test("updates status to failed, records errorCode, and disables tokens", async () => {
    const t = convexTest(schema, modules);
    const { logId, tokenId } = await seedPendingClaim(t);

    await t.mutation(internal.notifications.recordResult, {
      logId,
      status: "failed",
      errorCode: "DeviceNotRegistered",
      disableTokenIds: [tokenId],
    });

    const log = await t.run(async (ctx) => ctx.db.get(logId));
    expect(log?.status).toBe("failed");
    expect(log?.errorCode).toBe("DeviceNotRegistered");

    const token = await t.run(async (ctx) => ctx.db.get(tokenId));
    expect(token?.disabledAt).toBeGreaterThan(0);
  });
});

describe("notifications.deliver", () => {
  test("posts to Expo and marks the claim as sent", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t);
    const fetchMock = stubPushResponse({ data: [{ status: "ok", id: "x" }] });

    const result = await t.action(internal.notifications.deliver, { logId });

    expect(result.status).toBe("sent");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const log = await t.run(async (ctx) => ctx.db.get(logId));
    expect(log?.status).toBe("sent");
    expect(log?.sentAt).toBeGreaterThan(0);
  });

  test("sends the attribute-specific body when the claim names an attribute", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t, "mobility.step_free_entrance");
    const fetchMock = stubPushResponse({ data: [{ status: "ok", id: "x" }] });

    await t.action(internal.notifications.deliver, { logId });

    const body = sentPayload(fetchMock);
    expect(body.body).toContain("step-free entrance");
    expect(body.data.placeId).toBeDefined();
    expect(body.title).toBe("Central Library needs a check");
  });

  test("renders the stored age when the claim reason is staleness", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t);
    await t.run(async (ctx) =>
      ctx.db.patch(logId, { reason: "stale", ageDays: 210 }),
    );
    const fetchMock = stubPushResponse({ data: [{ status: "ok", id: "x" }] });

    await t.action(internal.notifications.deliver, { logId });

    const body = sentPayload(fetchMock);
    expect(body.body).toContain("7 months");
    expect(body.body).not.toContain("0 days");
  });

  test("records failure with the error code when Expo rejects the push", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t);
    stubPushResponse({
      data: [
        {
          status: "error",
          message: "not delivered",
          details: { error: "MessageRateExceeded" },
        },
      ],
    });

    const result = await t.action(internal.notifications.deliver, { logId });

    expect(result.status).toBe("failed");
    const log = await t.run(async (ctx) => ctx.db.get(logId));
    expect(log?.status).toBe("failed");
    expect(log?.errorCode).toBe("MessageRateExceeded");
  });

  test("disables the token when Expo reports DeviceNotRegistered", async () => {
    const t = convexTest(schema, modules);
    const { logId, tokenId } = await seedPendingClaim(t);
    stubPushResponse({
      data: [
        {
          status: "error",
          message: "gone",
          details: { error: "DeviceNotRegistered" },
        },
      ],
    });

    await t.action(internal.notifications.deliver, { logId });

    const token = await t.run(async (ctx) => ctx.db.get(tokenId));
    expect(token?.disabledAt).toBeGreaterThan(0);
  });

  test("fails without calling Expo when the user has no active token", async () => {
    const t = convexTest(schema, modules);
    const { logId, tokenId } = await seedPendingClaim(t);
    await t.run(async (ctx) => ctx.db.patch(tokenId, { disabledAt: 1 }));
    const fetchMock = stubPushResponse({ data: [] });

    const result = await t.action(internal.notifications.deliver, { logId });

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("NoActiveToken");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("does not resend a claim that is no longer pending", async () => {
    const t = convexTest(schema, modules);
    const { logId } = await seedPendingClaim(t);
    await t.run(async (ctx) => ctx.db.patch(logId, { status: "sent" }));
    const fetchMock = stubPushResponse({ data: [{ status: "ok", id: "x" }] });

    const result = await t.action(internal.notifications.deliver, { logId });

    expect(result.status).toBe("sent");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
