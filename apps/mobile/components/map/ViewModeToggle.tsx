import React from "react";
import { View, StyleSheet, Switch } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing } from "@/constants/theme";

interface ViewModeToggleProps {
  isListMode: boolean;
  onToggle: (value: boolean) => void;
}

export function ViewModeToggle({ isListMode, onToggle }: ViewModeToggleProps) {
  const { appTheme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: appTheme.colors.surface,
          borderBottomColor: appTheme.colors.border,
        },
      ]}
    >
      <AppText style={[styles.label, { color: appTheme.colors.text }]}>
        List View
      </AppText>
      <Switch
        value={isListMode}
        onValueChange={onToggle}
        trackColor={{
          false: appTheme.colors.border,
          true: appTheme.colors.primary,
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: isListMode }}
        accessibilityLabel="List View"
        accessibilityHint="Toggles between map and accessible list views"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
});
