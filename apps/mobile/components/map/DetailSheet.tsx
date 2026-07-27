import React, { useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { AccessibleLocation } from "../../data/mock-data";
import { CATEGORY_COLORS } from "./CategoryFilter";

type Props = {
  location: AccessibleLocation | null;
  onClose: () => void;
};

const ACCESSIBILITY_EMOJIS = {
  wheelchair: "♿️",
  elevator: "🛗",
  bathroom: "🚻",
  multi: "🌟",
};

const SNAP_POINTS = ["40%"];

export function DetailSheet({ location, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);

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
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    CATEGORY_COLORS[
                      (location.category in CATEGORY_COLORS
                        ? location.category
                        : "all") as keyof typeof CATEGORY_COLORS
                    ],
                },
              ]}
            >
              <Text style={styles.badgeText}>{location.category}</Text>
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
});
