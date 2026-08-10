import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { useAppTheme } from "@/hooks/use-app-theme";
import { CATEGORY_COLORS } from "./CategoryFilter";
import { formatDistance } from "@/utils/format-distance";
import { radii, spacing } from "@/constants/theme";

interface PlaceListItemProps {
  name: string;
  category: string;
  distance?: number;
  onPress: () => void;
}

export function PlaceListItem({
  name,
  category,
  distance,
  onPress,
}: PlaceListItemProps) {
  const { appTheme } = useAppTheme();

  const categoryColor =
    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
    appTheme.colors.primary;
  const distanceStr = distance !== undefined ? formatDistance(distance) : "";

  // Combine into a single label so screen readers read it continuously.
  const a11yLabel = `${name}, ${category}${distanceStr ? `, ${distanceStr} away` : ""}`;

  return (
    <TouchTarget
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={[
        styles.container,
        {
          backgroundColor: appTheme.colors.surface,
          borderBottomColor: appTheme.colors.border,
        },
      ]}
    >
      <View style={styles.leftContent}>
        <View
          style={[styles.categoryDot, { backgroundColor: categoryColor }]}
          importantForAccessibility="no"
        />
        <View style={styles.textContainer}>
          <AppText style={styles.name} numberOfLines={1}>
            {name}
          </AppText>
          <AppText
            style={[styles.category, { color: appTheme.colors.textMuted }]}
            numberOfLines={1}
          >
            {category}
          </AppText>
        </View>
      </View>
      {distanceStr ? (
        <AppText
          style={[styles.distance, { color: appTheme.colors.textMuted }]}
        >
          {distanceStr}
        </AppText>
      ) : null}
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  distance: {
    fontSize: 14,
  },
});
