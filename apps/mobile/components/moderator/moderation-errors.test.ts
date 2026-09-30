import { describe, expect, test } from "vitest";

import {
  classifyModerationError,
  moderationErrorMessage,
} from "./moderation-errors";

describe("classifyModerationError", () => {
  test.each([
    ["Unauthenticated: must be logged in", "unauthenticated"],
    ["Forbidden: moderator role required", "forbidden"],
    ["Unknown report: abc", "unknownReport"],
    ["No open flags on this report", "alreadyHandled"],
    ["Report already removed", "alreadyRemoved"],
    ["Note too long: 300 characters, maximum 280", "noteTooLong"],
    ["boom", "generic"],
  ])("maps %s to %s", (message, kind) => {
    expect(classifyModerationError(new Error(message))).toBe(kind);
  });

  test("handles bare { message } objects and undefined", () => {
    expect(classifyModerationError({ message: "Forbidden: x" })).toBe(
      "forbidden",
    );
    expect(classifyModerationError(undefined)).toBe("generic");
  });
});

describe("moderationErrorMessage", () => {
  test("has copy for every kind", () => {
    for (const kind of [
      "unauthenticated",
      "forbidden",
      "unknownReport",
      "alreadyHandled",
      "alreadyRemoved",
      "noteTooLong",
      "generic",
    ] as const) {
      expect(moderationErrorMessage(kind)).not.toBe("");
    }
  });

  test("the generic copy names the action that failed", () => {
    expect(moderationErrorMessage("generic")).toContain("dismiss");
    expect(moderationErrorMessage("generic", "remove")).toContain("remove");
  });
});
