import { describe, expect, test } from "vitest";
import {
  DEFAULT_POLICY_OPTS,
  shouldNotify,
  type PolicyInput,
} from "./notificationPolicy";

const DAY = 24 * 60 * 60 * 1000;
/** 2023-11-14T22:13:20Z — 22:13 UTC, so 14:13 local at UTC-8. */
const NOW = 1_700_000_000_000;

function input(over: Partial<PolicyInput> = {}): PolicyInput {
  return {
    now: NOW,
    timeZoneOffsetMinutes: -480, // UTC-8 → 14:13 local, inside waking hours
    claimsToday: 0,
    placeLastClaimedAt: null,
    opts: DEFAULT_POLICY_OPTS,
    ...over,
  };
}

describe("shouldNotify", () => {
  test("allows a first notification during waking hours", () => {
    expect(shouldNotify(input())).toEqual({ allowed: true });
  });

  test("blocks once the daily cap is reached", () => {
    expect(shouldNotify(input({ claimsToday: 1 }))).toEqual({
      allowed: false,
      reason: "daily_cap",
    });
  });

  test("blocks a place still inside its cooldown", () => {
    expect(shouldNotify(input({ placeLastClaimedAt: NOW - 3 * DAY }))).toEqual({
      allowed: false,
      reason: "place_cooldown",
    });
  });

  test("allows a place once its cooldown has elapsed", () => {
    expect(shouldNotify(input({ placeLastClaimedAt: NOW - 15 * DAY }))).toEqual(
      {
        allowed: true,
      },
    );
  });

  test("blocks inside quiet hours before midnight", () => {
    // UTC itself → 22:13 local, inside the evening quiet window
    expect(shouldNotify(input({ timeZoneOffsetMinutes: 0 }))).toEqual({
      allowed: false,
      reason: "quiet_hours",
    });
  });

  test("blocks inside quiet hours after midnight", () => {
    // UTC+7 → 05:13 local
    expect(shouldNotify(input({ timeZoneOffsetMinutes: 420 }))).toEqual({
      allowed: false,
      reason: "quiet_hours",
    });
  });

  test("allows just after quiet hours end", () => {
    // UTC+10 → 08:13 local
    expect(shouldNotify(input({ timeZoneOffsetMinutes: 600 }))).toEqual({
      allowed: true,
    });
  });

  test("handles negative offsets without wrapping into quiet hours", () => {
    // UTC-3 → 19:13 local
    expect(shouldNotify(input({ timeZoneOffsetMinutes: -180 }))).toEqual({
      allowed: true,
    });
  });

  test("the daily cap is checked before quiet hours", () => {
    expect(
      shouldNotify(input({ claimsToday: 5, timeZoneOffsetMinutes: 420 })),
    ).toEqual({ allowed: false, reason: "daily_cap" });
  });
});
