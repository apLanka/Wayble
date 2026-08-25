import { describe, expect, test } from "vitest";
import {
  attributeNeedsVerification,
  needsVerification,
  type VerificationNeedInput,
} from "./verificationNeed";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;
const OPTS = { staleAfterDays: 180 };

function report(
  daysAgo: number,
  keys: string[] = ["mobility.step_free_entrance"],
  status = "active",
): VerificationNeedInput {
  return {
    observedAt: NOW - daysAgo * DAY,
    status,
    attributes: keys.map((key) => ({ key: key as never })),
  };
}

describe("needsVerification", () => {
  test("a place with no reports has never been reported", () => {
    expect(needsVerification([], NOW, OPTS)).toEqual({
      needed: true,
      reason: "never_reported",
      ageDays: null,
    });
  });

  test("a recently reported place does not need verification", () => {
    expect(needsVerification([report(10)], NOW, OPTS)).toEqual({
      needed: false,
    });
  });

  test("a place past the staleness threshold is stale", () => {
    expect(needsVerification([report(200)], NOW, OPTS)).toEqual({
      needed: true,
      reason: "stale",
      ageDays: 200,
    });
  });

  test("exactly at the threshold is not yet stale", () => {
    expect(needsVerification([report(180)], NOW, OPTS)).toEqual({
      needed: false,
    });
  });

  test("the newest report decides, not the oldest", () => {
    expect(needsVerification([report(300), report(5)], NOW, OPTS)).toEqual({
      needed: false,
    });
  });

  test("non-active reports are ignored entirely", () => {
    const reports = [
      report(5, ["mobility.elevator"], "superseded"),
      report(5, ["mobility.elevator"], "removed"),
    ];
    expect(needsVerification(reports, NOW, OPTS)).toEqual({
      needed: true,
      reason: "never_reported",
      ageDays: null,
    });
  });
});

describe("attributeNeedsVerification", () => {
  test("an attribute absent from every report has never been reported", () => {
    const reports = [report(5, ["mobility.elevator"])];
    expect(
      attributeNeedsVerification(reports, "vision.braille_signage", NOW, OPTS),
    ).toEqual({ needed: true, reason: "never_reported", ageDays: null });
  });

  test("a freshly reported attribute does not need verification", () => {
    const reports = [report(5, ["mobility.elevator"])];
    expect(
      attributeNeedsVerification(reports, "mobility.elevator", NOW, OPTS),
    ).toEqual({ needed: false });
  });

  test("an attribute is judged on its own newest report, not the place's", () => {
    const reports = [
      report(2, ["mobility.elevator"]),
      report(400, ["vision.braille_signage"]),
    ];
    expect(
      attributeNeedsVerification(reports, "vision.braille_signage", NOW, OPTS),
    ).toEqual({ needed: true, reason: "stale", ageDays: 400 });
  });
});
