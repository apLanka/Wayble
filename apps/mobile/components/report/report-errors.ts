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
  "duplicate" | "unauthenticated" | "summaryTooLong" | "generic";

export function classifyReportError(error: unknown): ReportErrorKind {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("Duplicate report:")) return "duplicate";
  if (message.includes("Unauthenticated:")) return "unauthenticated";
  if (message.includes("Summary too long:")) return "summaryTooLong";
  return "generic";
}

export function reportErrorMessage(kind: ReportErrorKind): string {
  switch (kind) {
    case "duplicate":
      return "You already reported on this place today. You can add another report tomorrow.";
    case "unauthenticated":
      return "Sign in to submit a report.";
    case "summaryTooLong":
      return `Keep your summary under ${MAX_SUMMARY_LENGTH} characters.`;
    case "generic":
      return "Couldn't submit your report. Check your connection and try again.";
  }
}
