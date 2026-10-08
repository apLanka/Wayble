import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { AccessibilityAttribute } from "@packages/backend/convex/accessibility";
import { useLocationPermission } from "./use-location-permission";
import type { Category } from "@/components/map/CategoryFilter";
import { rankPlaces } from "@/utils/rank-places";

// Define the type for what nearest() actually returns based on the query.
export type NearbyPlace = {
  _id: string;
  name: string;
  category: string;
  location: { latitude: number; longitude: number };
  address?: string;
  features?: string[];
  accessibilityCategories?: (
    "wheelchair" | "elevator" | "bathroom" | "multi"
  )[];
  distance?: number;
  /** US-16: current attributes, aggregated server-side by `nearest`/`search`. */
  attributes: AccessibilityAttribute[];
};

export function useNearbyPlaces() {
  const [activeCategories, setActiveCategories] = useState<Category[]>(["all"]);
  const [searchQuery, setSearchQuery] = useState("");
  const { location, status, isLoading, requestPermission, refreshLocation } =
    useLocationPermission();
  // US-16: the needs to rank against. Signed out or not set → no ranking.
  const currentUser = useQuery(api.users.currentUser);
  const needs = currentUser?.accessibilityNeeds;

  // 2. Fetch nearest places when we have a location
  const point = location
    ? {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      }
    : undefined;

  const isSearchActive = searchQuery.trim().length > 0;

  const rawNearest = useQuery(
    api.places.nearest,
    point && !isSearchActive
      ? {
          point,
          limit: 40,
          maxDistance: 50000, // 50km radius
        }
      : "skip",
  );

  const rawSearch = useQuery(
    api.places.search,
    isSearchActive
      ? {
          query: searchQuery,
          limit: 40,
        }
      : "skip",
  );

  // Calculate distance client-side for search results using Haversine formula
  const searchWithDistance = useMemo(() => {
    if (!rawSearch || !point) return rawSearch;

    return rawSearch.map((place) => {
      // Haversine formula
      const R = 6371e3; // Earth radius in meters
      const lat1 = (point.latitude * Math.PI) / 180;
      const lat2 = (place.location.latitude * Math.PI) / 180;
      const deltaLat =
        ((place.location.latitude - point.latitude) * Math.PI) / 180;
      const deltaLon =
        ((place.location.longitude - point.longitude) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLon / 2) *
          Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return { ...place, distance };
    });
  }, [rawSearch, point]);

  // Cast locations to our expected shape which includes distance
  const locations = (isSearchActive ? searchWithDistance : rawNearest) as
    NearbyPlace[] | undefined;

  // Development/Demo fallback: if we have locations but map feels empty, log a hint
  useEffect(() => {
    if (locations && locations.length === 0 && point && !isSearchActive) {
      console.log(
        "💡 No locations found nearby. You might want to seed the database around your current location.",
      );
      console.log(`Current coords: ${point.latitude}, ${point.longitude}`);
    }
  }, [locations, point, isSearchActive]);

  // 3. Derived state: filtering
  const filtered = useMemo(() => {
    if (!locations) return [];
    if (activeCategories.includes("all") || activeCategories.length === 0)
      return locations;
    return locations.filter(
      (loc) =>
        loc.accessibilityCategories &&
        activeCategories.some((c) =>
          loc.accessibilityCategories!.includes(
            c as NonNullable<NearbyPlace["accessibilityCategories"]>[number],
          ),
        ),
    );
  }, [locations, activeCategories]);

  const highlightedIds = useMemo(() => {
    return new Set(filtered.map((l) => l._id));
  }, [filtered]);

  // US-16: ranked copies for lists. `filtered` and `locations` keep their
  // order for the map, whose pins have none; only list views read these.
  const ranked = useMemo(() => rankPlaces(filtered, needs), [filtered, needs]);
  const rankedLocations = useMemo(
    () => (locations ? rankPlaces(locations, needs) : undefined),
    [locations, needs],
  );

  return {
    location,
    status,
    isLoading,
    requestPermission,
    refreshLocation,
    locations,
    filtered,
    ranked,
    rankedLocations,
    highlightedIds,
    activeCategories,
    setActiveCategories,
    searchQuery,
    setSearchQuery,
  };
}
