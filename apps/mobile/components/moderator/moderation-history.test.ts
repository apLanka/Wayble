import { describe, expect, test } from "vitest";

import { describeHistoryItem, normalizeNote } from "./moderation-history";

describe("normalizeNote", () => {
  test("trims, and treats blank as no note", () => {
    expect(normalizeNote("  Spam  ")).toBe("Spam");
    expect(normalizeNote("   ")).toBeUndefined();
    expect(normalizeNote("")).toBeUndefined();
  });
});

describe("describeHistoryItem", () => {
  const base = {
    outcome: "removed" as const,
    placeName: "Library",
    flagCount: 1,
    resolvedByName: "Sam",
    when: "2 h ago",
  };

  test("describes a removal with a note", () => {
    expect(describeHistoryItem({ ...base, resolutionNote: "Spam" })).toBe(
      "Removed report at Library, 1 flag, by Sam, 2 h ago. Note: Spam.",
    );
  });

  test("pluralises flags and omits a missing note", () => {
    expect(
      describeHistoryItem({ ...base, outcome: "dismissed", flagCount: 3 }),
    ).toBe("Dismissed report at Library, 3 flags, by Sam, 2 h ago.");
  });
});
