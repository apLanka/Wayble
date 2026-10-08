import Mapbox from "@rnmapbox/maps";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { STRINGS } from "@/constants/strings";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { DEFAULT_MAP_CENTER } from "@/constants/default-location";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
  /** Device location, used to centre the map and for "Use my location". */
  userLocation: PickedLocation | null;
}

/**
 * Pan the map under a fixed pin; the map centre is the picked location.
 * "Use my location" is also the non-visual way to fill it in.
 */
export function LocationPicker({
  value,
  onChange,
  userLocation,
}: LocationPickerProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const cameraRef = useRef<Mapbox.Camera>(null);
  const hasMoved = useRef(false);

  const flyTo = useCallback((loc: PickedLocation, animationDuration = 0) => {
    cameraRef.current?.setCamera({
      centerCoordinate: [loc.longitude, loc.latitude],
      zoomLevel: 16,
      animationDuration,
    });
  }, []);

  // Centre on the first location fix, unless the user already panned.
  useEffect(() => {
    if (userLocation && !hasMoved.current) flyTo(userLocation);
  }, [userLocation, flyTo]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.mapFrame, { borderColor: colors.border }]}
        accessibilityLabel={STRINGS.addPlace.picker.mapLabel}
      >
        <Mapbox.MapView
          style={styles.map}
          logoEnabled={false}
          scaleBarEnabled={false}
          onCameraChanged={(state) => {
            if (state.gestures.isGestureActive) hasMoved.current = true;
          }}
          onMapIdle={(state) => {
            const [longitude, latitude] = state.properties.center;
            onChange({ latitude, longitude });
          }}
        >
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: DEFAULT_MAP_CENTER,
              zoomLevel: 12,
            }}
          />
        </Mapbox.MapView>
        {/* Fixed pin: its tip sits on the map centre. */}
        <View pointerEvents="none" style={styles.pinWrap}>
          <AppText
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={styles.pin}
          >
            {PIN_EMOJI}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText
          variant="label"
          style={{ color: colors.textMuted, flex: 1 }}
          accessibilityLiveRegion="polite"
        >
          {value
            ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
            : STRINGS.addPlace.picker.empty}
        </AppText>
        {userLocation ? (
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel={STRINGS.addPlace.picker.useMyLocationLabel}
            onPress={() => {
              hasMoved.current = false;
              flyTo(userLocation, 600);
              onChange(userLocation);
            }}
            style={[
              styles.myLocation,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText variant="label" style={{ color: colors.text }}>
              {STRINGS.addPlace.picker.useMyLocation}
            </AppText>
          </TouchTarget>
        ) : null}
      </View>
    </View>
  );
}

const PIN_SIZE = 36;
// Iconography, not copy (hidden from screen readers).
const PIN_EMOJI = "📍";

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  mapFrame: {
    height: 260,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  pinWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    fontSize: PIN_SIZE,
    lineHeight: PIN_SIZE * 1.2,
    // Lift by half so the emoji's tip, not its middle, marks the centre.
    transform: [{ translateY: -PIN_SIZE / 2 }],
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  myLocation: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
});
