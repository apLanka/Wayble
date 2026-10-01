import { useMemo } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ATTRIBUTE_ICON_EMOJI,
  ATTRIBUTE_METADATA,
  ATTRIBUTE_KEYS_BY_CATEGORY,
  VALUE_LABELS,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MAX_NOTE_LENGTH } from "@packages/backend/convex/reportLimits";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";
import {
  REPORT_ATTRIBUTE_VALUES,
  missingRequiredNotes,
  type DraftAction,
  type ReportDraft,
} from "./report-draft";

type Props = {
  category: string;
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
};

/**
 * Step 2 of the report wizard: one row per attribute in the chosen group.
 *
 * A note field appears as soon as a value other than `yes` is chosen,
 * because "Partial" and "Not available" are useless to the next visitor
 * without a sentence explaining the situation. `missingRequiredNotes`
 * blocks the wizard on `partial` specifically — S0-5 requires that note.
 */
export function AttributesStep({ category, draft, dispatch }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const keys = useMemo(
    () => ATTRIBUTE_KEYS_BY_CATEGORY[category] ?? [],
    [category],
  );
  const missing = useMemo(() => missingRequiredNotes(draft), [draft]);
  // `missingRequiredNotes` spans all nineteen taxonomy keys, but this step
  // renders only the current group, so a partial left without a note in a
  // group the user has since navigated away from would disable Next with
  // nothing on screen saying why and the blocking attribute never rendered.
  const outstandingElsewhere = useMemo(
    () => missing.filter((key) => !keys.includes(key)),
    [missing, keys],
  );
  const elsewhereMessage = useMemo(
    () => describeOutstanding(outstandingElsewhere),
    [outstandingElsewhere],
  );

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        {category} details
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        {STRINGS.report.attributes.body}
      </AppText>

      {outstandingElsewhere.length > 0 ? (
        <AppText
          accessibilityRole="alert"
          style={[
            styles.banner,
            { color: colors.danger, borderColor: colors.danger },
          ]}
        >
          {elsewhereMessage}
        </AppText>
      ) : null}

      <View style={styles.list}>
        {keys.map((key) => (
          <AttributeEditor
            key={key}
            attributeKey={key}
            draft={draft}
            dispatch={dispatch}
            needsNote={missing.includes(key)}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * The banner's copy. It names the groups as well as the count, because the
 * blocking attribute is not rendered on this step, so the banner is the only
 * route the user has to the cause of the disabled Next button.
 */
function describeOutstanding(outstanding: AccessibilityAttributeKey[]): string {
  // Unreachable while the banner is gated on a non-empty list, but this
  // string is spoken aloud, so it must not be able to produce "undefined" if
  // a later edit renders it unconditionally — hence the count-first guard
  // inside the string helper, which returns "" for a count of zero.
  //
  // `missingRequiredNotes` walks the taxonomy in order, so the distinct groups
  // come out in a stable order without needing a sort. Working out *which*
  // groups is data logic and stays here; wording the sentence, including
  // English list joining, is in constants/strings.ts.
  const groups = [
    ...new Set(outstanding.map((key) => ATTRIBUTE_METADATA[key].category)),
  ];
  return STRINGS.report.attributes.outstandingNote(outstanding.length, groups);
}

type EditorProps = {
  attributeKey: AccessibilityAttributeKey;
  draft: ReportDraft;
  dispatch: (action: DraftAction) => void;
  needsNote: boolean;
};

function AttributeEditor({
  attributeKey,
  draft,
  dispatch,
  needsNote,
}: EditorProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const meta = ATTRIBUTE_METADATA[attributeKey];
  const current = draft.selected[attributeKey];
  const note = draft.notes[attributeKey] ?? "";
  const showNote = current !== undefined && current !== "yes";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText style={styles.icon}>
          {ATTRIBUTE_ICON_EMOJI[attributeKey]}
        </AppText>
        <AppText variant="bodyStrong" style={styles.headerLabel}>
          {meta.label}
        </AppText>
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={STRINGS.report.attributes.groupLabel(meta.label)}
        style={styles.values}
      >
        {REPORT_ATTRIBUTE_VALUES.map((value) => {
          const isSelected = current === value;
          return (
            <TouchTarget
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={STRINGS.report.attributes.valueAnnounce(
                meta.label,
                VALUE_LABELS[value] ?? value,
              )}
              // No value label here: the label above already ends in it, so
              // naming it again spoke every pill's value twice.
              accessibilityHint={
                isSelected
                  ? STRINGS.report.attributes.clearValueHint
                  : STRINGS.report.attributes.setValueHint
              }
              onPress={() =>
                dispatch(
                  isSelected
                    ? { type: "clearValue", key: attributeKey }
                    : { type: "setValue", key: attributeKey, value },
                )
              }
              style={[
                styles.valuePill,
                {
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{
                  color: isSelected ? colors.onPrimary : colors.text,
                }}
              >
                {isSelected ? "✓ " : ""}
                {VALUE_LABELS[value] ?? value}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>

      {showNote ? (
        <View style={styles.noteBlock}>
          <AppText
            variant="label"
            nativeID={`note-label-${attributeKey}`}
            style={{ color: needsNote ? colors.danger : colors.textMuted }}
          >
            {needsNote
              ? STRINGS.report.attributes.noteRequired
              : STRINGS.report.attributes.noteOptional}
          </AppText>
          <TextInput
            value={note}
            onChangeText={(text) =>
              dispatch({ type: "setNote", key: attributeKey, note: text })
            }
            placeholder={STRINGS.report.attributes.notePlaceholder}
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            accessibilityLabel={STRINGS.report.attributes.noteLabel(meta.label)}
            accessibilityLabelledBy={`note-label-${attributeKey}`}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: needsNote ? colors.danger : colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  banner: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  headerLabel: {
    flex: 1,
  },
  values: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  valuePill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: "center",
  },
  noteBlock: {
    gap: spacing.xs,
  },
  input: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 88,
    textAlignVertical: "top",
  },
});
