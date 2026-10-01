import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import {
  PLACE_CATEGORY_LABELS,
  PLACE_CATEGORY_COLORS,
} from "@/constants/accessibility-metadata";
import { STRINGS } from "@/constants/strings";

type Props = {
  category: string;
};

/**
 * Reusable pill badge displaying a human-readable place category.
 * Color-coded by category.
 */
export function CategoryBadge({ category }: Props) {
  const label = PLACE_CATEGORY_LABELS[category] ?? category;
  const bgColor = PLACE_CATEGORY_COLORS[category] ?? "#616161";

  return (
    <View
      style={[styles.badge, { backgroundColor: bgColor }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={STRINGS.map.categoryLabel(label)}
    >
      <AppText style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
