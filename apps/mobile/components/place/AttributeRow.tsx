import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import {
  ATTRIBUTE_METADATA,
  VALUE_LABELS,
  VALUE_SEMANTIC_COLORS,
} from "@/constants/accessibility-metadata";
import { spacing } from "@/constants/theme";
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
      accessibilityLabel={`${meta.label}: ${valueLabel}${note ? `. Note: ${note}` : ""}`}
    >
      <View style={styles.row}>
        {/* Icon placeholder — uses text emoji as SF Symbols require native module */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: appTheme.colors.surfaceElevated },
          ]}
        >
          <AppText style={styles.iconText}>
            {getIconEmoji(attributeKey)}
          </AppText>
        </View>

        {/* Text label — always visible alongside icon */}
        <AppText
          style={[styles.label, { color: appTheme.colors.text }]}
          numberOfLines={2}
        >
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
        <AppText
          style={[styles.note, { color: appTheme.colors.textMuted }]}
          numberOfLines={3}
        >
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * Maps attribute keys to representative emoji for cross-platform icon rendering.
 * This avoids depending on expo-symbols native module availability at build time.
 */
function getIconEmoji(key: AccessibilityAttributeKey): string {
  const emojiMap: Partial<Record<AccessibilityAttributeKey, string>> = {
    "mobility.step_free_entrance": "♿",
    "mobility.wide_entrance": "🚪",
    "mobility.step_free_interior": "↔️",
    "mobility.elevator": "🛗",
    "mobility.accessible_restroom": "🚻",
    "mobility.accessible_parking": "🅿️",
    "mobility.wheelchair_seating": "💺",
    "vision.braille_signage": "⠿",
    "vision.tactile_guidance": "✋",
    "vision.high_contrast_signage": "👁️",
    "vision.visual_hazard_marking": "⚠️",
    "hearing.hearing_loop": "👂",
    "hearing.visual_alarms": "🔔",
    "communication.accessible_service_option": "💬",
    "sensory.clear_signage": "🪧",
    "sensory.quiet_space": "🔇",
    "sensory.low_stimulation_option": "🔅",
    "assistance.service_animals": "🐕",
    "assistance.staff_support": "👥",
  };
  return emojiMap[key] ?? "●";
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
  iconContainer: {
    width: 32,
    height: 32,
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
