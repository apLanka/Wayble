import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const { appTheme } = useAppTheme();

  return (
    <View style={styles.container}>
      <AppText variant="label" accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel && onActionPress ? (
        <TouchTarget
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.action}
        >
          <AppText
            variant="bodyStrong"
            style={{ color: appTheme.colors.primary }}
          >
            {actionLabel}
          </AppText>
        </TouchTarget>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  action: {
    paddingHorizontal: spacing.xs,
  },
});
