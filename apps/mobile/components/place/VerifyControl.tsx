import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  tallySummary,
  type VerificationTally,
  type Verdict,
} from "./verification-tally";

type Props = {
  reportId: string;
  tally: VerificationTally;
  /** True for the signed-in user's own report. The server rejects these
   *  regardless; the control shows the reason rather than vanishing, because
   *  a control that silently disappears reads as a bug. */
  disabled: boolean;
  disabledReason: string;
  onVote: (reportId: string, verdict: Verdict) => void;
};

/**
 * The label names the outcome already reached, the action names what tapping
 * will do. They are different strings because a screen-reader user hears
 * `action`, and a sighted user reads `label`.
 */
const VERDICTS: { verdict: Verdict; label: string; action: string }[] = [
  {
    verdict: "confirm",
    label: STRINGS.place.verification.confirmed,
    action: STRINGS.place.verification.confirmLabel,
  },
  {
    verdict: "dispute",
    label: STRINGS.place.verification.disputed,
    action: STRINGS.place.verification.disputeLabel,
  },
];

/**
 * Lets the signed-in user confirm or dispute an accessibility report.
 *
 * Owns no tally arithmetic: it reads the tally it is handed and reports the
 * user's intent upward through `onVote`. The optimistic patch belongs to the
 * screen, which is the only place that holds the Convex query result.
 */
export function VerifyControl({
  reportId,
  tally,
  disabled,
  disabledReason,
  onVote,
}: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {VERDICTS.map(({ verdict, label, action }) => {
          const selected = tally.myVerdict === verdict;
          return (
            <TouchTarget
              key={verdict}
              accessibilityRole="button"
              // The label names the outcome, not the control, so a screen
              // reader user hears what tapping will do.
              accessibilityLabel={action}
              accessibilityHint={STRINGS.place.verification.voteHint}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              // The two states sit on different backgrounds and need different
              // ring colours: `focus` reads on surfaceElevated (5.98:1 light,
              // 6.40:1 dark), `onPrimary` reads on primary (6.61:1 light, 9.98:1
              // dark). Neither clears the 3:1 of WCAG 1.4.11 on the other's
              // background, so the ring has to follow the state.
              focusColor={selected ? colors.onPrimary : undefined}
              onPress={() => onVote(reportId, verdict)}
              style={[
                styles.button,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: selected ? colors.primary : colors.border,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <AppText
                variant="bodyStrong"
                style={{ color: selected ? colors.onPrimary : colors.text }}
              >
                {label}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>

      {/* One text node, so the tally is announced as a sentence rather than
          two loose numbers. Colour is never the only signal: the pressed
          styling above is joined by accessibilityState. */}
      <AppText
        accessibilityRole="text"
        variant="label"
        style={{ color: colors.textMuted }}
      >
        {disabled ? disabledReason : tallySummary(tally)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
