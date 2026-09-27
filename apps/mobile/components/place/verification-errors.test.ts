import { describe, expect, test } from "vitest";

import { MAX_NOTE_LENGTH } from "@packages/backend/convex/reportLimits";

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

  test("the note cap is read from the shared limit, not hardcoded", () => {
    // The module interpolates `MAX_NOTE_LENGTH`, so the cap the user is told
    // and the cap the server enforces move together. Be clear about what this
    // assertion does and does not do: it pins the *coupling*, not the
    // provenance. Hardcoding today's `280` still passes, because a value check
    // cannot tell an imported constant from a typed literal. What it does
    // catch is the failure that actually occurs in practice — someone raises
    // the server limit and this copy goes on promising the old number to
    // someone whose note is about to be rejected.
    expect(verificationErrorMessage("noteTooLong")).toContain(
      String(MAX_NOTE_LENGTH),
    );
  });
});
