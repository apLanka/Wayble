import * as Linking from "expo-linking";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { PermissionStatus } from "expo-location";

import { PlaceListItem } from "@/components/map/PlaceListItem";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { NearbyPlace } from "@/hooks/use-nearby-places";

interface HomeNearbySectionProps {
  places: NearbyPlace[];
  isLoading: boolean;
  status: PermissionStatus | null;
  onRequestPermission: () => void;
  onPlacePress: (place: NearbyPlace) => void;
  onOpenMap: () => void;
}

export function HomeNearbySection({
  places,
  isLoading,
  status,
  onRequestPermission,
  onPlacePress,
  onOpenMap,
}: HomeNearbySectionProps) {
  const { appTheme } = useAppTheme();

  if (status !== "granted" && !isLoading) {
    const isDenied = status === "denied";

    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: appTheme.colors.border,
          },
        ]}
      >
        <AppText variant="bodyStrong">Location needed</AppText>
        <AppText style={{ color: appTheme.colors.textMuted }}>
          Enable location to see nearby accessible places.
        </AppText>
        <TouchTarget
          onPress={
            isDenied ? () => Linking.openSettings() : onRequestPermission
          }
          accessibilityRole="button"
          accessibilityLabel={
            isDenied ? "Open settings for location" : "Enable location"
          }
          style={[
            styles.bannerButton,
            { backgroundColor: appTheme.colors.primary },
          ]}
        >
          <AppText
            variant="bodyStrong"
            style={{ color: appTheme.colors.onPrimary }}
          >
            {isDenied ? "Open Settings" : "Enable Location"}
          </AppText>
        </TouchTarget>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={appTheme.colors.primary} />
        <AppText style={{ color: appTheme.colors.textMuted }}>
          Finding nearby places…
        </AppText>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: appTheme.colors.border,
          },
        ]}
      >
        <AppText style={{ color: appTheme.colors.textMuted }}>
          No places found nearby. Explore the map to discover more.
        </AppText>
        <TouchTarget
          onPress={onOpenMap}
          accessibilityRole="button"
          accessibilityLabel="Open map"
          style={[
            styles.bannerButton,
            { backgroundColor: appTheme.colors.primary },
          ]}
        >
          <AppText
            variant="bodyStrong"
            style={{ color: appTheme.colors.onPrimary }}
          >
            Open Map
          </AppText>
        </TouchTarget>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.listCard,
        {
          backgroundColor: appTheme.colors.surface,
          borderColor: appTheme.colors.border,
        },
      ]}
    >
      {places.map((place, index) => (
        <View
          key={place._id}
          style={
            index < places.length - 1
              ? {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: appTheme.colors.border,
                }
              : undefined
          }
        >
          <PlaceListItem
            name={place.name}
            category={place.category}
            distance={place.distance}
            onPress={() => onPlacePress(place)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  bannerButton: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  centered: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyCard: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.md,
  },
  listCard: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
