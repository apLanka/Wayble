import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { PlatformSymbol } from "@/components/ui/app-symbol";

export type ActivityRating =
  "accessible" | "partially_accessible" | "inaccessible";

export interface ActivityLogItem {
  _id: Id<"activityLogs">;
  _creationTime: number;
  userId: Id<"users">;
  placeId?: Id<"places">;
  placeName: string;
  title: string;
  notes?: string;
  category?: string;
  accessibilityRating: ActivityRating;
  imageUrl?: string;
  imageAlt?: string;
  helpfulCount?: number;
  helpfulUserIds?: Id<"users">[];
  tags?: string[];
  authorName?: string;
  authorAvatar?: string;
  isHelpful?: boolean;
  visitedAt: number;
  createdAt: number;
  updatedAt: number;
}

export type ActivityFilter = "all" | "accessible" | "needs_attention";

export interface ActivityRatingConfig {
  label: string;
  shortLabel: string;
  description: string;
  colorKey: "success" | "warning" | "danger";
  symbolName: PlatformSymbol;
}

export const ACTIVITY_RATING_CONFIGS: Record<
  ActivityRating,
  ActivityRatingConfig
> = {
  accessible: {
    label: "Fully Accessible",
    shortLabel: "Accessible",
    description: "No major accessibility barriers encountered",
    colorKey: "success",
    symbolName: { ios: "checkmark.circle.fill", android: "check_circle" },
  },
  partially_accessible: {
    label: "Partially Accessible",
    shortLabel: "Partial",
    description: "Some accessibility barriers or assistance required",
    colorKey: "warning",
    symbolName: { ios: "exclamationmark.circle.fill", android: "warning" },
  },
  inaccessible: {
    label: "Inaccessible",
    shortLabel: "Inaccessible",
    description: "Significant accessibility barriers or blocked access",
    colorKey: "danger",
    symbolName: { ios: "xmark.circle.fill", android: "cancel" },
  },
};

export interface ActivityDraft {
  placeName: string;
  title: string;
  notes?: string;
  category?: string;
  accessibilityRating: ActivityRating;
  imageUrl?: string;
  imageAlt?: string;
  tags?: string[];
  visitedAt?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a user's activity log input before submission.
 */
export function validateActivityDraft(draft: {
  placeName?: string;
  title?: string;
}): ValidationResult {
  const trimmedPlace = (draft.placeName ?? "").trim();
  if (trimmedPlace.length === 0) {
    return {
      isValid: false,
      error: "Please enter the place or venue name.",
    };
  }

  const trimmedTitle = (draft.title ?? "").trim();
  if (trimmedTitle.length === 0) {
    return {
      isValid: false,
      error: "Please enter a short headline or summary for this activity.",
    };
  }

  if (trimmedTitle.length > 100) {
    return {
      isValid: false,
      error: "Title must be 100 characters or fewer.",
    };
  }

  return { isValid: true };
}

/**
 * Filters a list of activity logs by filter tab.
 */
export function filterActivityLogs(
  logs: ActivityLogItem[],
  filter: ActivityFilter,
): ActivityLogItem[] {
  if (filter === "all") return logs;
  if (filter === "accessible") {
    return logs.filter((log) => log.accessibilityRating === "accessible");
  }
  if (filter === "needs_attention") {
    return logs.filter(
      (log) =>
        log.accessibilityRating === "partially_accessible" ||
        log.accessibilityRating === "inaccessible",
    );
  }
  return logs;
}

/**
 * Returns accessible text description for a log card.
 */
export function getLogCardAccessibilityLabel(
  log: ActivityLogItem,
  formattedDate: string,
): string {
  const ratingInfo = ACTIVITY_RATING_CONFIGS[log.accessibilityRating];
  const notesSnippet = log.notes ? `. Notes: ${log.notes}` : "";
  return `${log.title} at ${log.placeName}. Rated ${ratingInfo.label}. Visited ${formattedDate}${notesSnippet}.`;
}

/**
 * Formats a timestamp into a readable date string.
 */
export function formatVisitDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
