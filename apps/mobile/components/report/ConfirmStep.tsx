import { StyleSheet, View } from "react-native";

import { AttributeRow } from "@/components/place/AttributeRow";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ReportDraft } from "./report-draft";
import { selectedAttributes } from "./report-draft";

type Props = {
  draft: ReportDraft;
  isSubmitting: boolean;
  onSubmit: () => void;
};

/**
 * Step 4 of the report wizard: read back everything before it is stored.
 *
 * Recaps with the same `AttributeRow` used on the place detail screen, so
 * what the user approves here is literally what they will see there.
 */
export function ConfirmStep({ draft, isSubmitting, onSubmit }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const attributes = selectedAttributes(draft);

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        Check your report
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        {draft.category} · {attributes.length} attribute
        {attributes.length === 1 ? "" : "s"}
      </AppText>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {attributes.map((attribute) => (
          <AttributeRow
            key={attribute.key}
            attributeKey={attribute.key}
            value={attribute.value}
            {...(attribute.note !== undefined && { note: attribute.note })}
          />
        ))}
      </View>

      {draft.summary.trim().length > 0 ? (
        <View style={styles.summaryBlock}>
          <AppText variant="label" style={{ color: colors.textMuted }}>
            Your note
          </AppText>
          <AppText
            style={{ color: colors.text }}
            accessibilityRole="text"
            accessibilityLabel={`Your note: ${draft.summary}`}
          >
            {draft.summary}
          </AppText>
        </View>
      ) : null}

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Submit report"
        accessibilityHint="Saves your accessibility report for this place."
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        disabled={isSubmitting}
        onPress={onSubmit}
        style={[
          styles.submit,
          { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 },
        ]}
      >
        <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
          {isSubmitting ? "Submitting…" : "Submit report"}
        </AppText>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryBlock: {
    gap: spacing.xs,
  },
  submit: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
