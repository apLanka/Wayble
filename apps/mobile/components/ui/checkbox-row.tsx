import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type CheckboxRowProps = {
  /** Visible text label. Required — rows are never icon-only. */
  label: string;
  /** Optional decorative emoji shown beside the label. */
  icon?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Spoken instead of `label` when the label alone lacks context. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * A single accessible checkbox row.
 *
 * Announced to screen readers as a checkbox with its checked state, so the
 * visual tick is never the only indication of selection. The tick is paired
 * with a colour change and the whole row is one 44pt-minimum touch target.
 */
export function CheckboxRow({
  label,
  icon,
  checked,
  onToggle,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: CheckboxRowProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <TouchTarget
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onToggle}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : "transparent",
          },
        ]}
      >
        {checked ? (
          <AppText
            variant="bodyStrong"
            style={[styles.tick, { color: colors.onPrimary }]}
          >
            ✓
          </AppText>
        ) : null}
      </View>

      {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}

      <AppText
        style={[
          styles.label,
          { color: disabled ? colors.textMuted : colors.text },
        ]}
        numberOfLines={2}
      >
        {label}
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    fontSize: 14,
    lineHeight: 18,
  },
  icon: {
    fontSize: 16,
    lineHeight: 20,
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
});
