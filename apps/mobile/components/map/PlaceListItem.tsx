import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { useAppTheme } from "@/hooks/use-app-theme";
import { CATEGORY_COLORS } from "./CategoryFilter";
import { formatDistance } from "@/utils/format-distance";
import { radii, spacing } from "@/constants/theme";
import type { MatchExplanation } from "@/utils/rank-places";

interface PlaceListItemProps {
  name: string;
  category: string;
  distance?: number;
  /** US-16: why this row sits where it does. Omitted when not ranking. */
  matchExplanation?: MatchExplanation | null;
  onPress: () => void;
}

export function PlaceListItem({
  name,
  category,
  distance,
  matchExplanation,
  onPress,
}: PlaceListItemProps) {
  const { appTheme } = useAppTheme();

  const categoryColor =
    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
    appTheme.colors.primary;
  const distanceStr = distance !== undefined ? formatDistance(distance) : "";

  // Combine into a single label so screen readers read it continuously. The
  // match reason is appended rather than given its own node, so the row stays
  // one stop for a screen reader and the reason is heard with the place.
  const a11yLabel = `${name}, ${category}${distanceStr ? `, ${distanceStr} away` : ""}${matchExplanation ? `. ${matchExplanation.accessibilityLabel}` : ""}`;

  return (
    <TouchTarget
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens this place's accessibility details"
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
          {/* Name and category wrap rather than truncate (WCAG 1.4.4): at
              large text sizes a one-line cap cuts the place's own name. */}
          <AppText style={styles.name}>{name}</AppText>
          <AppText
            style={[styles.category, { color: appTheme.colors.textMuted }]}
          >
            {category}
          </AppText>
          {matchExplanation ? (
            <View
              style={[
                styles.matchChip,
                { backgroundColor: appTheme.colors.surfaceElevated },
              ]}
            >
              <AppText
                style={[styles.matchText, { color: appTheme.colors.text }]}
              >
                {matchExplanation.short}
              </AppText>
            </View>
          ) : null}
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
  matchChip: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  matchText: {
    fontSize: 13,
  },
});
