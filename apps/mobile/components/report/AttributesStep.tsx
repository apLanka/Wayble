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

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        {category} details
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        Set a value for each one. Leave anything you did not check blank.
      </AppText>

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
        accessibilityLabel={`${meta.label} value`}
        style={styles.values}
      >
        {REPORT_ATTRIBUTE_VALUES.map((value) => {
          const isSelected = current === value;
          return (
            <TouchTarget
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${meta.label}: ${VALUE_LABELS[value] ?? value}`}
              accessibilityHint="Double tap to set this value."
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
              ? "Add a note — required for Partial"
              : "Add a note (optional)"}
          </AppText>
          <TextInput
            value={note}
            onChangeText={(text) =>
              dispatch({ type: "setNote", key: attributeKey, note: text })
            }
            placeholder="What did you see?"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            accessibilityLabel={`Note for ${meta.label}`}
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
