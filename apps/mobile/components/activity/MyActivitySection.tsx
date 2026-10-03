import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  View,
} from "react-native";

import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  filterActivityLogs,
  type ActivityDraft,
  type ActivityFilter,
  type ActivityLogItem,
} from "./activity-helpers";
import { ActivityLogCard } from "./ActivityLogCard";
import { ActivityLogModal } from "./ActivityLogModal";
import { ActivityStatsBar } from "./ActivityStatsBar";

interface MyActivitySectionProps {
  nearbyPlaces?: Array<{ _id: string; name: string }>;
}

export function MyActivitySection({
  nearbyPlaces = [],
}: MyActivitySectionProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const router = useRouter();

  const currentUser = useQuery(api.users.currentUser);
  const myLogs = useQuery(api.activityLogs.listMyLogs, {});
  const myStats = useQuery(api.activityLogs.getMyStats, {});

  const createLog = useMutation(api.activityLogs.createLog);
  const updateLog = useMutation(api.activityLogs.updateLog);
  const removeLog = useMutation(api.activityLogs.removeLog);

  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityLogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<ActivityLogItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredLogs = useMemo(() => {
    if (!myLogs) return [];
    return filterActivityLogs(myLogs as ActivityLogItem[], activeFilter);
  }, [myLogs, activeFilter]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (item: ActivityLogItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Handle save (create or update)
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
      console.error("Failed to save activity log:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete execution
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await removeLog({ id: itemToDelete._id });
      setItemToDelete(null);
    } catch (err) {
      console.error("Failed to remove activity log:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // If user is guest / not signed in
  if (currentUser === null) {
    return (
      <View style={styles.centered}>
        <AppSymbol
          name={{ ios: "person.crop.circle.badge.plus", android: "person_add" }}
          size={56}
          tintColor={colors.primary}
        />
        <AppText variant="title" style={styles.centeredText}>
          Sign in to log activities
        </AppText>
        <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
          Track your personal accessibility visits, keep notes on barrier-free
          places, and edit or remove them anytime.
        </AppText>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Sign in to your account"
          onPress={() => router.push("/sign-in" as Href)}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
            Sign In
          </AppText>
        </TouchTarget>
      </View>
    );
  }

  // Loading state
  if (myLogs === undefined || myStats === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
          Loading your activity journal…
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" accessibilityRole="header">
                  Personal Activity Journal
                </AppText>
                <AppText style={{ color: colors.textMuted }}>
                  Your personal visits, barrier reports, and accessibility
                  notes.
                </AppText>
              </View>

              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Log a new visit activity"
                accessibilityHint="Opens a form to add a place visit and accessibility notes"
                onPress={handleOpenCreate}
                style={[styles.logButton, { backgroundColor: colors.primary }]}
              >
                <AppSymbol
                  name={{ ios: "plus", android: "add" }}
                  size={18}
                  tintColor={colors.onPrimary}
                />
                <AppText
                  variant="bodyStrong"
                  style={{ color: colors.onPrimary, fontSize: 14 }}
                >
                  Log Visit
                </AppText>
              </TouchTarget>
            </View>

            <ActivityStatsBar
              totalCount={myStats.totalCount}
              accessibleCount={myStats.accessibleCount}
              partialCount={myStats.partialCount}
              inaccessibleCount={myStats.inaccessibleCount}
            />

            {/* Filter pills */}
            <View style={styles.filterRow} accessibilityRole="radiogroup">
              {(
                [
                  { key: "all", label: "All Logs" },
                  { key: "accessible", label: "Accessible" },
                  { key: "needs_attention", label: "Barriers / Issues" },
                ] as const
              ).map((tab) => {
                const isSelected = activeFilter === tab.key;
                return (
                  <TouchTarget
                    key={tab.key}
                    onPress={() => setActiveFilter(tab.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filter: ${tab.label}`}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="label"
                      style={{
                        color: isSelected ? colors.onPrimary : colors.text,
                        fontSize: 13,
                      }}
                    >
                      {tab.label}
                    </AppText>
                  </TouchTarget>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <AppSymbol
              name={{ ios: "pencil.and.list.clipboard", android: "edit_note" }}
              size={44}
              tintColor={colors.primary}
            />
            <AppText
              variant="bodyStrong"
              style={[styles.centeredText, { color: colors.text }]}
            >
              {activeFilter === "all"
                ? "No activities logged yet"
                : "No matching activities found"}
            </AppText>
            <AppText
              style={[
                styles.centeredText,
                { color: colors.textMuted, fontSize: 14 },
              ]}
            >
              Record places you've visited, note accessible features or
              barriers, and manage them all here.
            </AppText>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Log your first visit"
              onPress={handleOpenCreate}
              style={[
                styles.emptyActionBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
                + Log Your First Visit
              </AppText>
            </TouchTarget>
          </View>
        }
        renderItem={({ item }) => (
          <ActivityLogCard
            item={item}
            onEdit={handleOpenEdit}
            onDelete={setItemToDelete}
          />
        )}
      />

      {/* Create / Edit Modal */}
      <ActivityLogModal
        visible={isModalOpen}
        initialItem={editingItem}
        places={nearbyPlaces}
        isSaving={isSaving}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveLog}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={itemToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setItemToDelete(null)}
      >
        <View style={styles.dialogOverlay}>
          <View
            style={[
              styles.dialogSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLabel="Delete activity log confirmation"
          >
            <AppText variant="title" accessibilityRole="header">
              Delete Activity Log?
            </AppText>
            <AppText style={{ color: colors.textMuted }}>
              Are you sure you want to delete the log for "
              {itemToDelete?.placeName}"? This action cannot be undone.
            </AppText>

            <View style={styles.dialogButtonRow}>
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Cancel delete"
                disabled={isDeleting}
                onPress={() => setItemToDelete(null)}
                style={[
                  styles.dialogBtn,
                  { borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <AppText variant="bodyStrong" style={{ color: colors.text }}>
                  Cancel
                </AppText>
              </TouchTarget>

              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Confirm delete log"
                disabled={isDeleting}
                onPress={() => void handleConfirmDelete()}
                style={[styles.dialogBtn, { backgroundColor: colors.danger }]}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <AppText
                    variant="bodyStrong"
                    style={{ color: colors.onPrimary }}
                  >
                    Delete
                  </AppText>
                )}
              </TouchTarget>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  headerSection: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: radii.md,
    alignSelf: "flex-start",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  filterPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
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
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emptyActionBtn: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  dialogSheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dialogButtonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dialogBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
