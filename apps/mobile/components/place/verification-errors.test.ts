import { describe, expect, test } from "vitest";

import {
  classifyVerificationError,
  verificationErrorMessage,
} from "./verification-errors";

describe("classifyVerificationError", () => {
  test("maps each server message to its kind", () => {
    expect(
      classifyVerificationError(
        new Error("Unauthenticated: must be logged in to verify a report"),
      ),
    ).toBe("unauthenticated");
    expect(
      classifyVerificationError(new Error("Cannot verify your own report")),
    ).toBe("selfVerification");
    expect(classifyVerificationError(new Error("Unknown report: abc"))).toBe(
      "unknownReport",
    );
    expect(
      classifyVerificationError(new Error("Note too long: 300 characters")),
    ).toBe("noteTooLong");
  });

  test("falls back to generic for anything unrecognised", () => {
    expect(classifyVerificationError(new Error("boom"))).toBe("generic");
    expect(classifyVerificationError(undefined)).toBe("generic");
  });

  test("reads a bare message object, not [object Object]", () => {
    expect(
      classifyVerificationError({ message: "Cannot verify your own report" }),
    ).toBe("selfVerification");
  });
});

describe("verificationErrorMessage", () => {
  test("every kind produces non-empty copy", () => {
    const kinds = [
      "unauthenticated",
      "selfVerification",
      "unknownReport",
      "noteTooLong",
      "generic",
    ] as const;
    for (const kind of kinds) {
      expect(verificationErrorMessage(kind).length).toBeGreaterThan(0);
    }
  });

  test("the self-verification message names the reason", () => {
    expect(verificationErrorMessage("selfVerification")).toBe(
      "You can't verify your own report.",
    );
  });
});
