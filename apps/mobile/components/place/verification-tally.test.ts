import { describe, expect, test } from "vitest";

import {
  applyVerdictChange,
  isOwnReport,
  tallySummary,
  type VerificationTally,
} from "./verification-tally";

const none: VerificationTally = {
  confirmCount: 0,
  disputeCount: 0,
  myVerdict: null,
};

describe("tallySummary", () => {
  test("handles the singular case", () => {
    expect(tallySummary({ ...none, confirmCount: 1 })).toBe("1 confirmed");
  });

  test("pluralises both sides", () => {
    expect(
      tallySummary({ confirmCount: 3, disputeCount: 2, myVerdict: null }),
    ).toBe("3 confirmed · 2 disputed");
  });

  test("says so when nobody has voted", () => {
    expect(tallySummary(none)).toBe("No verifications yet");
  });

  test("handles a lone dispute", () => {
    expect(tallySummary({ ...none, disputeCount: 1 })).toBe("1 disputed");
  });
});

describe("applyVerdictChange", () => {
  test("a first confirm adds one confirm", () => {
    expect(applyVerdictChange(none, "confirm")).toEqual({
      confirmCount: 1,
      disputeCount: 0,
      myVerdict: "confirm",
    });
  });

  test("switching from confirm to dispute moves the count across", () => {
    const after = applyVerdictChange(
      { confirmCount: 1, disputeCount: 0, myVerdict: "confirm" },
      "dispute",
    );
    expect(after).toEqual({
      confirmCount: 0,
      disputeCount: 1,
      myVerdict: "dispute",
    });
  });

  test("re-confirming does not inflate the tally", () => {
    const after = applyVerdictChange(
      { confirmCount: 2, disputeCount: 1, myVerdict: "confirm" },
      "confirm",
    );
    expect(after.confirmCount).toBe(2);
    expect(after.disputeCount).toBe(1);
    expect(after.myVerdict).toBe("confirm");
  });

  test("other users' votes are left alone", () => {
    const after = applyVerdictChange(
      { confirmCount: 5, disputeCount: 4, myVerdict: "dispute" },
      "confirm",
    );
    expect(after.confirmCount).toBe(6);
    expect(after.disputeCount).toBe(3);
  });

  test("does not mutate its input", () => {
    const input = { ...none };
    applyVerdictChange(input, "confirm");
    expect(input).toEqual(none);
  });
});

describe("isOwnReport", () => {
  test("is true only when both ids match", () => {
    expect(isOwnReport("u1", "u1")).toBe(true);
  });

  test("is false for a different author", () => {
    expect(isOwnReport("u1", "u2")).toBe(false);
  });

  test("is false when signed out", () => {
    expect(isOwnReport("u1", undefined)).toBe(false);
  });
});
