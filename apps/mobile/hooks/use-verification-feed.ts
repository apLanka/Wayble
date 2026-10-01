import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useIsFocused } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { AccessibilityInfo } from "react-native";

import {
  announcementFor,
  feedItemKey,
  findNewItems,
} from "@/components/feed/feed-announcements";
import { useLocationPermission } from "./use-location-permission";

const FEED_LIMIT = 30;

/**
 * S3-7 (US-23) — live feed of verifications near the user.
 *
 * Both reads are plain `useQuery` subscriptions, so a vote cast on another
 * device arrives here with no refresh. The `nearest` args deliberately match
 * `useNearbyPlaces`, so the map and the feed share one subscription.
 *
 * Announcements: the first result for a given region only seeds the "seen" set,
 * so opening the screen is silent. After that, unseen items from other people
 * are announced once, collapsed into a single message per update. Items that
 * arrive while the screen is not focused are marked seen without speaking.
 */
export function useVerificationFeed() {
  const { location, status, isLoading, requestPermission } =
    useLocationPermission();
  const isFocused = useIsFocused();

  const point = location
    ? {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      }
    : undefined;

  const nearby = useQuery(
    api.places.nearest,
    point ? { point, limit: 40, maxDistance: 50000 } : "skip",
  );
  const placeIds = useMemo(
    () => nearby?.map((place) => place._id) ?? [],
    [nearby],
  );
  const scopeKey = useMemo(() => [...placeIds].sort().join(","), [placeIds]);

  const currentUser = useQuery(api.users.currentUser);
  const feed = useQuery(
    api.verificationFeed.recentVerifications,
    placeIds.length > 0 ? { placeIds, limit: FEED_LIMIT } : "skip",
  );

  const seen = useRef(new Set<string>());
  const seededScope = useRef<string | null>(null);

  useEffect(() => {
    if (feed === undefined) return;

    // New region (or first load): remember what is already there, say nothing.
    if (seededScope.current !== scopeKey) {
      seededScope.current = scopeKey;
      seen.current = new Set(feed.map(feedItemKey));
      return;
    }

    // `currentUser` still loading would let the user's own vote through, so
    // wait for it; `null` (signed out) is a resolved answer.
    if (currentUser === undefined) return;

    const fresh = findNewItems(seen.current, feed, currentUser?._id);
    for (const item of feed) seen.current.add(feedItemKey(item));

    const message = announcementFor(fresh);
    if (message && isFocused)
      AccessibilityInfo.announceForAccessibility(message);
  }, [feed, scopeKey, currentUser, isFocused]);

  return {
    status,
    isLocating: isLoading,
    hasLocation: point !== undefined,
    requestPermission,
    // `undefined` = still loading; `[]` = nothing near you yet.
    items: placeIds.length === 0 && nearby !== undefined ? [] : feed,
    currentUserId: currentUser?._id,
  };
}
