import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { MOCK_LOCATIONS, MAP_CENTER } from "../../data/mock-data";
import type { AccessibleLocation } from "../../data/mock-data";
import CategoryFilter from "../../components/map/CategoryFilter";
import type { Category } from "../../components/map/CategoryFilter";
import DetailSheet from "../../components/map/DetailSheet";
import { LocationPermissionBanner } from "../../components/map/LocationPermissionBanner";
import * as Location from "expo-location";
import { useLocationPermission } from "../../hooks/use-location-permission";
import { LocateButton } from "../../components/map/LocateButton";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "pk.placeholder");

const HIGHLIGHT_COUNT = 5;

const toGeoJSON = (
  locations: AccessibleLocation[],
  highlightedIds: Set<string>,
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: locations.map((l) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [l.lng, l.lat] },
    properties: {
      id: l.id,
      category: l.category,
      name: l.name,
      highlighted: highlightedIds.has(l.id),
    },
  })),
});

export default function MapboxScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<AccessibleLocation | null>(null);
  const { status, location, requestPermission, refreshLocation } =
    useLocationPermission();
  const cameraRef = useRef<Mapbox.Camera>(null);

  // Dev seed: populate the (likely empty) places table once from the local
  // mock data. seedMockPlaces is itself a no-op once places already exist.
  const seedMockPlaces = useMutation(api.places.seedMockPlaces);
  const hasSeeded = useRef(false);
  useEffect(() => {
    if (hasSeeded.current) return;
    hasSeeded.current = true;
    seedMockPlaces({
      places: MOCK_LOCATIONS.map((l) => ({
        name: l.name,
        address: l.address,
        location: { latitude: l.lat, longitude: l.lng },
        accessibilityCategory: l.category,
        features: l.features,
      })),
    }).catch(() => {
      // best-effort dev seed; ignore failures (e.g. already seeded elsewhere)
    });
  }, [seedMockPlaces]);

  const queryPoint =
    status === "granted" && location
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      : { latitude: MAP_CENTER.lat, longitude: MAP_CENTER.lng };

  const nearestPlaces = useQuery(api.places.nearest, {
    point: queryPoint,
    limit: 40,
    maxDistance: 50000,
  });

  // While loading, fall back to local mock data so the map isn't blank.
  const locations: AccessibleLocation[] = useMemo(() => {
    if (!nearestPlaces) return MOCK_LOCATIONS;
    return nearestPlaces.map((p) => ({
      id: p._id,
      lat: p.location.latitude,
      lng: p.location.longitude,
      name: p.name,
      category: p.accessibilityCategory ?? "multi",
      address: p.address,
      features: p.features ?? [],
    }));
  }, [nearestPlaces]);

  const highlightedIds = useMemo(
    () => new Set(locations.slice(0, HIGHLIGHT_COUNT).map((l) => l.id)),
    [locations],
  );

  const filtered =
    activeCategory === "all"
      ? locations
      : locations.filter((l) => l.category === activeCategory);

  // ponytail: typed as any — @rnmapbox/maps doesn't re-export OnPressEvent from package root; upgrade when they do
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleShapePress = (e: any) => {
    const feature = e.features?.[0];
    if (!feature || feature.properties?.cluster) return;
    const id = feature.properties?.id as string;
    if (!id) return;
    const loc = locations.find((l) => l.id === id);
    if (loc) setSelected(loc);
  };

  const [isFollowingUser, setIsFollowingUser] = useState(true);

  const handleLocateMe = async () => {
    let currentStatus = status;
    let targetLoc = location;

    if (currentStatus !== "granted") {
      const newLoc = await requestPermission();
      if (newLoc) {
        targetLoc = newLoc;
        currentStatus = "granted" as Location.PermissionStatus;
      }
    }

    if (currentStatus === "granted") {
      const freshLoc = await refreshLocation();
      if (freshLoc) {
        targetLoc = freshLoc;
      }
    }

    if (targetLoc) {
      console.log(
        "LocateMe moving camera to:",
        targetLoc.coords.longitude,
        targetLoc.coords.latitude,
      );

      // Disable follow mode so we can manually animate to the coords
      setIsFollowingUser(false);

      // Give React a tick to update the camera props, then fly to the location
      setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: [
            targetLoc.coords.longitude,
            targetLoc.coords.latitude,
          ],
          zoomLevel: 14,
          animationDuration: 1000,
        });

        // Re-enable follow mode after animation finishes
        setTimeout(() => setIsFollowingUser(true), 1200);
      }, 100);
    } else {
      console.log("LocateMe failed: no targetLoc available");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CategoryFilter selected={activeCategory} onSelect={setActiveCategory} />
      <LocationPermissionBanner status={status} onRequest={requestPermission} />
      <View style={{ flex: 1 }}>
        <Mapbox.MapView
          styleURL="mapbox://styles/mapbox/dark-v11"
          // TODO: replace with custom high-contrast Mapbox Studio style for production
          style={{ flex: 1 }}
          onRegionWillChange={(e) => {
            if (e.properties.isUserInteraction) {
              setIsFollowingUser(false);
            }
          }}
        >
          <Mapbox.Images>
            <View
              key="wheelchair"
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>♿</Text>
            </View>
            <View
              key="elevator"
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>🛗</Text>
            </View>
            <View
              key="bathroom"
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>🚻</Text>
            </View>
            <View
              key="multi"
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>⭐</Text>
            </View>
            <View
              key="fallback"
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>📍</Text>
            </View>
          </Mapbox.Images>
          <Mapbox.Camera
            ref={cameraRef}
            {...(status === "granted" && isFollowingUser
              ? {
                  followUserLocation: true,
                  followUserMode: Mapbox.UserTrackingMode.Follow,
                }
              : status !== "granted"
                ? {
                    zoomLevel: 13,
                    centerCoordinate: [MAP_CENTER.lng, MAP_CENTER.lat],
                  }
                : {})}
            animationMode="flyTo"
            animationDuration={1000}
          />
          {status === "granted" && <Mapbox.UserLocation />}
          <Mapbox.ShapeSource
            id="accessibilityLocations"
            shape={toGeoJSON(filtered, highlightedIds)}
            cluster
            clusterMaxZoomLevel={14}
            clusterRadius={40}
            onPress={handleShapePress}
          >
            <Mapbox.CircleLayer
              id="highlightRing"
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "highlighted"], true],
              ]}
              style={{
                circleColor: "transparent",
                circleRadius: 16,
                circleStrokeColor: "#FFD600",
                circleStrokeWidth: 3,
              }}
            />
            <Mapbox.CircleLayer
              id="clusters"
              filter={["has", "point_count"]}
              style={{
                circleColor: "#1565C0",
                circleRadius: 18,
                circleOpacity: 0.85,
              }}
            />
            <Mapbox.SymbolLayer
              id="clusterCount"
              filter={["has", "point_count"]}
              style={{
                textField: "{point_count_abbreviated}",
                textSize: 13,
                textColor: "#fff",
              }}
            />
            <Mapbox.SymbolLayer
              id="singlePoint"
              filter={["!", ["has", "point_count"]]}
              style={{
                iconImage: [
                  "match",
                  ["get", "category"],
                  "wheelchair",
                  "wheelchair",
                  "elevator",
                  "elevator",
                  "bathroom",
                  "bathroom",
                  "multi",
                  "multi",
                  "fallback",
                ],
                iconSize: 1.2,
                iconAllowOverlap: true,
              }}
            />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>
        <LocateButton onPress={handleLocateMe} bottomOffset={16} />
      </View>
      <DetailSheet location={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}
