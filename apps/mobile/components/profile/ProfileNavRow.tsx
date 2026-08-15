import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface ProfileNavRowProps {
  title: string;
  subtitle: string;
  accessibilityHint?: string;
  onPress: () => void;
}

export function ProfileNavRow({
  title,
  subtitle,
  accessibilityHint,
  onPress,
}: ProfileNavRowProps) {
  const { appTheme } = useAppTheme();

  return (
    <TouchTarget
      accessibilityRole="button"
      accessibilityLabel={STRINGS.profile.navRowLabel(title, subtitle)}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: appTheme.colors.surface,
          borderColor: appTheme.colors.border,
        },
      ]}
    >
      <View style={styles.text}>
        <AppText variant="label">{title}</AppText>
        <AppText style={{ color: appTheme.colors.textMuted }}>
          {subtitle}
        </AppText>
      </View>
      <AppText
        variant="bodyStrong"
        style={{ color: appTheme.colors.textMuted }}
      >
        {STRINGS.common.chevron}
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
});
