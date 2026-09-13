import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { CategoryShortcuts } from "@/components/home/CategoryShortcuts";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeNearbySection } from "@/components/home/HomeNearbySection";
import { QuickActionCard } from "@/components/home/QuickActionCard";
import { SearchEntry } from "@/components/home/SearchEntry";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HOME_SYMBOLS } from "@/components/ui/app-symbol";
import type { Category } from "@/components/map/CategoryFilter";
import { Screen } from "@/components/ui/screen";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";

const { width } = Dimensions.get("window");
const NEARBY_PREVIEW_LIMIT = 5;

export default function HomeScreen() {
  const { appTheme, isDark } = useAppTheme();
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);
  const [refreshing, setRefreshing] = useState(false);

  const { status, isLoading, requestPermission, refreshLocation, locations } =
    useNearbyPlaces();

  const nearbyPreview = useMemo(
    () => (locations ? locations.slice(0, NEARBY_PREVIEW_LIMIT) : []),
    [locations],
  );

  const isNearbyLoading =
    status === "granted" && (isLoading || locations === undefined);

  const displayName = currentUser?.displayName || currentUser?.name || null;

  const openMap = useCallback(() => {
    router.push("/mapbox");
  }, [router]);

  const openMapWithSearch = useCallback(() => {
    router.push({
      pathname: "/mapbox",
      params: { focusSearch: "true" },
    });
  }, [router]);

  const openMapWithCategory = useCallback(
    (category: Category) => {
      router.push({
        pathname: "/mapbox",
        params: { category },
      });
    },
    [router],
  );

  const openFeed = useCallback(() => {
    router.push("/feed");
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  }, [refreshLocation]);

  return (
    <Screen style={styles.screen}>
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          {
            backgroundColor: isDark
              ? appTheme.colors.primary + "18"
              : appTheme.colors.primary + "10",
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Wayble home"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={appTheme.colors.primary}
          />
        }
      >
        <HomeHeader displayName={displayName} />

        <SearchEntry onPress={openMapWithSearch} />

        <View style={styles.section}>
          <SectionHeader title="Quick actions" />
          <View style={styles.quickActions}>
            <QuickActionCard
              label="Open Map"
              symbol={HOME_SYMBOLS.openMap}
              accessibilityLabel="Open map"
              accessibilityHint="Opens the full map view"
              onPress={openMap}
            />
            <QuickActionCard
              label="Live Feed"
              symbol={HOME_SYMBOLS.feed}
              accessibilityLabel="Live activity feed"
              accessibilityHint="View live community accessibility verifications"
              onPress={openFeed}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Browse by need" />
          <CategoryShortcuts onSelectCategory={openMapWithCategory} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Nearby accessible places"
            actionLabel="See all"
            onActionPress={openMap}
          />
          <HomeNearbySection
            places={nearbyPreview}
            isLoading={isNearbyLoading}
            status={status}
            onRequestPermission={requestPermission}
            onPlacePress={(place) => router.push(`/place/${place._id}`)}
            onOpenMap={openMap}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: width * 0.1,
    right: width * 0.1,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
