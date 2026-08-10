import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { buildVerifyNearbyPush } from "./notificationCopy";
import { notificationStatusValidator } from "./schema";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Everything `deliver` needs, read in one transaction. */
export const getDeliveryContext = internalQuery({
  args: { logId: v.id("notificationLog") },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);
    if (!log) return null;

    const place = await ctx.db.get(log.placeId);
    const tokens = (
      await ctx.db
        .query("pushTokens")
        .withIndex("by_user", (q) => q.eq("userId", log.userId))
        .collect()
    ).filter((t) => t.disabledAt === undefined);

    return {
      log,
      placeName: place?.name ?? "A nearby place",
      tokens: tokens.map((t) => ({ id: t._id, token: t.token })),
    };
  },
});

/** Writes the outcome of a delivery attempt and disables any dead tokens. */
export const recordResult = internalMutation({
  args: {
    logId: v.id("notificationLog"),
    status: notificationStatusValidator,
    errorCode: v.optional(v.string()),
    disableTokenIds: v.array(v.id("pushTokens")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, {
      status: args.status,
      ...(args.status === "sent" && { sentAt: Date.now() }),
      ...(args.errorCode !== undefined && { errorCode: args.errorCode }),
    });

    for (const tokenId of args.disableTokenIds) {
      await ctx.db.patch(tokenId, { disabledAt: Date.now() });
    }
  },
});

/**
 * Sends one claimed notification through Expo's push service.
 *
 * Scheduled per user rather than looped over inside the sweep, so a single
 * dead token cannot fail the whole batch. Scheduled actions run at most once
 * and are not retried, which is why the claim row's `pending` status is the
 * signal that a send was lost — US-21b's retry pass reads it.
 */
export const deliver = internalAction({
  args: { logId: v.id("notificationLog") },
  handler: async (
    ctx,
    args,
  ): Promise<{ status: "sent" | "failed"; errorCode?: string }> => {
    const context = await ctx.runQuery(
      internal.notifications.getDeliveryContext,
      { logId: args.logId },
    );

    if (!context) {
      return { status: "failed", errorCode: "LogNotFound" };
    }

    // Guard against a double-schedule: only a pending claim may be sent.
    if (context.log.status !== "pending") {
      return { status: context.log.status === "sent" ? "sent" : "failed" };
    }

    if (context.tokens.length === 0) {
      await ctx.runMutation(internal.notifications.recordResult, {
        logId: args.logId,
        status: "failed",
        errorCode: "NoActiveToken",
        disableTokenIds: [],
      });
      return { status: "failed", errorCode: "NoActiveToken" };
    }

    const { title, body } = buildVerifyNearbyPush({
      placeName: context.placeName,
      need: {
        needed: true,
        reason: context.log.reason,
        ageDays: context.log.ageDays ?? null,
      },
      attributeKey: context.log.attributeKey,
    });

    const messages = context.tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: { placeId: context.log.placeId, kind: context.log.kind },
      channelId: "verify-nearby",
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    });

    const payload = (await response.json()) as {
      data?:
        | { status: string; details?: { error?: string } }
        | { status: string; details?: { error?: string } }[];
    };
    const tickets = Array.isArray(payload.data)
      ? payload.data
      : payload.data
        ? [payload.data]
        : [];

    const disableTokenIds: Id<"pushTokens">[] = [];
    let errorCode: string | undefined;

    tickets.forEach((ticket, index) => {
      if (ticket.status === "ok") return;
      errorCode ??= ticket.details?.error ?? "UnknownPushError";
      if (ticket.details?.error === "DeviceNotRegistered") {
        const token = context.tokens[index];
        if (token) disableTokenIds.push(token.id);
      }
    });

    const status = errorCode === undefined ? "sent" : "failed";
    await ctx.runMutation(internal.notifications.recordResult, {
      logId: args.logId,
      status,
      errorCode,
      disableTokenIds,
    });

    return { status, ...(errorCode !== undefined && { errorCode }) };
  },
});
