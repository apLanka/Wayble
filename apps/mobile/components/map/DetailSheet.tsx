import React, { useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import type { AccessibleLocation } from "../../data/mock-data";
import { CATEGORY_COLORS } from "./CategoryFilter";

type Props = {
  location: AccessibleLocation | null;
  /** Optional Convex place ID for navigating to the full detail screen. */
  placeId?: string;
  onClose: () => void;
};

const SNAP_POINTS = ["40%"];

export default function DetailSheet({ location, placeId, onClose }: Props) {
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
      index={-1}
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
                { backgroundColor: CATEGORY_COLORS[location.category] },
              ]}
            >
              <Text style={styles.badgeText}>{location.category}</Text>
            </View>
            <Text style={styles.address}>{location.address}</Text>
            {location.features.map((f) => (
              <Text key={f} style={styles.feature}>
                ✓ {f}
              </Text>
            ))}

            {/* View Details navigation link */}
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
  feature: {
    fontSize: 14,
    marginBottom: 4,
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
