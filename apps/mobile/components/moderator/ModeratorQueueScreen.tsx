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
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FlaggedReportRow } from "./FlaggedReportRow";
import {
  classifyModerationError,
  moderationErrorMessage,
} from "./moderation-errors";

/**
 * S4-7 (US-14 lite) — flat list of flagged reports a moderator can dismiss.
 *
 * The query is skipped until the session is known to be a moderator, so a
 * member or signed-out visitor never fires a call the server would reject.
 * Dismissed reports leave the list through Convex reactivity; there is no
 * optimistic patch.
 */
export function ModeratorQueueScreen() {
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const [error, setError] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const currentUser = useQuery(api.users.currentUser);
  const isModerator = currentUser?.role === "moderator";
  const flagged = useQuery(
    api.moderation.getFlaggedReports,
    isModerator ? {} : "skip",
  );
  const dismissFlag = useMutation(api.moderation.dismissFlag);

  const handleDismiss = async (reportId: string) => {
    setError(null);
    setDismissingId(reportId);
    try {
      await dismissFlag({ reportId: reportId as Id<"reports"> });
      AccessibilityInfo.announceForAccessibility("Flags dismissed.");
    } catch (caught) {
      const message = moderationErrorMessage(classifyModerationError(caught));
      AccessibilityInfo.announceForAccessibility(message);
      setError(message);
    } finally {
      setDismissingId((current) => (current === reportId ? null : current));
    }
  };

  const title = <Stack.Screen options={{ title: "Moderation queue" }} />;

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
              Sign in to continue
            </AppText>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Go to sign in"
              onPress={() => router.replace("/sign-in")}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
                Sign in
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
              Moderators only
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Your account doesn&apos;t have access to the moderation queue.
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  if (flagged === undefined) {
    return (
      <>
        {title}
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Loading flagged reports…
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      {title}
      <Screen edges={["left", "right", "bottom"]}>
        <View style={styles.body}>
          {error ? (
            <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </AppText>
          ) : null}
          <FlatList
            style={styles.list}
            data={flagged}
            keyExtractor={(item) => item.reportId}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <AppText variant="title" accessibilityRole="header">
                {flagged.length} flagged{" "}
                {flagged.length === 1 ? "report" : "reports"}
              </AppText>
            }
            ListEmptyComponent={
              <AppText style={{ color: colors.textMuted }}>
                No flagged reports. Nothing needs review.
              </AppText>
            }
            renderItem={({ item }) => (
              <FlaggedReportRow
                item={item}
                isDismissing={dismissingId === item.reportId}
                onDismiss={(reportId) => void handleDismiss(reportId)}
              />
            )}
          />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
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
