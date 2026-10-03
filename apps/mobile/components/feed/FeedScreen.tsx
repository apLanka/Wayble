import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import {
  type ActivityDraft,
  type ActivityLogItem,
} from "@/components/activity/activity-helpers";
import { ActivityLogModal } from "@/components/activity/ActivityLogModal";
import { CommunityPostCard } from "@/components/activity/CommunityPostCard";
import { MyActivitySection } from "@/components/activity/MyActivitySection";
import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useVerificationFeed } from "@/hooks/use-verification-feed";

export type ActivityTab = "community" | "my_activity";

/**
 * Activity screen (/feed, opened from Home Quick Actions):
 * Instagram-style accessible media feed specially designed for people with disabilities.
 * Features:
 * - Community Feed: Visual media posts with accessible badges, Alt-text toggle, and helpful likes.
 * - My Activity: Personal accessibility visit journal with full CRUD operations.
 */
export function FeedScreen() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const [activeTab, setActiveTab] = useState<ActivityTab>("community");

  const { nearbyPlaces } = useVerificationFeed();
  const currentUser = useQuery(api.users.currentUser);
  const communityPosts = useQuery(api.activityLogs.listPublicFeed, {
    limit: 30,
  });

  const toggleHelpful = useMutation(api.activityLogs.toggleHelpful);
  const createLog = useMutation(api.activityLogs.createLog);
  const updateLog = useMutation(api.activityLogs.updateLog);
  const removeLog = useMutation(api.activityLogs.removeLog);

  // Modal state for creating/editing from the feed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityLogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ActivityLogItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveLog = async (draft: ActivityDraft) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await updateLog({
          id: editingItem._id,
          placeName: draft.placeName,
          title: draft.title,
          notes: draft.notes,
          accessibilityRating: draft.accessibilityRating,
          imageUrl: draft.imageUrl,
          imageAlt: draft.imageAlt,
          tags: draft.tags,
          visitedAt: draft.visitedAt ?? editingItem.visitedAt,
        });
      } else {
        await createLog({
          placeName: draft.placeName,
          title: draft.title,
          notes: draft.notes,
          accessibilityRating: draft.accessibilityRating,
          imageUrl: draft.imageUrl,
          imageAlt: draft.imageAlt,
          tags: draft.tags,
          visitedAt: draft.visitedAt ?? Date.now(),
        });
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to save post:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (item: ActivityLogItem) => {
    try {
      await removeLog({ id: item._id });
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleToggleHelpful = async (id: ActivityLogItem["_id"]) => {
    if (!currentUser) return;
    try {
      await toggleHelpful({ id });
    } catch (err) {
      console.error("Failed to toggle helpful:", err);
    }
  };

  const title = (
    <Stack.Screen
      options={{
        title:
          activeTab === "community"
            ? "Community Activity"
            : "My Activity Journal",
      }}
    />
  );

  return (
    <>
      {title}
      <Screen edges={["left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* Top Segmented Navigation Tabs */}
          <View
            style={[
              styles.tabBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityRole="tablist"
          >
            <TouchTarget
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "community" }}
              accessibilityLabel="Community Feed tab"
              onPress={() => setActiveTab("community")}
              style={[
                styles.tabButton,
                activeTab === "community" && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <AppSymbol
                name={{ ios: "photo.stack.fill", android: "photo_library" }}
                size={16}
                tintColor={
                  activeTab === "community"
                    ? colors.onPrimary
                    : colors.textMuted
                }
              />
              <AppText
                variant="label"
                style={{
                  color:
                    activeTab === "community" ? colors.onPrimary : colors.text,
                  fontWeight: activeTab === "community" ? "700" : "500",
                }}
              >
                Community Feed
              </AppText>
            </TouchTarget>

            <TouchTarget
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "my_activity" }}
              accessibilityLabel="My Activity Journal tab"
              onPress={() => setActiveTab("my_activity")}
              style={[
                styles.tabButton,
                activeTab === "my_activity" && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <AppSymbol
                name={{
                  ios: "person.text.rectangle",
                  android: "account_circle",
                }}
                size={16}
                tintColor={
                  activeTab === "my_activity"
                    ? colors.onPrimary
                    : colors.textMuted
                }
              />
              <AppText
                variant="label"
                style={{
                  color:
                    activeTab === "my_activity"
                      ? colors.onPrimary
                      : colors.text,
                  fontWeight: activeTab === "my_activity" ? "700" : "500",
                }}
              >
                My Activity
              </AppText>
            </TouchTarget>
          </View>

          {/* Tab Content */}
          {activeTab === "my_activity" ? (
            <MyActivitySection
              nearbyPlaces={
                nearbyPlaces?.map((p) => ({ _id: p._id, name: p.name })) ?? []
              }
            />
          ) : (
            // Instagram-Style Community Media Feed
            <View style={styles.feedWrapper}>
              {communityPosts === undefined ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <AppText
                    style={[styles.centeredText, { color: colors.textMuted }]}
                  >
                    Loading community posts…
                  </AppText>
                </View>
              ) : (
                <FlatList
                  data={communityPosts}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.postListContent}
                  ListHeaderComponent={
                    <View style={styles.feedHeader}>
                      <View style={{ flex: 1 }}>
                        <AppText variant="title" accessibilityRole="header">
                          Inclusive Spaces Feed
                        </AppText>
                        <AppText style={{ color: colors.textMuted }}>
                          Accessibility photo observations and reviews from
                          people with disabilities in your area.
                        </AppText>
                      </View>

                      <TouchTarget
                        accessibilityRole="button"
                        accessibilityLabel="Post accessibility observation"
                        accessibilityHint="Opens form to take or upload a photo with accessibility notes"
                        onPress={handleOpenCreate}
                        style={[
                          styles.postButton,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <AppSymbol
                          name={{ ios: "plus", android: "add" }}
                          size={18}
                          tintColor={colors.onPrimary}
                        />
                        <AppText
                          variant="bodyStrong"
                          style={{ color: colors.onPrimary, fontSize: 13 }}
                        >
                          Post
                        </AppText>
                      </TouchTarget>
                    </View>
                  }
                  ListEmptyComponent={
                    <View
                      style={[
                        styles.emptyContainer,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <AppSymbol
                        name={{
                          ios: "photo.on.rectangle.angled",
                          android: "image",
                        }}
                        size={48}
                        tintColor={colors.primary}
                      />
                      <AppText variant="bodyStrong" style={styles.centeredText}>
                        No community posts yet
                      </AppText>
                      <AppText
                        style={[
                          styles.centeredText,
                          { color: colors.textMuted },
                        ]}
                      >
                        Be the first to share an accessibility photo review of a
                        place you visited!
                      </AppText>
                      <TouchTarget
                        accessibilityRole="button"
                        accessibilityLabel="Share first accessibility review"
                        onPress={handleOpenCreate}
                        style={[
                          styles.emptyActionBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <AppText
                          variant="bodyStrong"
                          style={{ color: colors.onPrimary }}
                        >
                          + Share First Post
                        </AppText>
                      </TouchTarget>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <CommunityPostCard
                      item={item as ActivityLogItem}
                      currentUserId={currentUser?._id}
                      onToggleHelpful={handleToggleHelpful}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeletePost}
                    />
                  )}
                />
              )}
            </View>
          )}

          {/* Modal for creating/editing posts */}
          <ActivityLogModal
            visible={isModalOpen}
            initialItem={editingItem}
            places={
              nearbyPlaces?.map((p) => ({ _id: p._id, name: p.name })) ?? []
            }
            isSaving={isSaving}
            onClose={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
            onSave={handleSaveLog}
          />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: radii.pill,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 40,
    borderRadius: radii.pill,
  },
  feedWrapper: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  postListContent: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  centeredText: {
    textAlign: "center",
  },
  emptyContainer: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyActionBtn: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
});
