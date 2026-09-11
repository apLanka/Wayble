import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { CategoryBadge } from "@/components/place/CategoryBadge";
import { ConfidenceBadge } from "@/components/feed/ConfidenceBadge";
import {
  ATTRIBUTE_METADATA,
  ATTRIBUTE_ICON_EMOJI,
  type AttributeDisplayMeta,
} from "@/constants/accessibility-metadata";
import { spacing, radii } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { VerificationFeedItem } from "@/hooks/use-live-activity-feed";

type Props = {
  item: VerificationFeedItem;
};

/**
 * Formats a timestamp into human-readable relative time (e.g. "Just now", "5m ago").
 */
function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function FeedCard({ item }: Props) {
  const router = useRouter();
  const { appTheme, isDark } = useAppTheme();

  const primaryAttr = item.primaryAttribute;
  const attrMeta: AttributeDisplayMeta | undefined = primaryAttr
    ? ATTRIBUTE_METADATA[primaryAttr.key]
    : undefined;
  const attrLabel = attrMeta?.label || "Accessibility Feature";
  const attrEmoji = primaryAttr
    ? ATTRIBUTE_ICON_EMOJI[primaryAttr.key] || "📍"
    : "📍";

  const isConfirmed = item.verdict === "confirm";
  const relativeTime = formatRelativeTime(item.updatedAt);

  const a11ySummary = `${item.verifier.name} ${
    isConfirmed ? "confirmed" : "disputed"
  } ${attrLabel} at ${item.place.name}, ${relativeTime}. Confidence: ${
    item.confidence.label
  }.${item.note ? ` Note: ${item.note}` : ""}`;

  return (
    <TouchTarget
      onPress={() => router.push(`/place/${item.place._id}`)}
      style={styles.touchable}
      accessibilityRole="button"
      accessibilityLabel={a11ySummary}
      accessibilityHint="Navigates to place accessibility details"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: isDark
              ? appTheme.colors.border + "40"
              : appTheme.colors.border + "30",
          },
        ]}
      >
        {/* ── Top Header: Verifier Info & Relative Time ───────── */}
        <View style={styles.headerRow}>
          <View style={styles.verifierInfo}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isConfirmed
                    ? appTheme.colors.primary + "20"
                    : appTheme.colors.danger + "20",
                },
              ]}
            >
              <AppText style={styles.avatarText}>
                {item.verifier.name.charAt(0).toUpperCase()}
              </AppText>
            </View>

            <View style={styles.verifierTextCol}>
              <View style={styles.nameRow}>
                <AppText
                  variant="bodyStrong"
                  style={[styles.verifierName, { color: appTheme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.verifier.name}
                </AppText>
                {item.verifier.role !== "member" && (
                  <View
                    style={[
                      styles.rolePill,
                      { backgroundColor: appTheme.colors.primary + "25" },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.roleText,
                        { color: appTheme.colors.primary },
                      ]}
                    >
                      {item.verifier.role.toUpperCase()}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText
                style={[styles.timeText, { color: appTheme.colors.textMuted }]}
              >
                {relativeTime}
              </AppText>
            </View>
          </View>

          {/* Verdict indicator */}
          <View
            style={[
              styles.verdictPill,
              {
                backgroundColor: isConfirmed
                  ? isDark
                    ? "#143D22"
                    : "#E6F6ED"
                  : isDark
                    ? "#481E1C"
                    : "#FDEAE9",
                borderColor: isConfirmed
                  ? isDark
                    ? "#287545"
                    : "#A3E5BC"
                  : isDark
                    ? "#7A2E2A"
                    : "#F8B7B3",
              },
            ]}
          >
            <AppText style={styles.verdictIcon}>
              {isConfirmed ? "✅" : "⚠️"}
            </AppText>
            <AppText
              style={[
                styles.verdictLabel,
                {
                  color: isConfirmed
                    ? isDark
                      ? "#9BE5B3"
                      : "#0B6B3A"
                    : isDark
                      ? "#FFB4AB"
                      : "#B3261E",
                },
              ]}
            >
              {isConfirmed ? "Confirmed" : "Disputed"}
            </AppText>
          </View>
        </View>

        {/* ── Place Name & Category ──────────────────────────── */}
        <View style={styles.placeSection}>
          <View style={styles.placeTitleRow}>
            <AppText
              variant="title"
              style={[styles.placeName, { color: appTheme.colors.text }]}
              numberOfLines={1}
            >
              {item.place.name}
            </AppText>
            <CategoryBadge category={item.place.category} />
          </View>
          <AppText
            style={[styles.placeAddress, { color: appTheme.colors.textMuted }]}
            numberOfLines={1}
          >
            📍 {item.place.address}
          </AppText>
        </View>

        {/* ── Verified Attribute Pill ─────────────────────────── */}
        <View
          style={[
            styles.attributeRow,
            {
              backgroundColor: isDark ? appTheme.colors.background : "#F1F5F3",
            },
          ]}
        >
          <AppText style={styles.attributeEmoji}>{attrEmoji}</AppText>
          <AppText
            variant="bodyStrong"
            style={[styles.attributeLabel, { color: appTheme.colors.text }]}
          >
            {attrLabel}
          </AppText>
        </View>

        {/* ── Optional Note / Comment ────────────────────────── */}
        {item.note && (
          <View
            style={[
              styles.noteBox,
              {
                backgroundColor: isDark ? "#1C2720" : "#F8FAF9",
                borderLeftColor: appTheme.colors.primary,
              },
            ]}
          >
            <AppText
              style={[styles.noteText, { color: appTheme.colors.textMuted }]}
            >
              “{item.note}”
            </AppText>
          </View>
        )}

        {/* ── Footer: Confidence Badge & Total count ──────────── */}
        <View style={styles.footerRow}>
          <ConfidenceBadge
            level={item.confidence.level}
            label={item.confidence.label}
            score={item.confidence.score}
          />

          <AppText
            style={[
              styles.totalVerificationsText,
              { color: appTheme.colors.textMuted },
            ]}
          >
            {item.totalVerifications}{" "}
            {item.totalVerifications === 1 ? "verification" : "verifications"}
          </AppText>
        </View>
      </View>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verifierInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  verifierTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifierName: {
    fontSize: 15,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 12,
    marginTop: 1,
  },
  verdictPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  verdictIcon: {
    fontSize: 11,
  },
  verdictLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  placeSection: {
    gap: 2,
    marginTop: 2,
  },
  placeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  placeName: {
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  placeAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  attributeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  attributeEmoji: {
    fontSize: 15,
  },
  attributeLabel: {
    fontSize: 13,
  },
  noteBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  noteText: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
  },
  totalVerificationsText: {
    fontSize: 12,
  },
});
