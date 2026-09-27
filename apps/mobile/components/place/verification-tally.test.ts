import { afterEach, describe, expect, test, vi } from "vitest";

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

afterEach(() => {
  vi.restoreAllMocks();
});

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

  // A tally whose `myVerdict` disagrees with its counts cannot come from
  // `forReport` or `listForPlace`: both derive the counts and the verdict from
  // the same rows, so `myVerdict === "confirm"` always implies `confirmCount >=
  // 1`. It is a caller bug, not a user-visible condition. The clamp still holds
  // the line on the rendered number, and the warn is what stops the bug from
  // being silently absorbed.
  test("an inconsistent tally never yields a negative count, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const after = applyVerdictChange(
      { confirmCount: 0, disputeCount: 0, myVerdict: "confirm" },
      "dispute",
    );

    // The raw arithmetic here is 0 - 1 = -1. The clamp is the only thing
    // standing between that and a count on screen, so pin both halves: the
    // clamped value, and that the violation was reported rather than hidden.
    expect(after.confirmCount).toBe(0);
    expect(after.confirmCount).not.toBe(-1);
    expect(after.disputeCount).toBe(1);
    expect(after.myVerdict).toBe("dispute");

    expect(warn).toHaveBeenCalledTimes(1);
    const [message, detail] = warn.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(message).toMatch(/inconsistent/i);
    expect(detail).toMatchObject({
      next: "dispute",
      rawConfirmCount: -1,
      rawDisputeCount: 1,
    });
  });

  test("a consistent tally is silent", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    applyVerdictChange(none, "confirm");
    applyVerdictChange(
      { confirmCount: 1, disputeCount: 0, myVerdict: "confirm" },
      "dispute",
    );

    // The warn is only worth reading if it is rare: a guard that fires on the
    // ordinary path is noise, and noise is why real warnings get ignored.
    expect(warn).not.toHaveBeenCalled();
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
