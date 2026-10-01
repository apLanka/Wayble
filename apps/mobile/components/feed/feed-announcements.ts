import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";
import { ATTRIBUTE_METADATA } from "../../constants/accessibility-metadata";

/** The fields of a `verificationFeed.recentVerifications` entry this module reads. */
export type FeedEntry = {
  _id: string;
  verifierId: string;
  verifierName: string;
  placeName: string;
  verdict: "confirm" | "dispute";
  attributes: { key: AccessibilityAttributeKey }[];
  updatedAt: number;
};

/**
 * Identity of one piece of activity. `updatedAt` is part of it because a voter
 * changing their vote patches the same row: that is new activity, and keying on
 * `_id` alone would never announce it.
 */
export function feedItemKey(item: Pick<FeedEntry, "_id" | "updatedAt">) {
  return `${item._id}:${item.updatedAt}`;
}

/** Entries not yet seen and not cast by the current user, newest first. */
export function findNewItems<T extends FeedEntry>(
  seen: ReadonlySet<string>,
  items: readonly T[],
  currentUserId: string | undefined,
): T[] {
  return items
    .filter(
      (item) =>
        !seen.has(feedItemKey(item)) &&
        (currentUserId === undefined || item.verifierId !== currentUserId),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** "Elevator", or "Elevator and 2 more" for a multi-attribute report. */
export function attributeSummary(attributes: FeedEntry["attributes"]): string {
  const labels = attributes
    .map((a) => ATTRIBUTE_METADATA[a.key]?.label)
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return "accessibility report";
  if (labels.length === 1) return labels[0];
  const rest = labels.length - 1;
  return `${labels[0]} and ${rest} more`;
}

/** "Sam confirmed Elevator at Community Library". */
export function describeFeedItem(item: FeedEntry): string {
  const verb = item.verdict === "confirm" ? "confirmed" : "disputed";
  return `${item.verifierName} ${verb} ${attributeSummary(item.attributes)} at ${item.placeName}`;
}

/** The single announcement for a batch of new items; null when there are none. */
export function announcementFor(newItems: readonly FeedEntry[]): string | null {
  if (newItems.length === 0) return null;
  const latest = describeFeedItem(newItems[0]);
  if (newItems.length === 1) return `New verification nearby: ${latest}.`;
  return `${newItems.length} new verifications nearby. Latest: ${latest}.`;
}
