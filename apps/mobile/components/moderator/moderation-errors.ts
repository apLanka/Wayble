/**
 * S4-7 — turns a failed moderation call into copy a person can act on.
 *
 * Matches on the server messages asserted by `moderation.test.ts`.
 * Mirrors `flag-errors.ts`.
 */

export type ModerationErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "unknownReport"
  | "alreadyHandled"
  | "generic";

export function classifyModerationError(error: unknown): ModerationErrorKind {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error ?? "");

  if (message.includes("Unauthenticated:")) return "unauthenticated";
  if (message.includes("Forbidden:")) return "forbidden";
  if (message.includes("Unknown report:")) return "unknownReport";
  if (message.includes("No open flags on this report")) return "alreadyHandled";
  return "generic";
}

export function moderationErrorMessage(kind: ModerationErrorKind): string {
  switch (kind) {
    case "unauthenticated":
      return "Sign in to moderate reports.";
    case "forbidden":
      return "Only moderators can do this.";
    case "unknownReport":
      return "This report no longer exists.";
    case "alreadyHandled":
      return "These flags were already handled.";
    case "generic":
      return "We couldn't dismiss this flag. Please try again.";
  }
}
