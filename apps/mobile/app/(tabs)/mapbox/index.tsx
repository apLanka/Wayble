import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Mapbox from "@rnmapbox/maps";
import { LocationPermissionBanner } from "@/components/map/LocationPermissionBanner";
import { LocateButton } from "@/components/map/LocateButton";
import { DetailSheet } from "@/components/map/DetailSheet";
import { CategoryFilter } from "@/components/map/CategoryFilter";
import type { Category } from "@/components/map/CategoryFilter";
import { PlaceListItem } from "@/components/map/PlaceListItem";
import { ViewModeToggle } from "@/components/map/ViewModeToggle";
import { SearchBar } from "@/components/map/SearchBar";
import { AppText } from "@/components/ui/app-text";

import { useNearbyPlaces, NearbyPlace } from "@/hooks/use-nearby-places";
import { useScreenReader } from "@/hooks/use-screen-reader";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing } from "@/constants/theme";

// Connect to Mapbox using env var
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

export default function MapboxTab() {
  const router = useRouter();
  const { category, focusSearch, nearMe } = useLocalSearchParams<{
    category?: string;
    focusSearch?: string;
    nearMe?: string;
  }>();
  const { appTheme } = useAppTheme();
  const { isScreenReaderEnabled } = useScreenReader();
  const [manualListMode, setManualListMode] = useState<boolean | null>(null);
  const [focusSearchOnMount, setFocusSearchOnMount] = useState(false);
  const deepLinkHandled = useRef(false);

  const {
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
  } = useNearbyPlaces();

  // Selected place for bottom sheet in map mode
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Derived state for view mode
  const isListMode = manualListMode ?? isScreenReaderEnabled;

  const handlePlacePress = (place: NearbyPlace) => {
    if (isListMode) {
      // Encode params as strings for router
      router.push({
        pathname: "/mapbox/place/[id]",
        params: {
          id: place._id,
          name: place.name,
          category: place.category,
          address: place.address || "",
          features: place.features ? JSON.stringify(place.features) : "",
          accessibilityCategories: place.accessibilityCategories
            ? JSON.stringify(place.accessibilityCategories)
            : "",
          distance: place.distance?.toString() || "",
        },
      });
    } else {
      setSelectedPlaceId(place._id);
    }
  };

  const selectedPlace = locations?.find((l) => l._id === selectedPlaceId);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<number[][] | null>(
    null,
  );

  const cameraRef = React.useRef<Mapbox.Camera>(null);

  // Heartbeat animation value
  const heartbeatAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selectedPlaceId) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartbeatAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(heartbeatAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      heartbeatAnim.stopAnimation();
      heartbeatAnim.setValue(1);
    }
  }, [selectedPlaceId]);

  const fetchRoute = async (destination: NearbyPlace) => {
    if (!location || !MAPBOX_TOKEN) return;

    try {
      const startLng = location.coords.longitude;
      const startLat = location.coords.latitude;
      const endLng = destination.location.longitude;
      const endLat = destination.location.latitude;

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`,
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        setRouteCoordinates(data.routes[0].geometry.coordinates);
      }
    } catch (error) {
      console.error("Failed to fetch route", error);
    }
  };

  const handleLocateMe = async () => {
    let currentStatus = status;
    let targetLoc = location;

    if (currentStatus !== "granted") {
      const newLoc = await requestPermission();
      if (newLoc) {
        targetLoc = newLoc;
        currentStatus = "granted" as import("expo-location").PermissionStatus;
      }
    }

    if (currentStatus === "granted") {
      const freshLoc = await refreshLocation();
      targetLoc = freshLoc || targetLoc;
    }

    if (targetLoc) {
      setIsFollowingUser(false);

      setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: [
            targetLoc!.coords.longitude,
            targetLoc!.coords.latitude,
          ],
          zoomLevel: 15.5,
          animationDuration: 1000,
        });
      }, 50);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserTrackingModeChange = (e: any) => {
    if (
      e.nativeEvent?.payload?.followUserMode === Mapbox.UserTrackingMode.Follow
    ) {
      setIsFollowingUser(true);
    } else if (e.nativeEvent?.payload?.followUserMode === false) {
      setIsFollowingUser(false);
    }
  };

  useEffect(() => {
    if (deepLinkHandled.current) return;

    const hasDeepLink = category || focusSearch === "true" || nearMe === "true";
    if (!hasDeepLink) return;

    deepLinkHandled.current = true;

    const validCategories: Category[] = [
      "wheelchair",
      "elevator",
      "bathroom",
      "multi",
    ];
    if (category && validCategories.includes(category as Category)) {
      setActiveCategories([category as Category]);
    }
    if (focusSearch === "true") {
      setFocusSearchOnMount(true);
    }
    if (nearMe === "true") {
      void handleLocateMe();
    }
  }, [category, focusSearch, nearMe, setActiveCategories]);

  // Prepare GeoJSON for map
  const routeGeojson = routeCoordinates
    ? {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: routeCoordinates,
            },
            properties: {},
          },
        ],
      }
    : null;

  const geojson = {
    type: "FeatureCollection" as const,
    features: (filtered || []).map((loc) => ({
      type: "Feature" as const,
      id: loc._id,
      geometry: {
        type: "Point" as const,
        coordinates: [loc.location.longitude, loc.location.latitude],
      },
      properties: {
        id: loc._id,
        category: loc.category,
        isHighlighted: highlightedIds.has(loc._id),
        hasWheelchair:
          loc.accessibilityCategories?.includes("wheelchair") ?? false,
        hasElevator: loc.accessibilityCategories?.includes("elevator") ?? false,
        hasBathroom: loc.accessibilityCategories?.includes("bathroom") ?? false,
        hasMulti: loc.accessibilityCategories?.includes("multi") ?? false,
      },
    })),
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: appTheme.colors.background },
      ]}
      edges={["top"]}
    >
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search accessible places…"
        focusOnMount={focusSearchOnMount}
        results={
          searchQuery.trim().length > 0
            ? (locations as NearbyPlace[])
            : undefined
        }
        onSelectResult={(place) => {
          setSearchQuery("");
          setSelectedPlaceId(place._id);
          setManualListMode(false); // Switch to map mode
          setRouteCoordinates(null); // Clear previous route

          setTimeout(() => {
            cameraRef.current?.setCamera({
              centerCoordinate: [
                place.location.longitude,
                place.location.latitude,
              ],
              zoomLevel: 16,
              animationDuration: 1000,
            });
          }, 100);
        }}
      />
      <CategoryFilter
        activeCategories={activeCategories}
        onToggleCategory={(cat) => {
          setActiveCategories((prev) => {
            if (cat === "all") return ["all"];

            const newCats = prev.filter((c) => c !== "all");

            if (newCats.includes(cat)) {
              const updated = newCats.filter((c) => c !== cat);
              return updated.length === 0 ? ["all"] : updated;
            } else {
              return [...newCats, cat];
            }
          });
          setSelectedPlaceId(null);
        }}
      />

      <ViewModeToggle
        isListMode={isListMode}
        onToggle={(value) => setManualListMode(value)}
      />

      {status !== "granted" && !isLoading && (
        <LocationPermissionBanner
          status={status}
          onRequest={requestPermission}
        />
      )}

      {isListMode ? (
        <View
          style={[
            styles.listContainer,
            { backgroundColor: appTheme.colors.background },
          ]}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppText
                accessibilityRole="text"
                style={[styles.emptyText, { color: appTheme.colors.textMuted }]}
              >
                No places found nearby.
              </AppText>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <PlaceListItem
                  name={item.name}
                  category={item.category}
                  distance={item.distance}
                  onPress={() => handlePlacePress(item)}
                />
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <Mapbox.MapView
            style={styles.map}
            logoEnabled={false}
            onRegionWillChange={(e) => {
              if (e.properties.isUserInteraction) {
                setIsFollowingUser(false);
              }
            }}
          >
            <Mapbox.Camera
              ref={cameraRef}
              zoomLevel={15.5}
              centerCoordinate={
                location
                  ? [location.coords.longitude, location.coords.latitude]
                  : undefined
              }
              animationMode="flyTo"
              animationDuration={1000}
              {...(status === "granted" && isFollowingUser
                ? {
                    followUserLocation: true,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    followUserMode: Mapbox.UserTrackingMode.Follow as any,
                  }
                : {})}
            />
            {location && (
              <Mapbox.UserLocation
                visible={false} // Hide the default puck
                showsUserHeadingIndicator={false}
                androidRenderMode="compass"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onUpdate={handleUserTrackingModeChange as any}
              />
            )}

            {location && (
              <Mapbox.MarkerView
                id="user-location-marker"
                coordinate={[
                  location.coords.longitude,
                  location.coords.latitude,
                ]}
              >
                <View
                  accessible
                  accessibilityLabel="Your current location"
                  style={{
                    width: 60,
                    height: 60,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                    style={{
                      fontSize: 48,
                      lineHeight: 60,
                      textAlign: "center",
                    }}
                  >
                    🧍
                  </AppText>
                </View>
              </Mapbox.MarkerView>
            )}

            <Mapbox.ShapeSource
              id="places-source"
              shape={geojson}
              onPress={(event) => {
                const feature = event.features[0];
                if (feature?.properties?.id) {
                  setSelectedPlaceId(feature.properties.id as string);
                }
              }}
            >
              <Mapbox.CircleLayer
                id="places-layer"
                style={{
                  circleRadius: [
                    "case",
                    ["==", ["get", "id"], selectedPlaceId || ""],
                    0, // Hide the standard circle for the selected place
                    ["==", ["get", "isHighlighted"], true],
                    14,
                    10,
                  ],
                  circleColor: [
                    "case",
                    ["==", ["get", "hasWheelchair"], true],
                    "#3b82f6", // wheelchair (Blue)
                    ["==", ["get", "hasElevator"], true],
                    "#f59e0b", // elevator (Yellow)
                    ["==", ["get", "hasBathroom"], true],
                    "#10b981", // bathroom (Green)
                    ["==", ["get", "hasMulti"], true],
                    "#8b5cf6", // multi (Purple)
                    /* default */ "#6b7280", // all/other (Gray)
                  ],
                  circleStrokeWidth: 3,
                  circleStrokeColor: "#ffffff",
                  circleOpacity: [
                    "case",
                    ["==", ["get", "isHighlighted"], true],
                    1,
                    0.7,
                  ],
                }}
              />
            </Mapbox.ShapeSource>

            {selectedPlace && (
              <Mapbox.MarkerView
                id="selected-place-marker"
                coordinate={[
                  selectedPlace.location.longitude,
                  selectedPlace.location.latitude,
                ]}
              >
                <Animated.View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(239, 68, 68, 0.4)", // Red glow
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: heartbeatAnim }],
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "#ef4444", // Solid red center
                      borderWidth: 2,
                      borderColor: "white",
                    }}
                  />
                </Animated.View>
              </Mapbox.MarkerView>
            )}

            {routeGeojson && (
              <Mapbox.ShapeSource id="route-source" shape={routeGeojson}>
                <Mapbox.LineLayer
                  id="route-layer"
                  style={{
                    lineColor: "#3b82f6",
                    lineWidth: 5,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </Mapbox.ShapeSource>
            )}
          </Mapbox.MapView>

          <LocateButton onPress={handleLocateMe} bottomOffset={100} />
        </View>
      )}

      {selectedPlace && !isListMode && (
        <DetailSheet
          location={selectedPlace as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          onClose={() => {
            setSelectedPlaceId(null);
            setRouteCoordinates(null);
          }}
          onShowDirection={() => fetchRoute(selectedPlace)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
});
