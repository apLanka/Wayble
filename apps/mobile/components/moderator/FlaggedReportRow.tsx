import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type FlagReasonKey =
  "inaccurate" | "spam" | "abusive" | "privacy" | "duplicate" | "other";

/** Same wording as the reporter's picker in `ReportCardMenu`. */
export const FLAG_REASON_LABELS: Record<FlagReasonKey, string> = {
  inaccurate: "Inaccurate",
  spam: "Spam",
  abusive: "Abusive",
  privacy: "Privacy concern",
  duplicate: "Duplicate",
  other: "Other",
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
  isDismissing: boolean;
  onDismiss: (reportId: string) => void;
};

/**
 * One flagged report: where, what was said, why it was flagged, how often.
 * Owns no query state — it reports intent upward through `onDismiss`.
 */
export function FlaggedReportRow({ item, isDismissing, onDismiss }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const reasons = item.reasons
    .map((reason) => FLAG_REASON_LABELS[reason])
    .join(", ");
  const count = `${item.flagCount} ${item.flagCount === 1 ? "flag" : "flags"}`;
  const summary = item.summary ?? "No summary provided";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        accessible
        accessibilityLabel={`${item.placeName}. ${summary}. Reason: ${reasons}. ${count}.`}
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
          Reason: {reasons}
        </AppText>
      </View>

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel={`Dismiss flags on ${item.placeName}`}
        accessibilityState={{ disabled: isDismissing, busy: isDismissing }}
        disabled={isDismissing}
        onPress={() => onDismiss(item.reportId)}
        style={[styles.dismiss, { borderColor: colors.primary }]}
      >
        {isDismissing ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <AppText variant="bodyStrong" style={{ color: colors.primary }}>
            Dismiss
          </AppText>
        )}
      </TouchTarget>
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
  dismiss: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
