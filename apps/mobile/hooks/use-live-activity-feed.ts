import { useEffect, useRef } from "react";
import { AccessibilityInfo } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import {
  ATTRIBUTE_METADATA,
  type AttributeDisplayMeta,
} from "@/constants/accessibility-metadata";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

export type VerificationFeedItem = {
  _id: string;
  reportId: string;
  verdict: "confirm" | "dispute";
  note?: string;
  updatedAt: number;
  confidence: {
    score: number;
    level:
      | "high_confidence"
      | "confirmed"
      | "verified"
      | "under_review"
      | "disputed";
    label: string;
  };
  totalVerifications: number;
  verifier: {
    _id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  place: {
    _id: string;
    name: string;
    category: string;
    address: string;
    location: { latitude: number; longitude: number };
  };
  primaryAttribute: {
    key: AccessibilityAttributeKey;
    value: string;
    note?: string;
  } | null;
  attributes: Array<{
    key: AccessibilityAttributeKey;
    value: string;
    note?: string;
  }>;
};

type UseLiveActivityFeedOptions = {
  placeId?: Id<"places">;
  placeIds?: Id<"places">[];
  limit?: number;
  enableA11yAnnouncements?: boolean;
};

/**
 * Hook to subscribe to real-time verification feed updates via Convex.
 *
 * Provides:
 * 1. Live streaming updates over WebSockets with zero manual refresh.
 * 2. Automatic screen-reader announcements via AccessibilityInfo.announceForAccessibility
 *    when new community verifications arrive.
 * 3. Scoping by specific place or current map region.
 */
export function useLiveActivityFeed(options: UseLiveActivityFeedOptions = {}) {
  const {
    placeId,
    placeIds,
    limit = 20,
    enableA11yAnnouncements = true,
  } = options;

  const feedItems = useQuery(api.verifications.recentVerifications, {
    placeId,
    placeIds,
    limit,
  }) as VerificationFeedItem[] | undefined;

  const previousTopIdRef = useRef<string | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (!feedItems || feedItems.length === 0) {
      return;
    }

    const currentTop = feedItems[0];
    if (!currentTop) return;

    if (isFirstMountRef.current) {
      // First data arrival, initialize reference
      previousTopIdRef.current = currentTop._id;
      isFirstMountRef.current = false;
      return;
    }

    // Check if new verification item arrived
    if (
      previousTopIdRef.current &&
      previousTopIdRef.current !== currentTop._id
    ) {
      previousTopIdRef.current = currentTop._id;

      if (enableA11yAnnouncements) {
        const verifier = currentTop.verifier.name;
        const placeName = currentTop.place.name;
        const verdictWord =
          currentTop.verdict === "confirm" ? "confirmed" : "disputed";
        const attrKey = currentTop.primaryAttribute?.key;
        const attrLabel = attrKey
          ? (ATTRIBUTE_METADATA[attrKey] as AttributeDisplayMeta)?.label ||
            "accessibility"
          : "accessibility";
        const confidence = currentTop.confidence.label;

        const announcement = `New verification: ${verifier} ${verdictWord} ${attrLabel} at ${placeName}. Confidence: ${confidence}.`;
        AccessibilityInfo.announceForAccessibility(announcement);
      }
    }
  }, [feedItems, enableA11yAnnouncements]);

  return {
    items: feedItems ?? [],
    isLoading: feedItems === undefined,
    isLive: true,
  };
}
