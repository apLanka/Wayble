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
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const { location, status, isLoading, requestPermission, refreshLocation } =
    useLocationPermission();

  // 2. Fetch nearest places when we have a location
  const point = location
    ? {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      }
    : undefined;

  const rawLocations = useQuery(
    api.places.nearest,
    point
      ? {
          point,
          limit: 40,
          maxDistance: 50000, // 50km radius
        }
      : "skip",
  );

  // Cast locations to our expected shape which includes distance
  const locations = rawLocations as NearbyPlace[] | undefined;

  // Development/Demo fallback: if we have locations but map feels empty, log a hint
  useEffect(() => {
    if (locations && locations.length === 0 && point) {
      console.log(
        "💡 No locations found nearby. You might want to seed the database around your current location.",
      );
      console.log(`Current coords: ${point.latitude}, ${point.longitude}`);
    }
  }, [locations, point]);

  // 3. Derived state: filtering
  const filtered = useMemo(() => {
    if (!locations) return [];
    if (activeCategory === "all") return locations;
    return locations.filter(
      (loc) =>
        loc.accessibilityCategories &&
        loc.accessibilityCategories.includes(
          activeCategory as NonNullable<
            NearbyPlace["accessibilityCategories"]
          >[number],
        ),
    );
  }, [locations, activeCategory]);

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
    activeCategory,
    setActiveCategory,
  };
}
