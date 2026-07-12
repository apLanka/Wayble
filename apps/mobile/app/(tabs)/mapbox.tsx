import React, { useState } from "react";
import { SafeAreaView } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { MOCK_LOCATIONS, MAP_CENTER } from "../../data/mock-data";
import type { AccessibleLocation } from "../../data/mock-data";
import CategoryFilter, {
  CATEGORY_COLORS,
} from "../../components/map/CategoryFilter";
import type { Category } from "../../components/map/CategoryFilter";
import DetailSheet from "../../components/map/DetailSheet";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "pk.placeholder");

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
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<AccessibleLocation | null>(null);

  const filtered =
    activeCategory === "all"
      ? MOCK_LOCATIONS
      : MOCK_LOCATIONS.filter((l) => l.category === activeCategory);

  // ponytail: typed as any — @rnmapbox/maps doesn't re-export OnPressEvent from package root; upgrade when they do
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
        // TODO: replace with custom high-contrast Mapbox Studio style for production
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
                "#E65100", // fallback
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
