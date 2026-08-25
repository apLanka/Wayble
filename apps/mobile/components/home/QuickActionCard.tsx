import { StyleSheet } from "react-native";

import { AppSymbol, type PlatformSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface QuickActionCardProps {
  label: string;
  symbol: PlatformSymbol;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
}

export function QuickActionCard({
  label,
  symbol,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: QuickActionCardProps) {
  const { appTheme } = useAppTheme();

  return (
    <TouchTarget
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        styles.card,
        {
          backgroundColor: appTheme.colors.surface,
          borderColor: appTheme.colors.border,
        },
      ]}
    >
      <AppSymbol name={symbol} size={28} tintColor={appTheme.colors.primary} />
      <AppText variant="bodyStrong">{label}</AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
