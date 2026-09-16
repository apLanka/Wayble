import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { REPORT_STEPS } from "./report-draft";

/**
 * The display name for each `REPORT_STEPS` entry.
 *
 * Exported so the wizard route announces the same words this indicator
 * shows, rather than keeping a second copy of the map that could drift out
 * of step with the labels on screen.
 */
export const STEP_TITLES: Record<string, string> = {
  category: "Category",
  attributes: "Attributes",
  notes: "Notes",
  confirm: "Confirm",
};

type Props = {
  /** Zero-based index into REPORT_STEPS. */
  step: number;
};

/**
 * "Step 2 of 4 — Attributes" plus a four-segment bar.
 *
 * Exposed as a single `progressbar` element so a screen reader announces
 * "step 2 of 4" once, rather than reading four disconnected segments. The
 * visible text carries the same information, so the bar is never the only
 * signal.
 *
 * `accessibilityLabel` states the position and `accessibilityValue.text`
 * carries only the step title, deliberately. With no explicit label, iOS
 * derives one recursively from the child text — which is already
 * "Step 2 of 4 — Attributes" — and then appends the value, so VoiceOver
 * would speak the position twice in two different punctuations. Splitting
 * them means each fact is spoken once: "Step 2 of 4, progress bar,
 * Attributes". This mirrors `AttributeRow`, which also composes an explicit
 * label rather than relying on derivation.
 */
export function StepIndicator({ step }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const position = step + 1;
  const title = STEP_TITLES[REPORT_STEPS[step] ?? ""] ?? "";

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${position} of ${REPORT_STEPS.length}`}
      accessibilityValue={{
        min: 1,
        max: REPORT_STEPS.length,
        now: position,
        text: title,
      }}
      style={styles.container}
    >
      <AppText
        variant="label"
        style={[styles.label, { color: colors.textMuted }]}
      >
        Step {position} of {REPORT_STEPS.length} — {title}
      </AppText>
      <View style={styles.track}>
        {REPORT_STEPS.map((name, index) => (
          <View
            key={name}
            style={[
              styles.segment,
              {
                backgroundColor: index <= step ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  label: {
    letterSpacing: 0.4,
  },
  track: {
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
  },
});
