import React, { useRef, useCallback, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";

import { AppText } from "@/components/ui/app-text";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { AccessibleLocation } from "../../data/mock-data";

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

const SNAP_POINTS = ["40%"];

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
    if (targetId) {
      router.push(`/place/${targetId}` as never);
    }
  }, [placeId, location?.id, router]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={location ? 0 : -1}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: appTheme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: appTheme.colors.border }}
    >
      <BottomSheetView
        style={[styles.content, { backgroundColor: appTheme.colors.surface }]}
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

            {(location.features ?? []).map((f) => (
              <AppText
                key={f}
                style={[styles.feature, { color: appTheme.colors.text }]}
              >
                ✓ {f}
              </AppText>
            ))}

            {onShowDirection && (
              <TouchableOpacity
                style={[
                  styles.directionButton,
                  { backgroundColor: appTheme.colors.primary },
                ]}
                onPress={onShowDirection}
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
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
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
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    marginBottom: 10,
  },
  accessibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
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
  feature: {
    fontSize: 14,
    marginBottom: 4,
  },
  directionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsButton: {
    marginTop: 12,
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
