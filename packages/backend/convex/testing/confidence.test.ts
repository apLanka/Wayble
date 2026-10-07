import { describe, expect, test } from "vitest";
import {
  DEFAULT_CONFIDENCE_OPTS,
  computeAgeDecay,
  computeConfidence,
  describeAge,
  isStale,
  scoreToTier,
} from "../confidence";

const NOW = 1_700_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

describe("computeAgeDecay", () => {
  test("29 days is fresh", () => {
    expect(computeAgeDecay(29)).toBe(1.0);
  });
  test("30 days is fresh (< 30 boundary, not <=)", () => {
    expect(computeAgeDecay(30)).toBe(0.8);
  });
  test("90 days is still recent (<= 90)", () => {
    expect(computeAgeDecay(90)).toBe(0.8);
  });
  test("91 days is old", () => {
    expect(computeAgeDecay(91)).toBeLessThan(0.8);
  });
});

describe("scoreToTier", () => {
  const t = DEFAULT_CONFIDENCE_OPTS.tierThresholds;
  test("below low threshold is unverified", () => {
    expect(scoreToTier(t.low - 0.01)).toBe("unverified");
  });
  test("at low threshold is low", () => {
    expect(scoreToTier(t.low)).toBe("low");
  });
  test("at medium threshold is medium", () => {
    expect(scoreToTier(t.medium)).toBe("medium");
  });
  test("at high threshold is high", () => {
    expect(scoreToTier(t.high)).toBe("high");
  });
});

describe("isStale", () => {
  test("exactly 180 days is not yet stale", () => {
    expect(isStale(NOW - 180 * DAY_MS, NOW)).toBe(false);
  });
  test("181 days is stale", () => {
    expect(isStale(NOW - 181 * DAY_MS, NOW)).toBe(true);
  });
  test("null lastVerifiedAt is stale (never verified)", () => {
    expect(isStale(null, NOW)).toBe(true);
  });
});

describe("computeConfidence", () => {
  test("zero votes: score 0, tier unverified, no divide-by-zero", () => {
    const result = computeConfidence({
      agreeCount: 0,
      totalVotes: 0,
      distinctVerifiers: 0,
      reportAgeDays: 5,
      now: NOW,
      lastVerifiedAt: NOW - 5 * DAY_MS,
    });
    expect(result).toEqual({ score: 0, tier: "unverified", isStale: false });
  });

  test("all-disputed report: agreeCount 0, totalVotes > 0 -> low score per literal formula", () => {
    const result = computeConfidence({
      agreeCount: 0,
      totalVotes: 3,
      distinctVerifiers: 3,
      reportAgeDays: 5,
      now: NOW,
      lastVerifiedAt: NOW - 5 * DAY_MS,
    });
    expect(result.score).toBe(0);
    expect(result.tier).toBe("unverified");
  });

  test("all-agree, fresh report is high confidence and not stale", () => {
    const result = computeConfidence({
      agreeCount: 3,
      totalVotes: 3,
      distinctVerifiers: 3,
      reportAgeDays: 5,
      now: NOW,
      lastVerifiedAt: NOW - 5 * DAY_MS,
    });
    // (3/3) * 3 * 1.0 = 3
    expect(result).toEqual({ score: 3, tier: "high", isStale: false });
  });

  test("stale flag follows lastVerifiedAt independent of score", () => {
    const result = computeConfidence({
      agreeCount: 3,
      totalVotes: 3,
      distinctVerifiers: 3,
      reportAgeDays: 200,
      now: NOW,
      lastVerifiedAt: NOW - 200 * DAY_MS,
    });
    expect(result.isStale).toBe(true);
  });
});

describe("describeAge (relocated from notificationCopy.ts, unchanged logic)", () => {
  test("days for the first month", () => {
    expect(describeAge(5)).toBe("5 days");
  });
  test("whole months after that", () => {
    expect(describeAge(60)).toBe("2 months");
  });
  test("singular month", () => {
    expect(describeAge(31)).toBe("1 month");
  });
});
