import React from "react";
import { StyleSheet, View } from "react-native";

import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatVisitDate,
  getLogCardAccessibilityLabel,
  type ActivityLogItem,
} from "./activity-helpers";
import { ActivityRatingBadge } from "./ActivityRatingBadge";

interface ActivityLogCardProps {
  item: ActivityLogItem;
  onEdit: (item: ActivityLogItem) => void;
  onDelete: (item: ActivityLogItem) => void;
}

export function ActivityLogCard({
  item,
  onEdit,
  onDelete,
}: ActivityLogCardProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const formattedDate = formatVisitDate(item.visitedAt);
  const cardAccessibilityLabel = getLogCardAccessibilityLabel(
    item,
    formattedDate,
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessible
      accessibilityRole="none"
      accessibilityLabel={cardAccessibilityLabel}
    >
      <View style={styles.topRow}>
        <View style={styles.placeInfo}>
          <AppText
            variant="label"
            style={[styles.placeName, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.placeName}
          </AppText>
          <AppText variant="label" style={{ color: colors.textMuted }}>
            {formattedDate}
          </AppText>
        </View>

        <View style={styles.actions}>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel={`Edit log for ${item.placeName}`}
            accessibilityHint="Opens edit dialog to update this log"
            onPress={() => onEdit(item)}
            style={styles.actionButton}
          >
            <AppSymbol
              name={{ ios: "pencil", android: "edit" }}
              size={18}
              tintColor={colors.primary}
            />
          </TouchTarget>

          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel={`Delete log for ${item.placeName}`}
            accessibilityHint="Opens confirmation to delete this log"
            onPress={() => onDelete(item)}
            style={styles.actionButton}
          >
            <AppSymbol
              name={{ ios: "trash", android: "delete" }}
              size={18}
              tintColor={colors.danger}
            />
          </TouchTarget>
        </View>
      </View>

      <AppText
        variant="bodyStrong"
        style={[styles.title, { color: colors.text }]}
      >
        {item.title}
      </AppText>

      <View style={styles.badgeRow}>
        <ActivityRatingBadge rating={item.accessibilityRating} />
        {item.category ? (
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <AppText
              variant="label"
              style={[styles.categoryText, { color: colors.textMuted }]}
            >
              {item.category.replace(/_/g, " ")}
            </AppText>
          </View>
        ) : null}
      </View>

      {item.notes ? (
        <View
          style={[
            styles.notesContainer,
            { backgroundColor: colors.surfaceElevated },
          ]}
        >
          <AppText
            variant="body"
            style={[styles.notesText, { color: colors.text }]}
          >
            {item.notes}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontWeight: "700",
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  categoryBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    textTransform: "capitalize",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notesContainer: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
