import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_SEMANTIC_COLORS,
} from "@/constants/confidence-metadata";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ConfidenceTier } from "@packages/backend/convex/confidence";

type Props = {
  tier: ConfidenceTier;
  isStale: boolean;
};

/**
 * Pill badge for a place's trust signal. Color + text always paired (never
 * color-only), matching AttributeRow.tsx's rule. Pill styling matches
 * CategoryBadge.tsx.
 */
export function ConfidenceBadge({ tier, isStale }: Props) {
  const { appTheme } = useAppTheme();
  const label = CONFIDENCE_LABELS[tier];
  const badgeColor = appTheme.colors[CONFIDENCE_SEMANTIC_COLORS[tier]];
  const text = isStale ? STRINGS.place.staleSuffix(label) : label;

  return (
    <View
      style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={STRINGS.place.confidenceLabel(text)}
    >
      <AppText variant="label" style={[styles.label, { color: badgeColor }]}>
        {text}
      </AppText>
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
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
