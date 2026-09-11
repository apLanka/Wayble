import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_CAPTION_LENGTH,
  MAX_PHOTO_BYTES,
} from "@packages/backend/convex/reportLimits";

/**
 * US-09 — the client-side check a photo passes before it is uploaded.
 *
 * This is for the user's benefit, not the server's: `submitReport` checks the
 * stored file against the same limits and is the real guard. Checking here
 * first means an oversize or wrong-type photo is caught while the user is
 * still on the photo step, not after an upload they then have to redo.
 *
 * Runs on the *compressed* file, since that is what gets uploaded. Free of
 * React and Expo so Vitest can cover it, like `report-draft.ts`.
 */

export type PhotoValidationError = "empty" | "tooLarge" | "unsupportedType";

export type PhotoValidationResult =
  { ok: true } | { ok: false; error: PhotoValidationError };

export function validatePhoto(photo: {
  fileSize: number;
  mimeType: string | undefined;
}): PhotoValidationResult {
  // A zero-byte or unreadable size is a broken file, not a small one, and the
  // server would store it happily; nothing useful renders from it.
  if (!Number.isFinite(photo.fileSize) || photo.fileSize <= 0) {
    return { ok: false, error: "empty" };
  }
  if (photo.fileSize > MAX_PHOTO_BYTES) {
    return { ok: false, error: "tooLarge" };
  }
  const allowed: readonly string[] = ALLOWED_PHOTO_MIME_TYPES;
  if (!photo.mimeType || !allowed.includes(photo.mimeType)) {
    return { ok: false, error: "unsupportedType" };
  }
  return { ok: true };
}

export function photoValidationMessage(error: PhotoValidationError): string {
  switch (error) {
    case "empty":
      return "That photo couldn't be read. Try a different one.";
    case "tooLarge":
      return `That photo is over ${MAX_PHOTO_BYTES / (1024 * 1024)} MB. Try a different one.`;
    case "unsupportedType":
      return "That file type isn't supported. Use a JPEG, PNG or WebP photo.";
  }
}

/**
 * The caption a new photo starts with, so the alt text is never empty even if
 * the user moves straight on. It names the place, which is the one thing known
 * about the photo; the caption field invites the user to say what it shows.
 *
 * Clamped to the caption limit: place names have no length cap of their own,
 * and a default the server would reject is worse than a shortened one.
 */
export function defaultCaption(placeName: string | undefined): string {
  const name = placeName?.trim();
  const caption = name ? `Photo taken at ${name}` : "Photo taken at this place";
  return caption.slice(0, MAX_CAPTION_LENGTH);
}
