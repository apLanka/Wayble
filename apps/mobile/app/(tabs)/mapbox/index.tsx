import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Mapbox from "@rnmapbox/maps";
import { LocationPermissionBanner } from "@/components/map/LocationPermissionBanner";
import { LocateButton } from "@/components/map/LocateButton";
import { DetailSheet } from "@/components/map/DetailSheet";
import { CategoryFilter } from "@/components/map/CategoryFilter";
import { PlaceListItem } from "@/components/map/PlaceListItem";
import { ViewModeToggle } from "@/components/map/ViewModeToggle";
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
  const { appTheme } = useAppTheme();
  const { isScreenReaderEnabled } = useScreenReader();
  const [manualListMode, setManualListMode] = useState<boolean | null>(null);

  const {
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

  const cameraRef = React.useRef<Mapbox.Camera>(null);

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
          zoomLevel: 14,
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

  // Prepare GeoJSON for map
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CategoryFilter
        activeCategory={activeCategory}
        onSelectCategory={(c) => {
          setActiveCategory(c);
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
              <AppText style={styles.emptyText}>
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
              zoomLevel={14}
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
                visible={true}
                showsUserHeadingIndicator={true}
                androidRenderMode="compass"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onUpdate={handleUserTrackingModeChange as any}
              />
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
                    ["==", ["get", "isHighlighted"], true],
                    8,
                    4,
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
                  circleStrokeWidth: 2,
                  circleStrokeColor: "#ffffff",
                  circleOpacity: [
                    "case",
                    ["==", ["get", "isHighlighted"], true],
                    1,
                    0.4,
                  ],
                }}
              />
            </Mapbox.ShapeSource>
          </Mapbox.MapView>

          <LocateButton onPress={handleLocateMe} bottomOffset={100} />
        </View>
      )}

      {selectedPlace && !isListMode && (
        <DetailSheet
          location={selectedPlace as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          onClose={() => setSelectedPlaceId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#6b7280",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
});
