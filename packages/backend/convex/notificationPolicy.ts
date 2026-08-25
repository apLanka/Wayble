/**
 * Whether a user may receive a nearby-verification notification right now.
 *
 * Pure and `ctx`-free. Every threshold is an argument so tests can vary them
 * and so no caller silently inherits a hidden default.
 *
 * `claimsToday` and `placeLastClaimedAt` count *claims* — `notificationLog`
 * rows — not successful sends. Counting sends would let a second claim slip
 * through while the first was still `pending`.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type PolicyOpts = {
  maxPerDay: number;
  placeCooldownDays: number;
  /** Quiet hours begin at this local hour, inclusive. */
  quietFromHour: number;
  /** Quiet hours end at this local hour, exclusive. */
  quietUntilHour: number;
};

export const DEFAULT_POLICY_OPTS: PolicyOpts = {
  maxPerDay: 1,
  placeCooldownDays: 14,
  quietFromHour: 21,
  quietUntilHour: 8,
};

export type PolicyInput = {
  now: number;
  timeZoneOffsetMinutes: number;
  claimsToday: number;
  placeLastClaimedAt: number | null;
  opts: PolicyOpts;
};

export type PolicyVerdict =
  | { allowed: true }
  | { allowed: false; reason: "daily_cap" | "place_cooldown" | "quiet_hours" };

export function shouldNotify(input: PolicyInput): PolicyVerdict {
  const { now, timeZoneOffsetMinutes, claimsToday, placeLastClaimedAt, opts } =
    input;

  if (claimsToday >= opts.maxPerDay) {
    return { allowed: false, reason: "daily_cap" };
  }

  if (
    placeLastClaimedAt !== null &&
    now - placeLastClaimedAt < opts.placeCooldownDays * DAY_MS
  ) {
    return { allowed: false, reason: "place_cooldown" };
  }

  if (isQuietHour(localHour(now, timeZoneOffsetMinutes), opts)) {
    return { allowed: false, reason: "quiet_hours" };
  }

  return { allowed: true };
}

/** Local hour 0-23 for a UTC instant and a UTC offset in minutes. */
function localHour(now: number, timeZoneOffsetMinutes: number): number {
  const shifted = now + timeZoneOffsetMinutes * MINUTE_MS;
  return Math.floor(shifted / (60 * MINUTE_MS)) % 24;
}

/** Quiet window wraps midnight, so this is a union, not a range. */
function isQuietHour(hour: number, opts: PolicyOpts): boolean {
  return hour >= opts.quietFromHour || hour < opts.quietUntilHour;
}
