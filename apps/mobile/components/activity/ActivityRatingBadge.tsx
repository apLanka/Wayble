import React from "react";
import { StyleSheet, View } from "react-native";

import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  ACTIVITY_RATING_CONFIGS,
  type ActivityRating,
} from "./activity-helpers";

type Props = {
  rating: ActivityRating;
};

export function ActivityRatingBadge({ rating }: Props) {
  const { appTheme } = useAppTheme();
  const config = ACTIVITY_RATING_CONFIGS[rating];
  const badgeColor = appTheme.colors[config.colorKey];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${badgeColor}18`,
          borderColor: `${badgeColor}40`,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Accessibility: ${config.label}`}
    >
      <AppSymbol name={config.symbolName} size={14} tintColor={badgeColor} />
      <AppText variant="label" style={[styles.label, { color: badgeColor }]}>
        {config.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
