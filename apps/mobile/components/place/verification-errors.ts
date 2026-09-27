import { MAX_NOTE_LENGTH } from "@packages/backend/convex/reportLimits";

/**
 * US-10 — turns a failed `verifyReport` into copy a person can act on.
 *
 * The server's messages are asserted by `verifications.test.ts`, so matching
 * on them here keeps the two in sync: reword a server string and this file's
 * tests fail rather than the user seeing raw jargon. Mirrors
 * `report-errors.ts`.
 */

export type VerificationErrorKind =
  | "unauthenticated"
  | "selfVerification"
  | "unknownReport"
  | "noteTooLong"
  | "generic";

export function classifyVerificationError(
  error: unknown,
): VerificationErrorKind {
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
  if (message.includes("Cannot verify your own report")) {
    return "selfVerification";
  }
  if (message.includes("Unknown report:")) return "unknownReport";
  if (message.includes("Note too long:")) return "noteTooLong";
  return "generic";
}

export function verificationErrorMessage(kind: VerificationErrorKind): string {
  switch (kind) {
    case "unauthenticated":
      return "Sign in to confirm or dispute a report.";
    case "selfVerification":
      return "You can't verify your own report.";
    case "unknownReport":
      return "This report no longer exists.";
    case "noteTooLong":
      return `Keep your note to ${MAX_NOTE_LENGTH} characters or fewer.`;
    case "generic":
      return "We couldn't save your vote. Please try again.";
  }
}
