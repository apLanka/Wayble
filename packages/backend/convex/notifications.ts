import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import type { AccessibilityAttributeKey } from "./accessibility";
import { buildVerifyNearbyPush } from "./notificationCopy";
import { DEFAULT_POLICY_OPTS, shouldNotify } from "./notificationPolicy";
import { geo } from "./places";
import { notificationStatusValidator } from "./schema";
import {
  attributeNeedsVerification,
  needsVerification,
  type VerificationNeed,
  type VerificationNeedInput,
} from "./verificationNeed";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** A report older than this is treated as needing re-verification. */
const STALE_AFTER_DAYS = 180;
/** A location we have not refreshed in a week is too old to act on. */
const LOCATION_MAX_AGE_MS = 7 * DAY_MS;
/** Users examined per sweep. Bounded so the mutation never scans the table. */
const SWEEP_USER_LIMIT = 100;
/** Nearby places examined per user before giving up on finding a candidate. */
const NEAREST_LIMIT = 20;
/** Sends are spread across this window so a batch does not arrive at once. */
const JITTER_WINDOW_MINUTES = 16;
/** A claim still pending after this long probably lost its action. */
const STALLED_AFTER_MS = 10 * MINUTE_MS;
/** Past this, stop retrying and record the failure. */
const GIVE_UP_AFTER_MS = DAY_MS;
/** Radius used when a user somehow has none stored. */
const DEFAULT_RADIUS_METERS = 2000;

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

/**
 * Finds users who should be asked to verify a nearby place and claims a
 * notification for each.
 *
 * A mutation, not an action, and that is the whole point: scheduled mutations
 * run exactly once and this one writes its `pending` claim in the same
 * transaction that decides to send. Two overlapping sweeps therefore cannot
 * both notify the same user, which a "read the log, then send" action could.
 * The actual HTTP send is scheduled out to `deliver`, one short action per
 * user, so a single dead token cannot fail the batch.
 *
 * `now` is injectable so the time-dependent rules can be tested without
 * waiting for the clock.
 */
export const sweep = internalMutation({
  args: { now: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();

    const users = await ctx.db
      .query("users")
      .withIndex("by_verify_nearby_enabled", (q) =>
        q.eq("verifyNearbyEnabled", true),
      )
      .take(args.limit ?? SWEEP_USER_LIMIT);

    let claimed = 0;

    for (const [index, user] of users.entries()) {
      const location = user.lastKnownLocation;
      if (!location) continue;
      if (now - location.updatedAt > LOCATION_MAX_AGE_MS) continue;

      const claimsToday = (
        await ctx.db
          .query("notificationLog")
          .withIndex("by_user_and_scheduledAt", (q) =>
            q.eq("userId", user._id).gt("scheduledAt", now - DAY_MS),
          )
          .collect()
      ).length;

      // Check the user-level gates before doing any geospatial work, so a
      // capped or sleeping user costs one indexed read rather than a search.
      const gate = shouldNotify({
        now,
        timeZoneOffsetMinutes: location.timeZoneOffsetMinutes,
        claimsToday,
        placeLastClaimedAt: null,
        opts: DEFAULT_POLICY_OPTS,
      });
      if (!gate.allowed) continue;

      const candidate = await findCandidate(ctx, user, now, claimsToday);
      if (!candidate) continue;

      const logId = await ctx.db.insert("notificationLog", {
        userId: user._id,
        placeId: candidate.placeId,
        ...(candidate.attributeKey && { attributeKey: candidate.attributeKey }),
        kind: "verify_nearby",
        reason: candidate.need.reason,
        ...(candidate.need.ageDays !== null && {
          ageDays: candidate.need.ageDays,
        }),
        status: "pending",
        scheduledAt: now,
      });

      await ctx.scheduler.runAfter(
        jitterFor(index),
        internal.notifications.deliver,
        { logId },
      );
      claimed++;
    }

    return { usersConsidered: users.length, claimed };
  },
});

/**
 * Spreads sends across a window so a batch does not land simultaneously.
 * Derived from position in the batch rather than randomised, because Convex
 * functions must be deterministic to stay replayable.
 */
function jitterFor(index: number): number {
  return (index % JITTER_WINDOW_MINUTES) * MINUTE_MS;
}

type Candidate = {
  placeId: Id<"places">;
  need: Extract<VerificationNeed, { needed: true }>;
  attributeKey?: AccessibilityAttributeKey;
};

/**
 * The nearest place worth asking this user about, or null.
 *
 * A user who has set accessibility needs is only told about those specific
 * attributes — being pinged about a handrail you never asked about is how a
 * feature like this gets muted. Users with no profile fall back to the
 * whole-place rule so the feature still works for them.
 */
async function findCandidate(
  ctx: MutationCtx,
  user: Doc<"users">,
  now: number,
  claimsToday: number,
): Promise<Candidate | null> {
  const location = user.lastKnownLocation;
  if (!location) return null;

  const hits = await geo.nearest(ctx, {
    point: { latitude: location.latitude, longitude: location.longitude },
    limit: NEAREST_LIMIT,
    maxDistance: user.verifyNearbyRadiusMeters ?? DEFAULT_RADIUS_METERS,
  });

  for (const hit of hits) {
    let place: Doc<"places"> | null = null;
    try {
      place = await ctx.db.get(hit.key);
    } catch {
      // A stale index entry pointing at a deleted place; skip it.
      continue;
    }
    if (!place) continue;

    const priorClaims = await ctx.db
      .query("notificationLog")
      .withIndex("by_user_and_place", (q) =>
        q.eq("userId", user._id).eq("placeId", place._id),
      )
      .collect();
    const placeLastClaimedAt = priorClaims.length
      ? Math.max(...priorClaims.map((c) => c.scheduledAt))
      : null;

    const verdict = shouldNotify({
      now,
      timeZoneOffsetMinutes: location.timeZoneOffsetMinutes,
      claimsToday,
      placeLastClaimedAt,
      opts: DEFAULT_POLICY_OPTS,
    });
    if (!verdict.allowed) continue;

    const reports: VerificationNeedInput[] = await ctx.db
      .query("reports")
      .withIndex("by_place", (q) => q.eq("placeId", place._id))
      .collect();

    const match = matchNeed(reports, user.accessibilityNeeds, now);
    if (match) return { placeId: place._id, ...match };
  }

  return null;
}

/** Applies the needs filter, falling back to the whole place when unset. */
function matchNeed(
  reports: VerificationNeedInput[],
  needs: AccessibilityAttributeKey[] | undefined,
  now: number,
): Omit<Candidate, "placeId"> | null {
  const opts = { staleAfterDays: STALE_AFTER_DAYS };

  if (needs && needs.length > 0) {
    for (const key of needs) {
      const need = attributeNeedsVerification(reports, key, now, opts);
      if (need.needed) return { need, attributeKey: key };
    }
    // Their stated needs are all covered here — say nothing rather than
    // fall back to a generic nudge they did not ask for.
    return null;
  }

  const need = needsVerification(reports, now, opts);
  return need.needed ? { need } : null;
}

/**
 * Re-schedules deliveries that never reported back, and abandons ones too old
 * to be worth retrying.
 *
 * Necessary because scheduled actions run *at most* once and are not retried:
 * a transient failure inside `deliver` leaves its claim stuck at `pending`
 * forever. The `by_status_and_scheduledAt` index makes finding them cheap.
 */
export const retryStalledDeliveries = internalMutation({
  args: { now: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();

    const stalled = await ctx.db
      .query("notificationLog")
      .withIndex("by_status_and_scheduledAt", (q) =>
        q.eq("status", "pending").lt("scheduledAt", now - STALLED_AFTER_MS),
      )
      .take(args.limit ?? SWEEP_USER_LIMIT);

    let retried = 0;
    let abandoned = 0;

    for (const claim of stalled) {
      if (now - claim.scheduledAt > GIVE_UP_AFTER_MS) {
        await ctx.db.patch(claim._id, {
          status: "failed",
          errorCode: "DeliveryStalled",
        });
        abandoned++;
        continue;
      }
      await ctx.scheduler.runAfter(0, internal.notifications.deliver, {
        logId: claim._id,
      });
      retried++;
    }

    return { retried, abandoned };
  },
});
