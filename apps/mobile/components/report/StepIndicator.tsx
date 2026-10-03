import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { STRINGS } from "@/constants/strings";
import { REPORT_STEPS, type ReportStep } from "./report-draft";

/**
 * The display name for each `REPORT_STEPS` entry.
 *
 * Annotated `Record<ReportStep, string>` rather than `string`, so renaming a
 * step id is a `tsc` error. Keyed on `string` it compiled silently: the lookup
 * missed and the route's forward announcement — which is gated on a non-empty
 * title — simply stopped firing, while the ungated callers still announced a
 * truncated "Step 2 of 4: ".
 *
 * The annotation preserves the *missing-key* half of that check. It does not
 * preserve the excess-key half: the value comes from a module, not a fresh
 * literal, so TypeScript applies no excess-property check here. A stale
 * `stepTitles` entry would therefore not be caught by `tsc` — the
 * `stepTitles` test in `strings.test.ts` pins the key set for that.
 */
const STEP_TITLES: Record<ReportStep, string> = STRINGS.report.stepTitles;

/**
 * The title for a zero-based step index, or `fallback` if the index is out of
 * range. Exported so the wizard route announces the same words this indicator
 * shows, rather than keeping a second copy of the map that could drift out of
 * step with the labels on screen.
 *
 * The out-of-range branch is reachable at runtime, not a compiler requirement:
 * `apps/mobile` does not enable `noUncheckedIndexedAccess`, so `REPORT_STEPS[n]`
 * is typed as a `ReportStep` whatever `n` is. `Array.prototype.at` types its
 * result as possibly `undefined`, which is what makes the branch honest.
 */
export function stepTitle(step: number, fallback = ""): string {
  const name = REPORT_STEPS.at(step);
  return name === undefined ? fallback : STEP_TITLES[name];
}

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
  // `step` is unconstrained by contract, and the route only ever passes a
  // reducer-clamped value, so this is not a guard against a known caller. It
  // is here so no future caller can display "Step 5 of 4": position, title
  // and the filled segments all read this one clamped index, so they cannot
  // disagree with each other.
  const index = Math.min(Math.max(step, 0), REPORT_STEPS.length - 1);
  const position = index + 1;
  const title = stepTitle(index);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={STRINGS.report.stepOf(position, REPORT_STEPS.length)}
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
        {STRINGS.report.stepOfWithTitle(position, REPORT_STEPS.length, title)}
      </AppText>
      <View style={styles.track}>
        {REPORT_STEPS.map((name, segment) => (
          <View
            key={name}
            style={[
              styles.segment,
              {
                backgroundColor:
                  segment <= index ? colors.primary : colors.border,
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
