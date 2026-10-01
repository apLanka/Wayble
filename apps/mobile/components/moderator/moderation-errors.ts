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
  | "alreadyRemoved"
  | "noteTooLong"
  | "generic";

/** What the moderator was trying to do; only the generic copy depends on it. */
export type ModerationAction = "dismiss" | "remove";

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
  if (message.includes("Report already removed")) return "alreadyRemoved";
  if (message.includes("Note too long")) return "noteTooLong";
  return "generic";
}

export function moderationErrorMessage(
  kind: ModerationErrorKind,
  action: ModerationAction = "dismiss",
): string {
  switch (kind) {
    case "unauthenticated":
      return "Sign in to moderate reports.";
    case "forbidden":
      return "Only moderators can do this.";
    case "unknownReport":
      return "This report no longer exists.";
    case "alreadyHandled":
      return "These flags were already handled.";
    case "alreadyRemoved":
      return "This report was already removed.";
    case "noteTooLong":
      return "That note is too long. Shorten it and try again.";
    case "generic":
      return action === "remove"
        ? "We couldn't remove this report. Please try again."
        : "We couldn't dismiss this flag. Please try again.";
  }
}
