import { describe, expect, test } from "vitest";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_CAPTION_LENGTH,
  MAX_PHOTO_BYTES,
} from "@packages/backend/convex/reportLimits";
import {
  defaultCaption,
  photoValidationMessage,
  validatePhoto,
} from "./photo-validation";

describe("validatePhoto", () => {
  test("accepts each allowed type", () => {
    for (const mimeType of ALLOWED_PHOTO_MIME_TYPES) {
      expect(validatePhoto({ fileSize: 1024, mimeType })).toEqual({ ok: true });
    }
  });

  test("accepts a photo exactly at the size cap", () => {
    expect(
      validatePhoto({ fileSize: MAX_PHOTO_BYTES, mimeType: "image/jpeg" }),
    ).toEqual({ ok: true });
  });

  test("rejects a photo one byte over the size cap", () => {
    expect(
      validatePhoto({ fileSize: MAX_PHOTO_BYTES + 1, mimeType: "image/jpeg" }),
    ).toEqual({ ok: false, error: "tooLarge" });
  });

  test("rejects types the server would reject", () => {
    for (const mimeType of ["image/heic", "image/gif", "application/pdf"]) {
      expect(validatePhoto({ fileSize: 1024, mimeType })).toEqual({
        ok: false,
        error: "unsupportedType",
      });
    }
  });

  test("rejects a missing type", () => {
    expect(validatePhoto({ fileSize: 1024, mimeType: undefined })).toEqual({
      ok: false,
      error: "unsupportedType",
    });
  });

  test("rejects a zero-byte or unreadable size as empty", () => {
    for (const fileSize of [0, -1, Number.NaN]) {
      expect(validatePhoto({ fileSize, mimeType: "image/jpeg" })).toEqual({
        ok: false,
        error: "empty",
      });
    }
  });

  test("checks size before type, so an oversize HEIC reports its size", () => {
    // The size message is the more useful one: a re-encoded HEIC would still
    // be too big, whereas fixing the type alone would not get it through.
    expect(
      validatePhoto({ fileSize: MAX_PHOTO_BYTES + 1, mimeType: "image/heic" }),
    ).toEqual({ ok: false, error: "tooLarge" });
  });
});

describe("photoValidationMessage", () => {
  test("names the size limit in megabytes", () => {
    expect(photoValidationMessage("tooLarge")).toBe(
      "That photo is over 5 MB. Try a different one.",
    );
  });

  test("has copy for every error", () => {
    for (const error of ["empty", "tooLarge", "unsupportedType"] as const) {
      expect(photoValidationMessage(error).length).toBeGreaterThan(0);
    }
  });
});

describe("defaultCaption", () => {
  test("names the place", () => {
    expect(defaultCaption("Community Library")).toBe(
      "Photo taken at Community Library",
    );
  });

  test("falls back when the place name is missing or blank", () => {
    expect(defaultCaption(undefined)).toBe("Photo taken at this place");
    expect(defaultCaption("   ")).toBe("Photo taken at this place");
  });

  test("never exceeds the caption limit", () => {
    expect(defaultCaption("x".repeat(1000))).toHaveLength(MAX_CAPTION_LENGTH);
  });
});
