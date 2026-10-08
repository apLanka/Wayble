import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
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
      accessibilityLabel={STRINGS.place.noData.label}
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
        {STRINGS.place.noData.title}
      </AppText>

      {/* Description */}
      <AppText
        style={[styles.description, { color: appTheme.colors.textMuted }]}
      >
        {STRINGS.place.noData.body}
      </AppText>

      {/* CTA button */}
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel={STRINGS.place.noData.buttonLabel}
        accessibilityHint={STRINGS.place.noData.buttonHint}
        onPress={onContribute}
        style={[styles.ctaButton, { backgroundColor: appTheme.colors.primary }]}
      >
        <AppText
          variant="bodyStrong"
          style={{ color: appTheme.colors.onPrimary }}
        >
          {STRINGS.place.noData.button}
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
