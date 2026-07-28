import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useLocationPermission } from "./use-location-permission";
import type { Category } from "@/components/map/CategoryFilter";

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
};

export function useNearbyPlaces() {
  const [activeCategories, setActiveCategories] = useState<Category[]>(["all"]);
  const [searchQuery, setSearchQuery] = useState("");
  const { location, status, isLoading, requestPermission, refreshLocation } =
    useLocationPermission();

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

  // Cast locations to our expected shape which includes distance
  const locations = (isSearchActive ? rawSearch : rawNearest) as
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

  return {
    location,
    status,
    isLoading,
    requestPermission,
    refreshLocation,
    locations,
    filtered,
    highlightedIds,
    activeCategories,
    setActiveCategories,
    searchQuery,
    setSearchQuery,
  };
}
