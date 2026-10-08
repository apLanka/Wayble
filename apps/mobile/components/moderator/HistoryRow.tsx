import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { FLAG_REASON_LABELS, type FlagReasonKey } from "./FlaggedReportRow";
import {
  describeHistoryItem,
  OUTCOME_LABELS,
  type ModerationOutcome,
} from "./moderation-history";

/** One entry from `moderation.getResolvedFlags`, as this row reads it. */
export type ResolvedFlag = {
  reportId: string;
  placeName: string;
  summary?: string;
  outcome: ModerationOutcome;
  flagCount: number;
  reasons: FlagReasonKey[];
  resolutionNote?: string;
  resolvedByName: string;
  resolvedAt: number;
};

/** One past moderation decision, read as a single accessibility node. */
export function HistoryRow({ item }: { item: ResolvedFlag }) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const when = formatRelativeTime(item.resolvedAt);
  const removed = item.outcome === "removed";
  const reasons = item.reasons.map((r) => FLAG_REASON_LABELS[r]).join(", ");

  return (
    <View
      accessible
      accessibilityLabel={describeHistoryItem({ ...item, when })}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText
          variant="bodyStrong"
          style={[styles.place, { color: colors.text }]}
        >
          {item.placeName}
        </AppText>
        {/* Outcome is a word, not just a colour. */}
        <AppText
          variant="label"
          style={{ color: removed ? colors.danger : colors.textMuted }}
        >
          {OUTCOME_LABELS[item.outcome]}
        </AppText>
      </View>
      {item.summary ? (
        <AppText style={{ color: colors.text }}>{item.summary}</AppText>
      ) : null}
      <AppText variant="label" style={{ color: colors.textMuted }}>
        {STRINGS.moderator.row.reason(reasons)}
      </AppText>
      {item.resolutionNote ? (
        <AppText style={{ color: colors.text }}>
          {STRINGS.moderator.row.note(item.resolutionNote)}
        </AppText>
      ) : null}
      <AppText variant="label" style={{ color: colors.textMuted }}>
        {item.resolvedByName} · {when}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  place: {
    flex: 1,
  },
});
