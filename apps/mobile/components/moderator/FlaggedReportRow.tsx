import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type FlagReasonKey =
  "inaccurate" | "spam" | "abusive" | "privacy" | "duplicate" | "other";

/** Same wording as the reporter's picker in `ReportCardMenu`. */
export const FLAG_REASON_LABELS: Record<FlagReasonKey, string> = {
  inaccurate: STRINGS.place.reportMenu.reasons.inaccurate,
  spam: STRINGS.place.reportMenu.reasons.spam,
  abusive: STRINGS.place.reportMenu.reasons.abusive,
  privacy: STRINGS.place.reportMenu.reasons.privacy,
  duplicate: STRINGS.place.reportMenu.reasons.duplicate,
  other: STRINGS.place.reportMenu.reasons.other,
};

/** One entry from `moderation.getFlaggedReports`, as this row reads it. */
export type FlaggedReport = {
  reportId: string;
  placeName: string;
  summary?: string;
  flagCount: number;
  reasons: FlagReasonKey[];
};

type Props = {
  item: FlaggedReport;
  onDismiss: (item: FlaggedReport) => void;
  onRemove: (item: FlaggedReport) => void;
};

/**
 * One flagged report: where, what was said, why it was flagged, how often.
 * Owns no query state — both buttons report intent upward, and the screen
 * confirms the decision (with an optional note) in `ResolveDialog`.
 */
export function FlaggedReportRow({ item, onDismiss, onRemove }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const reasons = item.reasons
    .map((reason) => FLAG_REASON_LABELS[reason])
    .join(", ");
  const count = STRINGS.moderator.row.flagCount(item.flagCount);
  const summary = item.summary ?? STRINGS.moderator.row.noSummary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        accessible
        accessibilityLabel={STRINGS.moderator.row.summaryLabel(
          item.placeName,
          summary,
          reasons,
          count,
        )}
        style={styles.info}
      >
        <View style={styles.header}>
          <AppText
            variant="bodyStrong"
            style={[styles.placeName, { color: colors.text }]}
          >
            {item.placeName}
          </AppText>
          <AppText variant="label" style={{ color: colors.danger }}>
            {count}
          </AppText>
        </View>
        <AppText
          style={{ color: item.summary ? colors.text : colors.textMuted }}
        >
          {summary}
        </AppText>
        <AppText variant="label" style={{ color: colors.textMuted }}>
          {STRINGS.moderator.row.reason(reasons)}
        </AppText>
      </View>

      <View style={styles.actions}>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={STRINGS.moderator.row.dismissLabel(
            item.placeName,
          )}
          onPress={() => onDismiss(item)}
          style={[styles.button, { borderColor: colors.primary }]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.primary }}>
            {STRINGS.moderator.row.dismiss}
          </AppText>
        </TouchTarget>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={STRINGS.moderator.row.removeLabel(item.placeName)}
          onPress={() => onRemove(item)}
          style={[styles.button, { borderColor: colors.danger }]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.danger }}>
            {STRINGS.moderator.row.remove}
          </AppText>
        </TouchTarget>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  info: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  placeName: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
