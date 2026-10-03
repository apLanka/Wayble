import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import {
  ATTRIBUTE_ICON_EMOJI,
  ATTRIBUTE_METADATA,
  VALUE_LABELS,
  VALUE_SEMANTIC_COLORS,
} from "@/constants/accessibility-metadata";
import { spacing } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

type Props = {
  attributeKey: AccessibilityAttributeKey;
  value: string;
  note?: string;
};

/**
 * Renders a single accessibility attribute as a horizontal row.
 *
 * Layout: [Icon placeholder] [Label] ── [Value badge]
 * Icons are ALWAYS paired with a text label (never icon-only).
 */
export function AttributeRow({ attributeKey, value, note }: Props) {
  const { appTheme } = useAppTheme();
  const meta = ATTRIBUTE_METADATA[attributeKey];
  const valueLabel = VALUE_LABELS[value] ?? value;
  const semanticColor = VALUE_SEMANTIC_COLORS[value] ?? "textMuted";
  const badgeColor = appTheme.colors[semanticColor];

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={STRINGS.place.attributeLabel(
        meta.label,
        valueLabel,
        note || null,
      )}
    >
      <View style={styles.row}>
        {/* Emoji icon — always paired with the text label below */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: appTheme.colors.surfaceElevated },
          ]}
        >
          <AppText style={styles.iconText}>
            {ATTRIBUTE_ICON_EMOJI[attributeKey]}
          </AppText>
        </View>

        {/* Text label — always visible alongside icon */}
        {/* Label and note wrap rather than truncate (WCAG 1.4.4): at large
            text sizes a line cap cuts the very text the user enlarged. */}
        <AppText style={[styles.label, { color: appTheme.colors.text }]}>
          {meta.label}
        </AppText>

        {/* Value badge */}
        <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
          <AppText
            variant="label"
            style={[styles.badgeText, { color: badgeColor }]}
          >
            {valueLabel}
          </AppText>
        </View>
      </View>

      {/* Optional note */}
      {note ? (
        <AppText style={[styles.note, { color: appTheme.colors.textMuted }]}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  // Minimums so the emoji, which scales with text size, is not clipped.
  iconContainer: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
    lineHeight: 20,
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginLeft: 40, // Aligned with label (icon width + gap)
  },
});
