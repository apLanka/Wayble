import React, { useRef, useCallback, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { AppText } from "@/components/ui/app-text";
import { STRINGS } from "@/constants/strings";
import { ConfidenceBadge } from "@/components/place/ConfidenceBadge";
import { useAppTheme } from "@/hooks/use-app-theme";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { AccessibleLocation } from "../../data/mock-data";

// Mock locations use ids like "loc-001" — not real Convex ids. Only query
// when placeId is a real place, else there's nothing to fetch confidence for.
const MOCK_ID_PREFIX = "loc-";

// Real fix for the tab-bar overlap: content was clipped/overflowing a fixed
// 40% snap point (BottomSheetView has flex:1, no scroll) — the "View
// Details" button spilled past the sheet's own bottom edge, into the
// floating tab bar's space. BottomSheetScrollView + dynamic sizing makes the
// sheet fit its content instead of clipping it. Sheet itself is anchored
// flush to the screen bottom (no `bottomInset`); this padding on the scroll
// content is what actually reserves room so the last button clears the
// floating tab bar.
const TAB_BAR_INSET = 100;

type Props = {
  location: AccessibleLocation | null;
  placeId?: string;
  onClose: () => void;
  onShowDirection?: () => void;
};

const ACCESSIBILITY_EMOJIS = {
  wheelchair: "♿️",
  elevator: "🛗",
  bathroom: "🚻",
  multi: "🌟",
};

export function DetailSheet({
  location,
  placeId,
  onClose,
  onShowDirection,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const router = useRouter();
  const { appTheme } = useAppTheme();

  useEffect(() => {
    if (location) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [location]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const handleViewDetails = useCallback(() => {
    const targetId = placeId ?? location?.id;
    if (!targetId || !location) return;
    // Use main global place details screen
    router.push({
      pathname: "/place/[id]",
      params: { id: targetId },
    });
  }, [placeId, location, router]);

  const realPlaceId = placeId ?? location?.id;
  const isRealPlace = !!realPlaceId && !realPlaceId.startsWith(MOCK_ID_PREFIX);
  const place = useQuery(
    api.places.getPlace,
    isRealPlace ? { placeId: realPlaceId as Id<"places"> } : "skip",
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={location ? 0 : -1}
      enableDynamicSizing
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: appTheme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: appTheme.colors.border }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          {
            backgroundColor: appTheme.colors.surface,
            paddingBottom: TAB_BAR_INSET,
          },
        ]}
      >
        {location && (
          <>
            <View style={styles.header}>
              <AppText
                style={[styles.name, { color: appTheme.colors.text }]}
                accessibilityRole="header"
              >
                {location.name}
              </AppText>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.map.detailSheet.closeLabel}
              >
                <AppText
                  style={[styles.close, { color: appTheme.colors.textMuted }]}
                >
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: appTheme.colors.primary + "20" },
              ]}
              accessible
              accessibilityRole="text"
              accessibilityLabel={STRINGS.map.categoryLabel(
                location.category.replace(/_/g, " "),
              )}
            >
              <AppText
                style={[styles.badgeText, { color: appTheme.colors.primary }]}
              >
                {location.category.replace(/_/g, " ")}
              </AppText>
            </View>

            {place && (
              <ConfidenceBadge
                tier={place.confidence.tier}
                isStale={place.confidence.isStale}
              />
            )}

            <AppText
              style={[styles.address, { color: appTheme.colors.textMuted }]}
            >
              {location.address}
            </AppText>

            {/* Accessibility badges */}
            {(
              (
                location as AccessibleLocation & {
                  accessibilityCategories?: string[];
                }
              ).accessibilityCategories ?? []
            ).length > 0 && (
              <View style={styles.accessibilityRow}>
                {(
                  (
                    location as AccessibleLocation & {
                      accessibilityCategories?: string[];
                    }
                  ).accessibilityCategories ?? []
                ).map((cat: string) => {
                  const label = STRINGS.map.categoryAccessible(
                    cat,
                    STRINGS.map.categoryLabels[
                      cat as keyof typeof STRINGS.map.categoryLabels
                    ] ?? null,
                  );
                  return (
                    <View
                      key={cat}
                      style={[
                        styles.accessibilityTile,
                        {
                          backgroundColor: appTheme.colors.surfaceElevated,
                          borderColor: appTheme.colors.border,
                        },
                      ]}
                      accessible
                      accessibilityRole="text"
                      accessibilityLabel={label}
                    >
                      <AppText style={styles.accessibilityEmoji}>
                        {ACCESSIBILITY_EMOJIS[
                          cat as keyof typeof ACCESSIBILITY_EMOJIS
                        ] || "✓"}
                      </AppText>
                      <AppText
                        style={[
                          styles.accessibilityTileText,
                          { color: appTheme.colors.text },
                        ]}
                      >
                        {cat}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            )}

            {(location.features ?? []).length > 0 && (
              <View style={styles.features}>
                {(location.features ?? []).map((f) => (
                  <AppText
                    key={f}
                    style={[styles.feature, { color: appTheme.colors.text }]}
                  >
                    ✓ {f}
                  </AppText>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              {onShowDirection && (
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    { backgroundColor: appTheme.colors.primary },
                  ]}
                  onPress={() => {
                    onShowDirection();
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={STRINGS.map.detailSheet.directionsLabel}
                  activeOpacity={0.7}
                >
                  <AppText
                    style={[
                      styles.directionButtonText,
                      { color: appTheme.colors.onPrimary },
                    ]}
                  >
                    {STRINGS.map.detailSheet.directionsButton}
                  </AppText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.detailsButton,
                  { backgroundColor: appTheme.colors.primary },
                ]}
                onPress={handleViewDetails}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.map.detailSheet.viewDetailsLabel}
                accessibilityHint={STRINGS.map.detailSheet.viewDetailsHint}
              >
                <AppText
                  style={[
                    styles.detailsButtonText,
                    { color: appTheme.colors.onPrimary },
                  ]}
                >
                  {STRINGS.map.detailSheet.viewDetailsButton}
                </AppText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const SPACING = 12;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: SPACING,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  close: {
    fontSize: 18,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
  },
  accessibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  accessibilityTile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  accessibilityEmoji: {
    fontSize: 16,
  },
  accessibilityTileText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  features: {
    gap: 4,
  },
  feature: {
    fontSize: 14,
  },
  actions: {
    gap: SPACING,
    marginTop: SPACING / 2,
  },
  directionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
