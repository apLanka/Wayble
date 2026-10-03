import React from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface ActivityStatsBarProps {
  totalCount: number;
  accessibleCount: number;
  partialCount: number;
  inaccessibleCount: number;
}

export function ActivityStatsBar({
  totalCount,
  accessibleCount,
  partialCount,
  inaccessibleCount,
}: ActivityStatsBarProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const issuesCount = partialCount + inaccessibleCount;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Activity summary: ${totalCount} visits logged, ${accessibleCount} fully accessible, ${issuesCount} with accessibility barriers or issues.`}
    >
      <View style={styles.statBox}>
        <AppText
          variant="title"
          style={[styles.statNumber, { color: colors.text }]}
        >
          {totalCount}
        </AppText>
        <AppText variant="label" style={{ color: colors.textMuted }}>
          Logged Visits
        </AppText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.statBox}>
        <AppText
          variant="title"
          style={[styles.statNumber, { color: colors.success }]}
        >
          {accessibleCount}
        </AppText>
        <AppText variant="label" style={{ color: colors.textMuted }}>
          Accessible
        </AppText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.statBox}>
        <AppText
          variant="title"
          style={[
            styles.statNumber,
            { color: issuesCount > 0 ? colors.warning : colors.textMuted },
          ]}
        >
          {issuesCount}
        </AppText>
        <AppText variant="label" style={{ color: colors.textMuted }}>
          Barriers/Partial
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 32,
  },
});
