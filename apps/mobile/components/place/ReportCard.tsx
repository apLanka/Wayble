import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import type { AccessibilityAttribute } from "@packages/backend/convex/accessibility";
import { VerifyControl } from "./VerifyControl";
import { isOwnReport, tallySummary, type Verdict } from "./verification-tally";

/**
 * One entry from `reports.listForPlace`, as this card reads it.
 *
 * Every field type is the query's own rather than an invented equivalent, so
 * a `listForPlace` entry is assignable to `PlaceReport` directly and the
 * screen does not have to cast. Widening any field would also typecheck, but
 * it would push the `as` to the call site — and a cast across a wider type
 * silently drops an attribute's `note`.
 */
export type PlaceReport = {
  _id: string;
  authorId: string;
  authorDisplayName: string;
  summary?: string;
  attributes: AccessibilityAttribute[];
  observedAt: number;
  confirmCount: number;
  disputeCount: number;
  myVerdict: Verdict | null;
};

type Props = {
  report: PlaceReport;
  currentUserId: string | undefined;
  onVote: (reportId: string, verdict: Verdict) => void;
};

/**
 * One accessibility report: who filed it, when they saw the place, what they
 * observed, and whether you agree.
 *
 * Owns no tally arithmetic and no query state — it renders what it is handed
 * and reports intent upward through `onVote`, leaving the optimistic patch to
 * the screen, which is the only holder of the Convex result.
 */
export function ReportCard({ report, currentUserId, onVote }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  // One boolean drives both the header label and the control's disabled
  // state, so the two cannot disagree about whose report this is.
  const own = isOwnReport(report.authorId, currentUserId);
  const tally = {
    confirmCount: report.confirmCount,
    disputeCount: report.disputeCount,
    myVerdict: report.myVerdict,
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={{ color: colors.text }}>
          {own ? "Your report" : report.authorDisplayName}
        </AppText>
        {/* One argument: `now` defaults to the render-time clock, which is
            what a relative time has to be measured against. */}
        <AppText variant="label" style={{ color: colors.textMuted }}>
          {formatRelativeTime(report.observedAt)}
        </AppText>
      </View>

      {report.summary ? (
        <AppText style={{ color: colors.text }}>{report.summary}</AppText>
      ) : null}

      {report.attributes.length > 0 ? (
        <View style={styles.chips}>
          {report.attributes.map((attribute) => (
            // `submitReport` rejects duplicate keys, so the key is unique
            // within one report and safe as a list key.
            <View
              key={attribute.key}
              style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}
            >
              {/* Keys are shortened to their leaf ("mobility.elevator" ->
                  "elevator"): the four category groupings are already implied
                  by the surrounding filter, and the full dotted key wraps
                  badly at 200% font scale. */}
              <AppText variant="label" style={{ color: colors.text }}>
                {attribute.key.split(".").slice(1).join(".")}:{" "}
                {attribute.value.replace(/_/g, " ")}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <VerifyControl
        reportId={report._id}
        tally={tally}
        disabled={own}
        // The tally is folded into the reason because `VerifyControl` shows
        // this string *instead of* the tally. Without it, a screen-reader user
        // on their own report would hear the reason and no counts at all.
        disabledReason={`You can't verify your own report · ${tallySummary(tally)}`}
        onVote={onVote}
      />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
