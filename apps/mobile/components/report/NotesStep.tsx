import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MAX_SUMMARY_LENGTH } from "@packages/backend/convex/reportLimits";
import { PhotoEvidencePicker } from "./PhotoEvidencePicker";
import type { DraftAction, ReportDraft } from "./report-draft";

type Props = {
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
  /** Seeds a new photo's default caption. */
  placeName: string | undefined;
};

/**
 * Step 3 of the report wizard: one optional sentence about the whole visit,
 * and an optional photo (US-09).
 *
 * The per-attribute notes were captured in step 2. Apart from the photo's
 * caption, this is the only free-text moment in the wizard, which keeps typing
 * to a single place for screen reader and switch-control users.
 */
export function NotesStep({ draft, dispatch, placeName }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  // `onChangeText` is the writer; `maxLength` below is the clamp. Nothing
  // else dispatches `setSummary`, and the reducer stores the text verbatim
  // without clamping, so the counter's non-negativity depends on this
  // component's `maxLength` holding. A second writer that bypassed the input
  // could make `remaining` negative.
  const remaining = MAX_SUMMARY_LENGTH - draft.summary.length;

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        {STRINGS.report.notes.title}
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        {STRINGS.report.notes.body}
      </AppText>

      <View style={styles.fieldBlock}>
        <AppText
          variant="label"
          nativeID="summary-label"
          style={{ color: colors.textMuted }}
        >
          {STRINGS.report.notes.titleLabel}
        </AppText>
        <TextInput
          value={draft.summary}
          onChangeText={(text) =>
            dispatch({ type: "setSummary", summary: text })
          }
          placeholder={STRINGS.report.notes.placeholder}
          placeholderTextColor={colors.textMuted}
          maxLength={MAX_SUMMARY_LENGTH}
          multiline
          accessibilityLabel={STRINGS.report.notes.summaryLabel}
          accessibilityLabelledBy="summary-label"
          accessibilityHint={STRINGS.report.notes.summaryHint(
            MAX_SUMMARY_LENGTH,
          )}
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

      {/* "N of 500 characters left" — the noun agrees with the total, so it is
          grammatical at every value without a conditional, and a screen reader
          hears the count change instead of only reading the cap from the hint.
          The live region is honoured on Android only (see the report). */}
      <View accessibilityLiveRegion="polite">
        <AppText
          variant="label"
          style={[styles.counter, { color: colors.textMuted }]}
        >
          {STRINGS.report.notes.charactersLeft(remaining, MAX_SUMMARY_LENGTH)}
        </AppText>
      </View>

      <PhotoEvidencePicker
        photo={draft.photo}
        placeName={placeName}
        dispatch={dispatch}
      />
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
