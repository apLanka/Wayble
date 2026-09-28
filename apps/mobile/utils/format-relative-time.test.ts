import { describe, expect, test } from "vitest";

import { formatRelativeTime } from "./format-relative-time";

// `now` is passed explicitly everywhere so the assertions cannot drift with
// the wall clock.
const NOW = new Date("2026-09-27T12:00:00Z").getTime();
const at = (iso: string) => new Date(iso).getTime();

describe("formatRelativeTime", () => {
  test("says 'just now' inside the first minute", () => {
    expect(formatRelativeTime(NOW - 30_000, NOW)).toBe("just now");
  });

  test("counts minutes up to an hour", () => {
    expect(formatRelativeTime(NOW - 5 * 60_000, NOW)).toBe("5 min ago");
    expect(formatRelativeTime(NOW - 59 * 60_000, NOW)).toBe("59 min ago");
  });

  test("counts hours up to a day", () => {
    expect(formatRelativeTime(NOW - 3 * 3_600_000, NOW)).toBe("3 h ago");
    expect(formatRelativeTime(NOW - 23 * 3_600_000, NOW)).toBe("23 h ago");
  });

  test("counts days up to a week", () => {
    expect(formatRelativeTime(NOW - 2 * 86_400_000, NOW)).toBe("2 d ago");
    expect(formatRelativeTime(NOW - 6 * 86_400_000, NOW)).toBe("6 d ago");
  });

  test("counts weeks up to a month", () => {
    expect(formatRelativeTime(NOW - 14 * 86_400_000, NOW)).toBe("2 w ago");
  });

  test("the week band still reads as weeks at its top", () => {
    // 29 days is the last day inside the month cutoff, and 29 / 7 floors to 4.
    // Without this the week band is pinned only in its middle, so a change
    // that widened or narrowed it would pass every other case here.
    expect(formatRelativeTime(NOW - 29 * 86_400_000, NOW)).toBe("4 w ago");
  });

  test("an exact boundary belongs to the band it opens, not the one it closes", () => {
    // Each of these sits precisely on a `<` decision. Flipping any one of them
    // to `<=` pushes the boundary down into the lower band while leaving every
    // mid-band case above still passing, so each transition needs its own
    // exact-boundary case to be pinned.
    expect(formatRelativeTime(NOW - 60_000, NOW)).toBe("1 min ago");
    expect(formatRelativeTime(NOW - 3_600_000, NOW)).toBe("1 h ago");
    expect(formatRelativeTime(NOW - 86_400_000, NOW)).toBe("1 d ago");
    expect(formatRelativeTime(NOW - 7 * 86_400_000, NOW)).toBe("1 w ago");
  });

  test("a month exactly has already fallen through to the absolute date", () => {
    // The last boundary. Matched on the absence of "ago" rather than on a
    // formatted date, since `toLocaleDateString` is locale-dependent and the
    // case above it covers the shape.
    expect(formatRelativeTime(NOW - 30 * 86_400_000, NOW)).not.toMatch(/ago/);
  });

  test("falls back to an absolute date beyond a month", () => {
    const old = at("2026-01-15T09:00:00Z");
    const result = formatRelativeTime(old, NOW);
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });
});
