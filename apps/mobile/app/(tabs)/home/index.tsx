import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter, type Href } from "expo-router";
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
import { STRINGS } from "@/constants/strings";
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

  const openActivityFeed = useCallback(() => {
    // Cast: Expo regenerates the typed-route list while Metro runs and can
    // transiently omit a newly added route, which would fail check-types.
    router.push("/feed" as Href);
  }, [router]);

  const openMapWithSearch = useCallback(() => {
    router.push({
      pathname: "/mapbox",
      params: { focusSearch: "true" },
    });
  }, [router]);

  const openMapNearMe = useCallback(() => {
    router.push({
      pathname: "/mapbox",
      params: { nearMe: "true" },
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
        accessibilityLabel={STRINGS.home.a11y.screen}
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
          <SectionHeader title={STRINGS.home.quickActionsTitle} />
          <View style={styles.quickActions}>
            <QuickActionCard
              label={STRINGS.home.openMap}
              symbol={HOME_SYMBOLS.openMap}
              accessibilityLabel={STRINGS.home.a11y.openMapLabel}
              accessibilityHint={STRINGS.home.a11y.openMapHint}
              onPress={openMap}
            />
            <QuickActionCard
              label={STRINGS.home.nearMe}
              symbol={HOME_SYMBOLS.nearMe}
              accessibilityLabel={STRINGS.home.a11y.nearMeLabel}
              accessibilityHint={STRINGS.home.a11y.nearMeHint}
              onPress={openMapNearMe}
            />
            <QuickActionCard
              label="Activity"
              symbol={{ ios: "person.2.fill", android: "group" }}
              accessibilityLabel="Nearby verification activity"
              accessibilityHint="Opens a live feed of verifications near you"
              onPress={openActivityFeed}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title={STRINGS.home.browseByNeedTitle} />
          <CategoryShortcuts onSelectCategory={openMapWithCategory} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={STRINGS.home.nearbyTitle}
            actionLabel={STRINGS.home.seeAll}
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
