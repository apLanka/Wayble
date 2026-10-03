import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import {
  ACTIVITY_RATING_CONFIGS,
  type ActivityLogItem,
} from "./activity-helpers";

interface CommunityPostCardProps {
  item: ActivityLogItem;
  currentUserId?: string;
  onToggleHelpful?: (id: ActivityLogItem["_id"]) => void;
  onPressComment?: (item: ActivityLogItem) => void;
  onEdit?: (item: ActivityLogItem) => void;
  onDelete?: (item: ActivityLogItem) => void;
}

export function CommunityPostCard({
  item,
  currentUserId,
  onToggleHelpful,
  onPressComment,
  onEdit,
  onDelete,
}: CommunityPostCardProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const [showAltText, setShowAltText] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const isMine = item.userId === currentUserId;
  const authorName = isMine ? "You" : (item.authorName ?? "Community Member");
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = formatRelativeTime(item.createdAt);
  const ratingConfig = ACTIVITY_RATING_CONFIGS[item.accessibilityRating];
  const ratingColor = colors[ratingConfig.colorKey];

  // Default accessible fallback image if none provided
  const displayImage =
    item.imageUrl ||
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80";
  const altText =
    item.imageAlt ||
    `Accessibility photo at ${item.placeName} showing ${ratingConfig.label.toLowerCase()} entrance.`;

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
      accessibilityLabel={`Community post by ${authorName} at ${item.placeName}. Rated ${ratingConfig.label}. ${item.title}. ${item.helpfulCount ?? 0} people found this helpful.`}
    >
      {/* 1. Header: Avatar + User info + Geotag */}
      <View style={styles.header}>
        <View style={styles.userRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: `${colors.primary}25`,
                borderColor: colors.primary,
              },
            ]}
          >
            <AppText
              variant="label"
              style={[styles.avatarText, { color: colors.primary }]}
            >
              {initials}
            </AppText>
          </View>

          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <AppText variant="bodyStrong" style={{ color: colors.text }}>
                {authorName}
              </AppText>
              <AppText variant="label" style={{ color: colors.textMuted }}>
                • {timeAgo}
              </AppText>
            </View>

            <View style={styles.geotagRow}>
              <AppSymbol
                name={{ ios: "location.fill", android: "place" }}
                size={13}
                tintColor={colors.primary}
              />
              <AppText
                variant="label"
                style={[styles.placeText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {item.placeName}
              </AppText>
            </View>
          </View>
        </View>

        {/* Action icons for author */}
        {isMine ? (
          <View style={styles.ownerActions}>
            {onEdit && (
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Edit your post"
                onPress={() => onEdit(item)}
                style={styles.headerIconBtn}
              >
                <AppSymbol
                  name={{ ios: "pencil", android: "edit" }}
                  size={18}
                  tintColor={colors.primary}
                />
              </TouchTarget>
            )}
            {onDelete && (
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Delete your post"
                onPress={() => onDelete(item)}
                style={styles.headerIconBtn}
              >
                <AppSymbol
                  name={{ ios: "trash", android: "delete" }}
                  size={18}
                  tintColor={colors.danger}
                />
              </TouchTarget>
            )}
          </View>
        ) : null}
      </View>

      {/* 2. Hero Visual Media Container */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: displayImage }}
          style={styles.mediaImage}
          accessible
          accessibilityLabel={altText}
          resizeMode="cover"
        />

        {/* Floating Accessibility Badge Overlay (Top Left) */}
        <View
          style={[styles.floatingRatingBadge, { backgroundColor: ratingColor }]}
        >
          <AppSymbol
            name={ratingConfig.symbolName}
            size={14}
            tintColor={colors.onPrimary}
          />
          <AppText
            variant="label"
            style={[styles.ratingBadgeText, { color: colors.onPrimary }]}
          >
            {ratingConfig.label}
          </AppText>
        </View>

        {/* Floating ALT Button (Bottom Right) */}
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Toggle image visual description"
          onPress={() => setShowAltText((prev) => !prev)}
          style={[
            styles.floatingAltBtn,
            { backgroundColor: "rgba(0, 0, 0, 0.75)" },
          ]}
        >
          <AppText style={styles.altBtnText}>
            {showAltText ? "Hide ALT" : "ALT"}
          </AppText>
        </TouchTarget>

        {/* Alt-Text Overlay Drawer */}
        {showAltText ? (
          <View
            style={[
              styles.altOverlay,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Image visual description: ${altText}`}
          >
            <AppText
              variant="label"
              style={{ color: colors.primary, fontWeight: "700" }}
            >
              Image Description:
            </AppText>
            <AppText
              variant="body"
              style={{ color: colors.text, fontSize: 13 }}
            >
              {altText}
            </AppText>
          </View>
        ) : null}
      </View>

      {/* 3. Instagram-Style Interactive Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel={`${item.helpfulCount ?? 0} people found this helpful. Tap to ${
              item.isHelpful ? "remove helpful reaction" : "mark as helpful"
            }`}
            onPress={() => onToggleHelpful?.(item._id)}
            style={styles.actionButton}
          >
            <AppSymbol
              name={{
                ios: item.isHelpful ? "heart.fill" : "heart",
                android: item.isHelpful ? "favorite" : "favorite_border",
              }}
              size={22}
              tintColor={item.isHelpful ? colors.danger : colors.text}
            />
            <AppText
              variant="bodyStrong"
              style={[
                styles.actionCounter,
                { color: item.isHelpful ? colors.danger : colors.text },
              ]}
            >
              {item.helpfulCount ?? 0} Helpful
            </AppText>
          </TouchTarget>

          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel={`${item.commentsCount ?? 0} comments on this post. Tap to view and post comments`}
            onPress={() => onPressComment?.(item)}
            style={styles.actionButton}
          >
            <AppSymbol
              name={{ ios: "bubble.left", android: "chat_bubble_outline" }}
              size={20}
              tintColor={colors.text}
            />
            {(item.commentsCount ?? 0) > 0 ? (
              <AppText
                variant="bodyStrong"
                style={[styles.actionCounter, { color: colors.text }]}
              >
                {item.commentsCount}
              </AppText>
            ) : null}
          </TouchTarget>
        </View>

        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={
            isBookmarked
              ? "Saved to your accessibility bookmarks"
              : "Bookmark this place"
          }
          onPress={() => setIsBookmarked((prev) => !prev)}
          style={styles.actionButton}
        >
          <AppSymbol
            name={{
              ios: isBookmarked ? "bookmark.fill" : "bookmark",
              android: isBookmarked ? "bookmark" : "bookmark_border",
            }}
            size={20}
            tintColor={isBookmarked ? colors.primary : colors.text}
          />
        </TouchTarget>
      </View>

      {/* 4. Caption & Headline */}
      <View style={styles.captionContainer}>
        <AppText
          variant="bodyStrong"
          style={[styles.headline, { color: colors.text }]}
        >
          {item.title}
        </AppText>

        {item.notes ? (
          <AppText
            variant="body"
            style={[styles.notesText, { color: colors.text }]}
          >
            {item.notes}
          </AppText>
        ) : null}

        {/* Accessible Hashtags */}
        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tagPill,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <AppText
                  variant="label"
                  style={[styles.tagText, { color: colors.primary }]}
                >
                  #{tag}
                </AppText>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.tagsRow}>
            <View
              style={[
                styles.tagPill,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <AppText
                variant="label"
                style={[styles.tagText, { color: colors.primary }]}
              >
                #AccessibilityCheck
              </AppText>
            </View>
            <View
              style={[
                styles.tagPill,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <AppText
                variant="label"
                style={[styles.tagText, { color: colors.primary }]}
              >
                #InclusiveSpaces
              </AppText>
            </View>
          </View>
        )}

        {/* Instagram-style comment prompt row */}
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={
            (item.commentsCount ?? 0) > 0
              ? `View all ${item.commentsCount} comments`
              : "Add an accessibility comment"
          }
          onPress={() => onPressComment?.(item)}
          style={styles.commentPromptRow}
        >
          <AppText
            variant="label"
            style={[styles.commentPromptText, { color: colors.textMuted }]}
          >
            {(item.commentsCount ?? 0) > 0
              ? `View all ${item.commentsCount} comments…`
              : "Add an accessibility comment…"}
          </AppText>
        </TouchTarget>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  commentPromptRow: {
    paddingTop: spacing.xs,
    minHeight: 32,
    justifyContent: "center",
  },
  commentPromptText: {
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  authorMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  geotagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  placeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ownerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaContainer: {
    width: "100%",
    height: 240,
    position: "relative",
    backgroundColor: "#000",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  floatingRatingBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  floatingAltBtn: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  altBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  altOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: spacing.md,
    gap: 4,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  actionCounter: {
    fontSize: 13,
  },
  captionContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  headline: {
    fontSize: 15,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
