import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native";
// react-native-map-clustering New Architecture (Fabric) compatibility is unverified for this package.
import MapView from "react-native-map-clustering";
import { Marker } from "react-native-maps";
import { MOCK_LOCATIONS } from "../../data/mock-data";
import type { AccessibleLocation } from "../../data/mock-data";
import CategoryFilter from "../../components/map/CategoryFilter";
import DetailSheet from "../../components/map/DetailSheet";
import AccessibilityPin from "../../components/map/AccessibilityPin";
import type { Category } from "../../components/map/CategoryFilter";
import { LocationPermissionBanner } from "../../components/map/LocationPermissionBanner";
import { useLocationPermission } from "../../hooks/use-location-permission";
import { LocateButton } from "../../components/map/LocateButton";
import { useRef } from "react";

const HIGH_CONTRAST_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#484848" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffcc00" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d47a1" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

const INITIAL_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function GoogleMapsScreen() {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    // Only track view changes briefly to render the emoji, then stop to save performance
    // and prevent Android rendering issues
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<AccessibleLocation | null>(null);
  const { location, status, requestPermission, refreshLocation } =
    useLocationPermission();

  const filtered =
    activeCategory === "all"
      ? MOCK_LOCATIONS
      : MOCK_LOCATIONS.filter((l) => l.category === activeCategory);

  const handleLocateMe = async () => {
    let currentStatus = status;
    let targetLoc = location;

    if (currentStatus !== "granted") {
      const newLoc = await requestPermission();
      if (newLoc) {
        targetLoc = newLoc;
        currentStatus = "granted";
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
        "LocateMe moving Google map to:",
        targetLoc.coords.latitude,
        targetLoc.coords.longitude,
      );

      // Delay slightly in case render cycle blocks animation
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: targetLoc.coords.latitude,
            longitude: targetLoc.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          },
          1000,
        );
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
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={
            location
              ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }
              : INITIAL_REGION
          }
          showsUserLocation={status === "granted"}
          customMapStyle={HIGH_CONTRAST_STYLE}
          clusterColor="#1565C0"
          radius={40}
        >
          {filtered.map((loc) => (
            <Marker
              key={loc.id}
              tracksViewChanges={tracksViewChanges}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              onPress={() => setSelected(loc)}
            >
              <AccessibilityPin category={loc.category} />
            </Marker>
          ))}
        </MapView>
        <LocateButton onPress={handleLocateMe} bottomOffset={16} />
      </View>
      <DetailSheet location={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}
