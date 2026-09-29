import { MAX_NOTE_LENGTH } from "@packages/backend/convex/reportLimits";

/**
 * US-13 — turns a failed `flagReport` into copy a person can act on.
 *
 * The server's messages are asserted by `flags.test.ts`, so matching on them
 * here keeps the two in sync. Mirrors `verification-errors.ts`.
 */

export type FlagErrorKind =
  | "unauthenticated"
  | "unknownReport"
  | "selfFlag"
  | "alreadyFlagged"
  | "detailsTooLong"
  | "generic";

export function classifyFlagError(error: unknown): FlagErrorKind {
  // A wrapped throw can be a bare `{ message }`, and `String({...})` renders
  // that as "[object Object]", which would classify as generic. Prefer a
  // string `.message` before falling back.
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error ?? "");

  if (message.includes("Unauthenticated:")) return "unauthenticated";
  if (message.includes("Unknown report:")) return "unknownReport";
  if (message.includes("Cannot flag your own report")) return "selfFlag";
  if (message.includes("You already flagged this report")) {
    return "alreadyFlagged";
  }
  if (message.includes("Details too long:")) return "detailsTooLong";
  return "generic";
}

export function flagErrorMessage(kind: FlagErrorKind): string {
  switch (kind) {
    case "unauthenticated":
      return "Sign in to flag a report.";
    case "unknownReport":
      return "This report no longer exists.";
    case "selfFlag":
      return "You can't flag your own report.";
    case "alreadyFlagged":
      return "You already flagged this report.";
    case "detailsTooLong":
      return `Keep your details to ${MAX_NOTE_LENGTH} characters or fewer.`;
    case "generic":
      return "We couldn't flag this report. Please try again.";
  }
}
