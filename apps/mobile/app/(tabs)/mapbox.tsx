import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MOCK_LOCATIONS, MAP_CENTER } from "../../data/mock-data";
import type { AccessibleLocation } from "../../data/mock-data";
import CategoryFilter, {
  CATEGORY_COLORS,
} from "../../components/map/CategoryFilter";
import type { Category } from "../../components/map/CategoryFilter";
import DetailSheet from "../../components/map/DetailSheet";

// Safely attempt to load @rnmapbox/maps because native code is not bundled in Expo Go
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Mapbox: any = null;
let isMapboxNativeAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mapboxModule = require("@rnmapbox/maps");
  Mapbox = mapboxModule?.default ?? mapboxModule;
  if (Mapbox && typeof Mapbox.setAccessToken === "function") {
    Mapbox.setAccessToken(
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "pk.placeholder",
    );
    isMapboxNativeAvailable = true;
  }
} catch {
  isMapboxNativeAvailable = false;
}

const toGeoJSON = (
  locations: AccessibleLocation[],
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: locations.map((l) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [l.lng, l.lat] },
    properties: { id: l.id, category: l.category, name: l.name },
  })),
});

export default function MapboxScreen() {
  const { appTheme } = useAppTheme();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<AccessibleLocation | null>(null);

  const filtered =
    activeCategory === "all"
      ? MOCK_LOCATIONS
      : MOCK_LOCATIONS.filter((l) => l.category === activeCategory);

  // If Mapbox native binary is not linked (e.g. running in Expo Go or Web), show fallback UI
  if (!isMapboxNativeAvailable || !Mapbox) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: appTheme.colors.background },
        ]}
      >
        <View style={styles.fallbackContainer}>
          <AppText style={styles.fallbackIcon}>🗺️</AppText>
          <AppText
            variant="title"
            style={{ color: appTheme.colors.text, textAlign: "center" }}
          >
            Mapbox Requires Development Build
          </AppText>
          <AppText
            style={[
              styles.fallbackDescription,
              { color: appTheme.colors.textMuted },
            ]}
          >
            <AppText variant="bodyStrong">@rnmapbox/maps</AppText> contains
            custom native code that is not supported inside standard Expo Go.
          </AppText>
          <AppText
            style={[styles.fallbackHint, { color: appTheme.colors.textMuted }]}
          >
            👉 Please use the{" "}
            <AppText variant="bodyStrong">"Apple Maps"</AppText> tab in the
            bottom bar to view the interactive map in Expo Go, or build a custom
            development build using EAS.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleShapePress = (e: any) => {
    const feature = e.features?.[0];
    if (!feature || feature.properties?.cluster) return;
    const id = feature.properties?.id as string;
    if (!id) return;
    const loc = MOCK_LOCATIONS.find((l) => l.id === id);
    if (loc) setSelected(loc);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CategoryFilter selected={activeCategory} onSelect={setActiveCategory} />
      <Mapbox.MapView
        styleURL="mapbox://styles/mapbox/dark-v11"
        style={{ flex: 1 }}
      >
        <Mapbox.Camera
          zoomLevel={13}
          centerCoordinate={[MAP_CENTER.lng, MAP_CENTER.lat]}
          animationMode="none"
        />
        <Mapbox.ShapeSource
          id="accessibilityLocations"
          shape={toGeoJSON(filtered)}
          cluster
          clusterMaxZoomLevel={14}
          clusterRadius={40}
          onPress={handleShapePress}
        >
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
          <Mapbox.CircleLayer
            id="singlePoint"
            filter={["!", ["has", "point_count"]]}
            style={{
              circleColor: [
                "match",
                ["get", "category"],
                "wheelchair",
                CATEGORY_COLORS.wheelchair,
                "elevator",
                CATEGORY_COLORS.elevator,
                "bathroom",
                CATEGORY_COLORS.bathroom,
                "multi",
                CATEGORY_COLORS.multi,
                "#E65100",
              ],
              circleRadius: 10,
              circleStrokeColor: "#fff",
              circleStrokeWidth: 2,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
      <DetailSheet location={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  fallbackContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fallbackIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  fallbackDescription: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  fallbackHint: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
