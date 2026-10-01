import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FlaggedReportRow, type FlaggedReport } from "./FlaggedReportRow";
import { HistoryRow } from "./HistoryRow";
import {
  classifyModerationError,
  moderationErrorMessage,
  type ModerationAction,
} from "./moderation-errors";
import { normalizeNote } from "./moderation-history";
import { ResolveDialog } from "./ResolveDialog";

type Tab = "open" | "history";
type Pending = { item: FlaggedReport; action: ModerationAction };

/**
 * S4-7 / S4-7b (US-14) — flagged reports a moderator can dismiss or remove,
 * plus a history of past decisions.
 *
 * Queries are skipped until the session is known to be a moderator, so a
 * member or signed-out visitor never fires a call the server would reject.
 * Decisions go through `ResolveDialog` (optional note); resolved reports leave
 * the Open list through Convex reactivity and appear in History.
 */
export function ModeratorQueueScreen() {
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const [tab, setTab] = useState<Tab>("open");
  const [pending, setPending] = useState<Pending | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const currentUser = useQuery(api.users.currentUser);
  const isModerator = currentUser?.role === "moderator";
  const flagged = useQuery(
    api.moderation.getFlaggedReports,
    isModerator ? {} : "skip",
  );
  const history = useQuery(
    api.moderation.getResolvedFlags,
    isModerator && tab === "history" ? {} : "skip",
  );
  const dismissFlag = useMutation(api.moderation.dismissFlag);
  const removeReport = useMutation(api.moderation.removeReport);

  const openDialog = (item: FlaggedReport, action: ModerationAction) => {
    setDialogError(null);
    setPending({ item, action });
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setPending(null);
    setDialogError(null);
  };

  const handleConfirm = async (rawNote: string) => {
    if (!pending) return;
    const { item, action } = pending;
    const reportId = item.reportId as Id<"reports">;
    const note = normalizeNote(rawNote);

    setDialogError(null);
    setIsSubmitting(true);
    try {
      if (action === "remove") await removeReport({ reportId, note });
      else await dismissFlag({ reportId, note });
      AccessibilityInfo.announceForAccessibility(
        action === "remove" ? "Report removed." : "Flags dismissed.",
      );
      setPending(null);
    } catch (caught) {
      const message = moderationErrorMessage(
        classifyModerationError(caught),
        action,
      );
      AccessibilityInfo.announceForAccessibility(message);
      // Inside the dialog, next to the button that was just pressed.
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = <Stack.Screen options={{ title: STRINGS.moderator.title }} />;

  if (currentUser === undefined) {
    return (
      <>
        {title}
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </Screen>
      </>
    );
  }

  if (currentUser === null) {
    return (
      <>
        {title}
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              {STRINGS.moderator.signInTitle}
            </AppText>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={STRINGS.moderator.goToSignInLabel}
              onPress={() => router.replace("/sign-in")}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
                {STRINGS.moderator.signInButton}
              </AppText>
            </TouchTarget>
          </View>
        </Screen>
      </>
    );
  }

  if (!isModerator) {
    return (
      <>
        {title}
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              {STRINGS.moderator.moderatorsOnlyTitle}
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              {STRINGS.moderator.noAccess}
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  const tabs = (
    <View style={styles.tabs} accessibilityRole="tablist">
      {(
        [
          ["open", STRINGS.moderator.tabOpen],
          ["history", STRINGS.moderator.tabHistory],
        ] as const
      ).map(([key, label]) => {
        const selected = tab === key;
        return (
          <TouchTarget
            key={key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => setTab(key)}
            style={[
              styles.tab,
              {
                backgroundColor: selected ? colors.primary : "transparent",
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText
              variant="bodyStrong"
              style={{ color: selected ? colors.onPrimary : colors.text }}
            >
              {label}
            </AppText>
          </TouchTarget>
        );
      })}
    </View>
  );

  const loading = (text: string) => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
        {text}
      </AppText>
    </View>
  );

  return (
    <>
      {title}
      <Screen edges={["left", "right", "bottom"]}>
        <View style={styles.body}>
          {tabs}
          {tab === "open" ? (
            flagged === undefined ? (
              loading(STRINGS.moderator.loadingFlagged)
            ) : (
              <FlatList
                style={styles.list}
                data={flagged}
                keyExtractor={(item) => item.reportId}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                  <AppText variant="title" accessibilityRole="header">
                    {STRINGS.moderator.flaggedHeader(flagged.length)}
                  </AppText>
                }
                ListEmptyComponent={
                  <AppText style={{ color: colors.textMuted }}>
                    {STRINGS.moderator.emptyQueue}
                  </AppText>
                }
                renderItem={({ item }) => (
                  <FlaggedReportRow
                    item={item}
                    onDismiss={(row) => openDialog(row, "dismiss")}
                    onRemove={(row) => openDialog(row, "remove")}
                  />
                )}
              />
            )
          ) : history === undefined ? (
            loading(STRINGS.moderator.loadingHistory)
          ) : (
            <FlatList
              style={styles.list}
              data={history}
              keyExtractor={(item) => `${item.reportId}:${item.resolvedAt}`}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <AppText variant="title" accessibilityRole="header">
                  {STRINGS.moderator.historyHeader}
                </AppText>
              }
              ListEmptyComponent={
                <AppText style={{ color: colors.textMuted }}>
                  {STRINGS.moderator.emptyHistory}
                </AppText>
              }
              renderItem={({ item }) => <HistoryRow item={item} />}
            />
          )}
        </View>

        <ResolveDialog
          visible={pending !== null}
          action={pending?.action ?? "dismiss"}
          placeName={pending?.item.placeName ?? ""}
          isSubmitting={isSubmitting}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={(note) => void handleConfirm(note)}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
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
});
