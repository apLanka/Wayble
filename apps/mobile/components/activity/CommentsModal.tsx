import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import React, { useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import type { ActivityLogItem } from "./activity-helpers";

interface CommentsModalProps {
  visible: boolean;
  log: ActivityLogItem | null;
  currentUserId?: string;
  onClose: () => void;
}

export function CommentsModal({
  visible,
  log,
  currentUserId,
  onClose,
}: CommentsModalProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const comments = useQuery(
    api.activityLogs.listComments,
    log ? { logId: log._id } : "skip",
  );

  const addComment = useMutation(api.activityLogs.addComment);
  const removeComment = useMutation(api.activityLogs.removeComment);

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !log || isSubmitting) return;

    if (!currentUserId) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to join the conversation and post comments.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment({
        logId: log._id,
        text: trimmed,
      });
      setCommentText("");
      AccessibilityInfo.announceForAccessibility("Comment posted successfully");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to post comment";
      Alert.alert("Unable to Post", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (commentId: Id<"activityComments">) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(commentId);
            try {
              await removeComment({ commentId });
              AccessibilityInfo.announceForAccessibility("Comment deleted");
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : "Failed to delete comment";
              Alert.alert("Error", message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  if (!log) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss comments"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Sheet Drag Indicator */}
          <View style={styles.dragHandleContainer}>
            <View
              style={[styles.dragHandle, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleCol}>
              <View style={styles.titleRow}>
                <AppText variant="title" style={{ color: colors.text }}>
                  Comments
                </AppText>
                {comments && (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <AppText
                      variant="label"
                      style={[styles.countBadgeText, { color: colors.primary }]}
                    >
                      {comments.length}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText
                variant="label"
                style={{ color: colors.textMuted }}
                numberOfLines={1}
              >
                On {log.placeName} • {log.title}
              </AppText>
            </View>

            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Close comments"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <AppSymbol
                name={{ ios: "xmark", android: "close" }}
                size={20}
                tintColor={colors.text}
              />
            </TouchTarget>
          </View>

          {/* Comments List */}
          {comments === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AppText variant="body" style={{ color: colors.textMuted }}>
                Loading comments…
              </AppText>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <AppSymbol
                  name={{
                    ios: "bubble.left.and.bubble.right",
                    android: "forum",
                  }}
                  size={32}
                  tintColor={colors.primary}
                />
              </View>
              <AppText
                variant="bodyStrong"
                style={[styles.emptyTitle, { color: colors.text }]}
              >
                No comments yet
              </AppText>
              <AppText
                variant="body"
                style={[styles.emptySubtitle, { color: colors.textMuted }]}
              >
                Start the conversation! Ask about wheelchair access, sensory
                features, or share your own thoughts.
              </AppText>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={comments}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const initials = (item.authorName || "C")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isAuthor = item.isPostOwner;
                const isMyComment = item.userId === currentUserId;
                const canDelete =
                  item.canDelete ??
                  (currentUserId &&
                    (item.userId === currentUserId ||
                      log.userId === currentUserId));

                return (
                  <View
                    style={[
                      styles.commentRow,
                      { borderBottomColor: `${colors.border}40` },
                    ]}
                  >
                    {/* User Initials Avatar */}
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: isAuthor
                            ? `${colors.primary}25`
                            : `${colors.textMuted}20`,
                          borderColor: isAuthor
                            ? colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={[
                          styles.avatarText,
                          {
                            color: isAuthor ? colors.primary : colors.text,
                          },
                        ]}
                      >
                        {initials}
                      </AppText>
                    </View>

                    {/* Comment Body */}
                    <View style={styles.commentContent}>
                      <View style={styles.authorHeaderRow}>
                        <AppText
                          variant="bodyStrong"
                          style={{ color: colors.text, fontSize: 13 }}
                        >
                          {isMyComment ? "You" : item.authorName}
                        </AppText>

                        {/* Post Author Pill Badge */}
                        {isAuthor && (
                          <View
                            style={[
                              styles.authorBadge,
                              { backgroundColor: `${colors.primary}20` },
                            ]}
                          >
                            <AppText
                              variant="label"
                              style={[
                                styles.authorBadgeText,
                                { color: colors.primary },
                              ]}
                            >
                              Author
                            </AppText>
                          </View>
                        )}

                        <AppText
                          variant="label"
                          style={{ color: colors.textMuted, fontSize: 11 }}
                        >
                          • {formatRelativeTime(item.createdAt)}
                        </AppText>
                      </View>

                      <AppText
                        variant="body"
                        style={[styles.commentText, { color: colors.text }]}
                      >
                        {item.text}
                      </AppText>
                    </View>

                    {/* Delete action for author or post owner */}
                    {canDelete && (
                      <TouchTarget
                        accessibilityRole="button"
                        accessibilityLabel="Delete this comment"
                        onPress={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        style={styles.deleteBtn}
                      >
                        {deletingId === item._id ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.danger}
                          />
                        ) : (
                          <AppSymbol
                            name={{ ios: "trash", android: "delete" }}
                            size={16}
                            tintColor={colors.danger}
                          />
                        )}
                      </TouchTarget>
                    )}
                  </View>
                );
              }}
            />
          )}

          {/* Bottom Comment Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: colors.surfaceElevated,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Add an accessibility comment…"
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="default"
              accessibilityLabel="Add an accessibility comment"
              accessibilityHint="Type your message, then tap post"
            />

            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Post comment"
              disabled={!commentText.trim() || isSubmitting}
              onPress={handleSubmit}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: commentText.trim()
                    ? colors.primary
                    : `${colors.primary}40`,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <AppSymbol
                  name={{
                    ios: "paperplane.fill",
                    android: "send",
                  }}
                  size={18}
                  tintColor={colors.onPrimary}
                />
              )}
            </TouchTarget>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: "85%",
    minHeight: 380,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    flex: 1,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    flex: 1,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
  },
  commentContent: {
    flex: 1,
    gap: 3,
  },
  authorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  authorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  authorBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
