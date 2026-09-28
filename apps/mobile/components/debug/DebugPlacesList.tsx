import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { PlaceCard, type DebugPlace } from "@/components/debug/PlaceCard";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

/**
 * Debug-only list of every place in the database.
 *
 * Deliberately independent of `useNearbyPlaces`: that hook skips its query
 * until the device has a location fix, so on a simulator without a simulated
 * location it shows nothing regardless of what is in the table. This reads
 * `places.listAll` straight, which needs no location, so it can confirm the
 * seed actually wrote rows.
 */
export function DebugPlacesList() {
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const places = useQuery(api.places.listAll, {});

  if (places === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ color: colors.textMuted }}>Loading places…</AppText>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View style={styles.centered}>
        <AppText
          accessibilityRole="text"
          style={{ color: colors.textMuted, textAlign: "center" }}
        >
          No places in the database. Use “Load all places” on the debug screen
          first.
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={places}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <AppText variant="title" accessibilityRole="header">
          {places.length} {places.length === 1 ? "place" : "places"}
        </AppText>
      }
      renderItem={({ item }) => (
        <PlaceCard
          place={item as DebugPlace}
          onPress={(place) =>
            router.push({
              pathname: "/place/[id]",
              params: { id: place._id },
            })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
});
