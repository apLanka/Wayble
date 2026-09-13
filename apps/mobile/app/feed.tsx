import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { FeedCard } from "@/components/feed/FeedCard";
import { SubmitVerificationModal } from "@/components/feed/SubmitVerificationModal";
import { spacing, radii } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";
import {
  useLiveActivityFeed,
  type VerificationFeedItem,
} from "@/hooks/use-live-activity-feed";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

export default function FeedScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string }>();
  const { appTheme, isDark } = useAppTheme();

  const [scope, setScope] = useState<"nearby" | "all">("nearby");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const { locations } = useNearbyPlaces();

  // Extract nearby place IDs for region scoping
  const nearbyPlaceIds = useMemo(() => {
    if (!locations || locations.length === 0) return undefined;
    return locations.map((l) => l._id as Id<"places">);
  }, [locations]);

  // Hook handles live WebSocket updates and AccessibilityInfo.announceForAccessibility
  const { items, isLoading } = useLiveActivityFeed({
    placeId: placeId ? (placeId as Id<"places">) : undefined,
    placeIds: scope === "nearby" && !placeId ? nearbyPlaceIds : undefined,
    enableA11yAnnouncements: true,
  });

  const placesForModal = useMemo(() => {
    if (!locations) return [];
    return locations.map((l) => ({ _id: l._id, name: l.name }));
  }, [locations]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Live Activity Feed",
          headerRight: () => (
            <TouchTarget
              onPress={() => setIsSubmitModalOpen(true)}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Verify a place"
              accessibilityHint="Opens verification submission dialog"
            >
              <View
                style={[
                  styles.headerPill,
                  { backgroundColor: appTheme.colors.primary },
                ]}
              >
                <AppText
                  style={[
                    styles.headerPillText,
                    { color: appTheme.colors.onPrimary },
                  ]}
                >
                  + Verify
                </AppText>
              </View>
            </TouchTarget>
          ),
        }}
      />

      <Screen style={styles.screen}>
        {/* ── Top Bar: Live Status & Filter Scope ─────────────── */}
        <View style={styles.controlsSection}>
          {/* Live WebSocket Status Banner */}
          <View
            style={[
              styles.liveIndicatorRow,
              {
                backgroundColor: isDark ? "#143D22" : "#E8F7EE",
                borderColor: isDark ? "#287545" : "#A3E5BC",
              },
            ]}
            accessible
            accessibilityRole="text"
            accessibilityLabel="Live updates active. New verifications will appear automatically without refreshing."
          >
            <View style={styles.pulseDot} />
            <AppText
              style={[
                styles.liveIndicatorText,
                { color: isDark ? "#9BE5B3" : "#0B6B3A" },
              ]}
            >
              LIVE UPDATES ACTIVE
            </AppText>
            <AppText
              style={[
                styles.liveSubtext,
                { color: isDark ? "#B9C7BE" : "#425248" },
              ]}
            >
              • No refresh needed
            </AppText>
          </View>

          {/* Scope Segmented Control (only when not filtered by single placeId) */}
          {!placeId && (
            <View
              style={[
                styles.segmentedContainer,
                {
                  backgroundColor: isDark
                    ? appTheme.colors.surfaceElevated
                    : "#EAEFEA",
                },
              ]}
            >
              <TouchTarget
                onPress={() => setScope("nearby")}
                style={styles.segmentTarget}
                accessibilityRole="button"
                accessibilityLabel="Show nearby verifications"
                accessibilityState={{ selected: scope === "nearby" }}
              >
                <View
                  style={[
                    styles.segmentOption,
                    scope === "nearby" && [
                      styles.activeSegment,
                      { backgroundColor: appTheme.colors.surface },
                    ],
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    style={{
                      color:
                        scope === "nearby"
                          ? appTheme.colors.primary
                          : appTheme.colors.textMuted,
                      fontSize: 13,
                    }}
                  >
                    📍 Nearby Region
                  </AppText>
                </View>
              </TouchTarget>

              <TouchTarget
                onPress={() => setScope("all")}
                style={styles.segmentTarget}
                accessibilityRole="button"
                accessibilityLabel="Show all community verifications"
                accessibilityState={{ selected: scope === "all" }}
              >
                <View
                  style={[
                    styles.segmentOption,
                    scope === "all" && [
                      styles.activeSegment,
                      { backgroundColor: appTheme.colors.surface },
                    ],
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    style={{
                      color:
                        scope === "all"
                          ? appTheme.colors.primary
                          : appTheme.colors.textMuted,
                      fontSize: 13,
                    }}
                  >
                    🌐 All Places
                  </AppText>
                </View>
              </TouchTarget>
            </View>
          )}
        </View>

        {/* ── Feed List ───────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <AppText
              style={[styles.loadingText, { color: appTheme.colors.textMuted }]}
            >
              Connecting to live verification feed…
            </AppText>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyIcon}>📢</AppText>
            <AppText
              variant="title"
              style={[styles.emptyTitle, { color: appTheme.colors.text }]}
            >
              No Verifications Yet
            </AppText>
            <AppText
              style={[
                styles.emptyDescription,
                { color: appTheme.colors.textMuted },
              ]}
            >
              {scope === "nearby"
                ? "No recent verifications found in your current map region. Try switching to 'All Places' or be the first to verify a nearby space!"
                : "No accessibility verifications recorded yet. Submit the first verification below!"}
            </AppText>

            <TouchTarget
              onPress={() => setIsSubmitModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Verify a place now"
            >
              <View
                style={[
                  styles.ctaButton,
                  { backgroundColor: appTheme.colors.primary },
                ]}
              >
                <AppText
                  variant="bodyStrong"
                  style={{ color: appTheme.colors.onPrimary }}
                >
                  Verify a Place Now
                </AppText>
              </View>
            </TouchTarget>
          </View>
        ) : (
          <FlatList<VerificationFeedItem>
            data={items}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <FeedCard item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            accessibilityLabel="Live activity verification list"
          />
        )}
      </Screen>

      {/* Verification submission modal for instant testing & community contributions */}
      <SubmitVerificationModal
        visible={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        defaultPlaceId={placeId as Id<"places">}
        placesList={placesForModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  headerPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  controlsSection: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#176B3A",
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  liveSubtext: {
    fontSize: 12,
  },
  segmentedContainer: {
    flexDirection: "row",
    borderRadius: radii.pill,
    padding: 3,
  },
  segmentTarget: {
    flex: 1,
  },
  segmentOption: {
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  activeSegment: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
});
