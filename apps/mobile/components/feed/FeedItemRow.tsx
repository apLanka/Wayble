import type { ConfidenceTier } from "@packages/backend/convex/confidence";
import { StyleSheet, View } from "react-native";

import { ConfidenceBadge } from "@/components/place/ConfidenceBadge";
import { AppText } from "@/components/ui/app-text";
import { CONFIDENCE_LABELS } from "@/constants/confidence-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { attributeSummary, type FeedEntry } from "./feed-announcements";

/** One entry from `verificationFeed.recentVerifications`, as this row reads it. */
export type FeedItem = FeedEntry & {
  confidence: { tier: ConfidenceTier; isStale: boolean };
};

type Props = {
  item: FeedItem;
  currentUserId: string | undefined;
};

/**
 * One piece of verification activity: who, what they said about which
 * attribute, when, and how much the place's data is trusted. Read as a single
 * screen-reader node so the sentence is not chopped into fragments.
 */
export function FeedItemRow({ item, currentUserId }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const mine = item.verifierId === currentUserId;
  const who = mine ? "You" : item.verifierName;
  const confirmed = item.verdict === "confirm";
  const verb = confirmed ? "confirmed" : "disputed";
  const attribute = attributeSummary(item.attributes);
  // Computed once so the visible and spoken text cannot differ across a tick.
  const when = formatRelativeTime(item.updatedAt);
  const confidenceText = `Confidence: ${CONFIDENCE_LABELS[item.confidence.tier]}${
    item.confidence.isStale ? ", needs re-check" : ""
  }`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${who} ${verb} ${attribute} at ${item.placeName}. ${when}. ${confidenceText}.`}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText
          variant="bodyStrong"
          style={[styles.who, { color: colors.text }]}
        >
          {who}
        </AppText>
        <AppText variant="label" style={{ color: colors.textMuted }}>
          {when}
        </AppText>
      </View>
      {/* Verdict is words plus colour, never colour alone. */}
      <AppText style={{ color: colors.text }}>
        <AppText
          variant="bodyStrong"
          style={{ color: confirmed ? colors.success : colors.danger }}
        >
          {confirmed ? "Confirmed" : "Disputed"}
        </AppText>{" "}
        {attribute}
      </AppText>
      <AppText variant="label" style={{ color: colors.textMuted }}>
        {item.placeName}
      </AppText>
      <ConfidenceBadge
        tier={item.confidence.tier}
        isStale={item.confidence.isStale}
      />
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
  who: {
    flex: 1,
  },
});
