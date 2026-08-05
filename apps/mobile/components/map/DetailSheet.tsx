import React, { useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { AccessibleLocation } from "../../data/mock-data";

type Props = {
  location: AccessibleLocation | null;
  onClose: () => void;
};

const CATEGORY_COLORS: Record<AccessibleLocation["category"], string> = {
  wheelchair: "#1565C0",
  elevator: "#2E7D32",
  bathroom: "#6A1B9A",
  multi: "#E65100",
};

const SNAP_POINTS = ["40%"];

export default function DetailSheet({ location, onClose }: Props) {
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
      index={-1}
      snapPoints={SNAP_POINTS}
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
});
