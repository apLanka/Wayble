import {
  MAX_CAPTION_LENGTH,
  MAX_SUMMARY_LENGTH,
} from "@packages/backend/convex/reportLimits";
import { UPLOAD_FAILED_PREFIX } from "./upload-photo";

/**
 * US-08 — turns a failed `submitReport` into copy a person can act on.
 *
 * The server's messages are written for developers and are asserted on by
 * `reports.test.ts`, so they must not change casually. Matching on them here
 * keeps the two in sync: if a server string is reworded, the corresponding
 * test in this file fails rather than the user silently seeing raw jargon.
 */

import { STRINGS } from "@/constants/strings";
export type ReportErrorKind =
  | "duplicate"
  | "unauthenticated"
  | "summaryTooLong"
  | "observationTime"
  | "photoCaption"
  | "photoRejected"
  | "uploadFailed"
  | "generic";

export function classifyReportError(error: unknown): ReportErrorKind {
  // A wrapped throw can be a bare `{ message }` rather than an `Error`, and
  // `String({...})` renders that as "[object Object]", which would silently
  // classify as generic. Prefer a string `.message` before falling back.
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error ?? "");
  if (message.includes("Duplicate report:")) return "duplicate";
  if (message.includes("Unauthenticated:")) return "unauthenticated";
  if (message.includes("Summary too long:")) return "summaryTooLong";
  if (message.includes("Observation time is outside the allowed range")) {
    return "observationTime";
  }
  // US-09. The wizard blocks a blank caption and clamps its length, so these
  // only fire if the two sides' limits drift apart.
  if (
    message.includes("Photo description is required") ||
    message.includes("Photo description too long:")
  ) {
    return "photoCaption";
  }
  // Every server reason a stored file is refused shares one kind, because the
  // user's remedy is the same for all of them: use a different photo. Size
  // and type are already checked on the device, so reaching these means the
  // two checks disagreed, not that the user did something fixable in place.
  if (
    message.includes("Photo too large:") ||
    message.includes("Unsupported photo type:") ||
    message.includes("Unknown photo upload") ||
    message.includes("Photo already attached to another report") ||
    message.includes("Too many photos:")
  ) {
    return "photoRejected";
  }
  if (message.includes(UPLOAD_FAILED_PREFIX)) return "uploadFailed";
  return "generic";
}

export function reportErrorMessage(kind: ReportErrorKind): string {
  switch (kind) {
    case "duplicate":
      return STRINGS.errors.report.duplicate;
    case "unauthenticated":
      return STRINGS.errors.report.unauthenticated;
    case "summaryTooLong":
      return STRINGS.errors.report.summaryTooLong(MAX_SUMMARY_LENGTH);
    case "observationTime":
      return STRINGS.errors.report.observationTime;
    case "photoCaption":
      return STRINGS.errors.report.photoCaption(MAX_CAPTION_LENGTH);
    case "photoRejected":
      return STRINGS.errors.report.photoRejected;
    case "uploadFailed":
      return STRINGS.errors.report.uploadFailed;
    case "generic":
      return STRINGS.errors.report.generic;
  }
}
