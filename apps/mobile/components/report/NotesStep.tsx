import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";
import type { DraftAction, ReportDraft } from "./report-draft";

type Props = {
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
};

/**
 * Step 3 of the report wizard: one optional sentence about the whole visit.
 *
 * The per-attribute notes were captured in step 2. This is the only free-text
 * moment in the wizard, which keeps typing to a single place for screen
 * reader and switch-control users.
 */
export function NotesStep({ draft, dispatch }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  // `maxLength` is the only writer of `draft.summary`, so this can never
  // fall below zero.
  const remaining = MAX_SUMMARY_LENGTH - draft.summary.length;

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        Anything to add?
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        One optional sentence about the whole visit. You can skip this.
      </AppText>

      <View style={styles.fieldBlock}>
        <AppText
          variant="label"
          nativeID="summary-label"
          style={{ color: colors.textMuted }}
        >
          Your summary (optional)
        </AppText>
        <TextInput
          value={draft.summary}
          onChangeText={(text) =>
            dispatch({ type: "setSummary", summary: text })
          }
          placeholder="For example: the side entrance is the only step-free way in."
          placeholderTextColor={colors.textMuted}
          maxLength={MAX_SUMMARY_LENGTH}
          multiline
          accessibilityLabel="Report summary"
          accessibilityLabelledBy="summary-label"
          accessibilityHint={`Optional. Up to ${MAX_SUMMARY_LENGTH} characters.`}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />
      </View>

      <AppText
        variant="label"
        style={[styles.counter, { color: colors.textMuted }]}
      >
        {remaining} characters remaining
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 140,
    // 16pt, as on every other text input in the app: below that, iOS zooms
    // the viewport on focus and the user loses their place in the wizard.
    fontSize: 16,
    textAlignVertical: "top",
  },
  counter: {
    textAlign: "right",
  },
});
