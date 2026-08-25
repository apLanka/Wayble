import { StyleSheet } from "react-native";

import { AppSymbol, HOME_SYMBOLS } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface SearchEntryProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchEntry({
  onPress,
  placeholder = "Search accessible places…",
}: SearchEntryProps) {
  const { appTheme } = useAppTheme();

  return (
    <TouchTarget
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Search accessible places"
      accessibilityHint="Opens map search"
      style={[
        styles.container,
        {
          backgroundColor: appTheme.colors.surface,
          borderColor: appTheme.colors.border,
        },
      ]}
    >
      <AppSymbol
        name={HOME_SYMBOLS.search}
        size={18}
        tintColor={appTheme.colors.textMuted}
        style={styles.icon}
      />
      <AppText style={{ color: appTheme.colors.textMuted, flex: 1 }}>
        {placeholder}
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing.sm,
  },
});
