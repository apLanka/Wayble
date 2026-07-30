import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Props = {
  onContribute?: () => void;
};

/**
 * Explicit "no data yet" empty state that prompts a contribution.
 * Displayed when a place has no accessibility reports.
 */
export function NoDataPrompt({ onContribute }: Props) {
  const { appTheme } = useAppTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: appTheme.colors.surface }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel="No accessibility data available yet. Be the first to contribute."
    >
      {/* Illustration area */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: appTheme.colors.primary + "15" },
        ]}
      >
        <AppText style={styles.icon}>📋</AppText>
      </View>

      {/* Heading */}
      <AppText
        variant="bodyStrong"
        style={[styles.heading, { color: appTheme.colors.text }]}
      >
        No accessibility data yet
      </AppText>

      {/* Description */}
      <AppText
        style={[styles.description, { color: appTheme.colors.textMuted }]}
      >
        Be the first to contribute! Share what you know about this place's
        accessibility features to help others.
      </AppText>

      {/* CTA button */}
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Contribute accessibility info"
        accessibilityHint="Opens the accessibility report form for this place"
        onPress={onContribute}
        style={[styles.ctaButton, { backgroundColor: appTheme.colors.primary }]}
      >
        <AppText
          variant="bodyStrong"
          style={{ color: appTheme.colors.onPrimary }}
        >
          Contribute Accessibility Info
        </AppText>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    marginTop: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 32,
    lineHeight: 40,
  },
  heading: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
});
