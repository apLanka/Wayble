import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ConfidenceLevel } from "@packages/backend/convex/verifications";

type Props = {
  level: ConfidenceLevel;
  label: string;
  score?: number;
};

export function ConfidenceBadge({ level, label, score }: Props) {
  const { isDark } = useAppTheme();

  const getBadgeStyle = () => {
    switch (level) {
      case "high_confidence":
        return {
          bg: isDark ? "#174526" : "#E2F6EA",
          text: isDark ? "#9BE5B3" : "#0B6B3A",
          border: isDark ? "#287545" : "#A3E5BC",
          icon: "🛡️",
        };
      case "confirmed":
        return {
          bg: isDark ? "#1A3B28" : "#EBF7EF",
          text: isDark ? "#9BE5B3" : "#176B3A",
          border: isDark ? "#275F3E" : "#BBE5CE",
          icon: "✅",
        };
      case "verified":
        return {
          bg: isDark ? "#183638" : "#E3F7F8",
          text: isDark ? "#82E2E6" : "#007A82",
          border: isDark ? "#255659" : "#A2E8EC",
          icon: "✓",
        };
      case "disputed":
        return {
          bg: isDark ? "#481E1C" : "#FEECEB",
          text: isDark ? "#FFB4AB" : "#B3261E",
          border: isDark ? "#7A2E2A" : "#F8B7B3",
          icon: "⚠️",
        };
      case "under_review":
      default:
        return {
          bg: isDark ? "#3F3210" : "#FEF7E6",
          text: isDark ? "#F4C95D" : "#8F6600",
          border: isDark ? "#6E571C" : "#F9DE96",
          icon: "🔍",
        };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Confidence level: ${label}${score ? `, score ${score}%` : ""}`}
    >
      <AppText style={styles.icon} importantForAccessibility="no">
        {styleConfig.icon}
      </AppText>
      <AppText style={[styles.label, { color: styleConfig.text }]}>
        {label}
      </AppText>
      {score !== undefined && (
        <AppText style={[styles.score, { color: styleConfig.text }]}>
          {score}%
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  icon: {
    fontSize: 11,
    lineHeight: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  score: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.85,
    marginLeft: 1,
  },
});
