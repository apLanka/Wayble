import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";

/**
 * US-08 — turns a failed `submitReport` into copy a person can act on.
 *
 * The server's messages are written for developers and are asserted on by
 * `reports.test.ts`, so they must not change casually. Matching on them here
 * keeps the two in sync: if a server string is reworded, the corresponding
 * test in this file fails rather than the user silently seeing raw jargon.
 */

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
      return "You already reported on this place today. You can add another report tomorrow.";
    case "unauthenticated":
      return "Sign in to submit a report.";
    case "summaryTooLong":
      return `Keep your summary to ${MAX_SUMMARY_LENGTH} characters or fewer.`;
    case "observationTime":
      return "Your device clock looks wrong. Turn on automatic date and time, then try again.";
    case "generic":
      return "We couldn't submit your report. Please try again.";
  }
}
