import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { describe, expect, test } from "vitest";
import {
  ACTIVITY_RATING_CONFIGS,
  filterActivityLogs,
  formatVisitDate,
  getLogCardAccessibilityLabel,
  validateActivityDraft,
  type ActivityLogItem,
} from "./activity-helpers";

const mockLogId = (id: string) => id as unknown as Id<"activityLogs">;
const mockUserId = (id: string) => id as unknown as Id<"users">;

describe("activity-helpers", () => {
  describe("validateActivityDraft", () => {
    test("rejects empty place name", () => {
      const res = validateActivityDraft({
        placeName: "   ",
        title: "Valid Title",
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/place or venue name/i);
    });

    test("rejects empty title", () => {
      const res = validateActivityDraft({
        placeName: "Valid Place",
        title: "   ",
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/headline or summary/i);
    });

    test("rejects title longer than 100 characters", () => {
      const res = validateActivityDraft({
        placeName: "Place",
        title: "a".repeat(101),
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/100 characters or fewer/i);
    });

    test("accepts valid draft", () => {
      const res = validateActivityDraft({
        placeName: "Central Station",
        title: "Tested elevator and ramp access",
      });
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe("filterActivityLogs", () => {
    const mockLogs: ActivityLogItem[] = [
      {
        _id: mockLogId("log1"),
        _creationTime: 1000,
        userId: mockUserId("u1"),
        placeName: "Place 1",
        title: "Title 1",
        accessibilityRating: "accessible",
        visitedAt: 1000,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        _id: mockLogId("log2"),
        _creationTime: 2000,
        userId: mockUserId("u1"),
        placeName: "Place 2",
        title: "Title 2",
        accessibilityRating: "partially_accessible",
        visitedAt: 2000,
        createdAt: 2000,
        updatedAt: 2000,
      },
      {
        _id: mockLogId("log3"),
        _creationTime: 3000,
        userId: mockUserId("u1"),
        placeName: "Place 3",
        title: "Title 3",
        accessibilityRating: "inaccessible",
        visitedAt: 3000,
        createdAt: 3000,
        updatedAt: 3000,
      },
    ];

    test("returns all logs for 'all' filter", () => {
      expect(filterActivityLogs(mockLogs, "all")).toHaveLength(3);
    });

    test("returns only accessible logs for 'accessible' filter", () => {
      const filtered = filterActivityLogs(mockLogs, "accessible");
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?._id).toBe("log1");
    });

    test("returns partially and inaccessible logs for 'needs_attention' filter", () => {
      const filtered = filterActivityLogs(mockLogs, "needs_attention");
      expect(filtered).toHaveLength(2);
      expect(filtered.map((l) => l._id)).toEqual(["log2", "log3"]);
    });
  });

  describe("formatVisitDate and getLogCardAccessibilityLabel", () => {
    test("formats valid date string", () => {
      const dateStr = formatVisitDate(1700000000000);
      expect(typeof dateStr).toBe("string");
      expect(dateStr.length).toBeGreaterThan(0);
    });

    test("generates screen-reader label with rating and place details", () => {
      const log: ActivityLogItem = {
        _id: mockLogId("log1"),
        _creationTime: 1000,
        userId: mockUserId("u1"),
        placeName: "Public Library",
        title: "Visited ground floor entrance",
        notes: "Wide automatic sliding doors.",
        accessibilityRating: "accessible",
        visitedAt: 1000,
        createdAt: 1000,
        updatedAt: 1000,
      };

      const label = getLogCardAccessibilityLabel(log, "Nov 15, 2023");
      expect(label).toContain(
        "Visited ground floor entrance at Public Library",
      );
      expect(label).toContain("Rated Fully Accessible");
      expect(label).toContain("Visited Nov 15, 2023");
      expect(label).toContain("Notes: Wide automatic sliding doors");
    });
  });

  describe("ACTIVITY_RATING_CONFIGS", () => {
    test("has valid configuration for all ratings", () => {
      expect(ACTIVITY_RATING_CONFIGS.accessible.colorKey).toBe("success");
      expect(ACTIVITY_RATING_CONFIGS.partially_accessible.colorKey).toBe(
        "warning",
      );
      expect(ACTIVITY_RATING_CONFIGS.inaccessible.colorKey).toBe("danger");
    });
  });
});
