import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import {
  ATTRIBUTE_METADATA,
  VALUE_LABELS,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import type { AccessibilityAttribute } from "@packages/backend/convex/accessibility";
import { ReportCardMenu } from "./ReportCardMenu";
import { VerifyControl } from "./VerifyControl";
import {
  isOwnReport,
  tallySummary,
  type VerificationTally,
  type Verdict,
} from "./verification-tally";

/**
 * One entry from `reports.listForPlace`, as this card reads it.
 *
 * Every field type is the query's own rather than an invented equivalent, so
 * a `listForPlace` entry is assignable to `PlaceReport` directly and the
 * screen does not have to cast. A wider local type would also typecheck,
 * because a wider object is assignable to a narrower one and TypeScript will
 * not catch that. The cast it would force loses nothing at runtime; it stops
 * this type from *exposing* an attribute's `note`, so reading it would cost
 * a second cast.
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
  // Annotated, not inferred: an inferred literal is only as wide as the fields
  // written today, and this file exists on the principle that the real sibling
  // types are used rather than re-derived. The annotation is also what the
  // `tally=` prop and `tallySummary` below are checked against.
  const tally: VerificationTally = {
    confirmCount: report.confirmCount,
    disputeCount: report.disputeCount,
    myVerdict: report.myVerdict,
  };
  // Computed once, so the visible text and the spoken label cannot disagree
  // across a clock tick. `now` is left to default to the render-time clock,
  // which is what a relative time has to be measured against.
  const observed = formatRelativeTime(report.observedAt);

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
        <View style={styles.headerRight}>
          {/* "just now" alone gives a screen-reader user nothing to anchor it
              to, so the node says what the time is about. */}
          <AppText
            variant="label"
            style={{ color: colors.textMuted }}
            accessibilityLabel={`Reported ${observed}`}
          >
            {observed}
          </AppText>
          <ReportCardMenu reportId={report._id} disabled={own} />
        </View>
      </View>

      {report.summary ? (
        <AppText style={{ color: colors.text }}>{report.summary}</AppText>
      ) : null}

      {report.attributes.length > 0 ? (
        <View style={styles.chips}>
          {report.attributes.map((attribute) => {
            // The same lookup `AttributeRow` does, so a chip and a
            // place-detail row can never disagree about what an attribute is
            // called. `ATTRIBUTE_METADATA` is keyed by the *full* dotted key
            // ("mobility.elevator"), so this reads `attribute.key` unshortened
            // — a leaf would miss every entry and fall through.
            //
            // A key the metadata does not carry is skipped outright rather than
            // shown as raw machine text. Unreachable while the taxonomy is
            // version 1 — the Record is total and `noUncheckedIndexedAccess` is
            // off, so the type system calls this dead code and is wrong at
            // runtime: a future taxonomy bump that retires a key would
            // otherwise put `mobility.step_free_entrance` on a consumer
            // screen. A visibly absent attribute beats silently
            // machine-worded text. The value keeps its fallback, because it is
            // the key that carries the meaning.
            const label = ATTRIBUTE_METADATA[attribute.key]?.label;
            if (label === undefined) return null;

            const valueLabel = VALUE_LABELS[attribute.value] ?? attribute.value;
            // Same phrasing `AttributeRow` uses in its own label
            // (AttributeRow.tsx:39), and the same string for the visible line
            // and the announcement, so the two cannot drift. The note is not
            // decoration: "Elevator: Partial" tells a wheelchair user nothing
            // about why, and `getPlace` already preserves notes down to this
            // component, so the same report reads differently here than on the
            // place detail screen would be a regression.
            const note = attribute.note ? `. Note: ${attribute.note}` : "";
            // `submitReport` rejects duplicate keys, so the key is unique
            // within one report and safe as a list key.
            return (
              // The label sits on the column, not the pill, exactly as
              // `AttributeRow` puts it on the outermost wrapper of one
              // attribute. On the pill it would cover the pill alone, leaving
              // the note below as a second focusable node — so a screen reader
              // would say the note twice. One attribute is one node, carrying
              // label, value and note.
              <View
                key={attribute.key}
                style={styles.chipColumn}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${label}: ${valueLabel}${note}`}
              >
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <AppText variant="label" style={{ color: colors.text }}>
                    {label}: {valueLabel}
                  </AppText>
                </View>
                {/* No `numberOfLines`: a cap hides more of the note the larger
                    the user's text is, which is when they need it most
                    (WCAG 1.4.4). Notes are capped at 280 characters. */}
                {note ? (
                  <AppText style={{ color: colors.textMuted }}>{note}</AppText>
                ) : null}
              </View>
            );
          })}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chipColumn: {
    flexDirection: "column",
    // Left-aligned so the pill keeps hugging its own text instead of
    // stretching to the width of a long note underneath it.
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
