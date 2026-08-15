import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";

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
    case "generic":
      return STRINGS.errors.report.generic;
  }
}
