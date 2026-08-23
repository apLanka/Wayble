import React, { useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
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

export default function DetailSheet({ location, placeId, onClose, onShowDirection }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const router = useRouter();

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
    >
      <BottomSheetView style={styles.content}>
        {location && (
          <>
            <View style={styles.header}>
              <Text style={styles.name}>{location.name}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.badge, { backgroundColor: "#6b7280" }]}>
              <Text style={styles.badgeText}>
                {location.category.replace(/_/g, " ")}
              </Text>
            </View>
            <Text style={styles.address}>{location.address}</Text>

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
                ).map((cat: string) => (
                  <View key={cat} style={styles.accessibilityTile}>
                    <Text style={styles.accessibilityEmoji}>
                      {ACCESSIBILITY_EMOJIS[
                        cat as keyof typeof ACCESSIBILITY_EMOJIS
                      ] || "✓"}
                    </Text>
                    <Text style={styles.accessibilityTileText}>{cat}</Text>
                  </View>
                ))}
              </View>
            )}

            {(location.features ?? []).map((f) => (
              <Text key={f} style={styles.feature}>
                ✓ {f}
              </Text>
            ))}

            {onShowDirection && (
              <TouchableOpacity
                style={styles.directionButton}
                onPress={onShowDirection}
              >
                <Text style={styles.directionButtonText}>
                  Show the direction
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewDetails}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View full accessibility details"
              accessibilityHint="Opens the full place detail screen with all accessibility attributes"
            >
              <Text style={styles.detailsButtonText}>View Details →</Text>
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
    color: "#666",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    textTransform: "capitalize",
  },
  address: {
    color: "#666",
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
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  accessibilityEmoji: {
    fontSize: 16,
  },
  accessibilityTileText: {
    fontSize: 12,
    color: "#4b5563",
    textTransform: "capitalize",
  },
  feature: {
    fontSize: 14,
    marginBottom: 4,
  },
  directionButton: {
    backgroundColor: "#0B6B3A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  directionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#0B6B3A",
    borderRadius: 10,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
