import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from "react-native";

import { ReportCard } from "@/components/place/ReportCard";
import {
  classifyVerificationError,
  verificationErrorMessage,
} from "@/components/place/verification-errors";
import {
  applyVerdictChange,
  type Verdict,
} from "@/components/place/verification-tally";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

/**
 * US-10 — every active report on a place, each independently verifiable.
 *
 * The first screen in the app that shows reports as records rather than as a
 * count and a flattened aggregate, which is what verification requires.
 */
export default function PlaceReportsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const [error, setError] = useState<string | null>(null);
  // Counts vote attempts, and identifies which one a `catch` belongs to.
  const latestAttempt = useRef(0);

  const placeId = id as Id<"places"> | undefined;
  const currentUser = useQuery(api.users.currentUser);
  const reports = useQuery(
    api.reports.listForPlace,
    placeId ? { placeId } : "skip",
  );

  const verifyReport = useMutation(
    api.verifications.verifyReport,
  ).withOptimisticUpdate((store, args) => {
    // Nothing to patch when there is no place: the query was started with
    // `"skip"`, so there is no cache entry to write back to.
    if (!placeId) return;
    const cached = store.getQuery(api.reports.listForPlace, { placeId });
    if (!cached) return;
    // `applyVerdictChange` is the same arithmetic the server applies, so the
    // tally on screen is the tally that settles rather than one that has to
    // be corrected when the mutation comes back. Only the voted report is
    // replaced; the rest of the list is carried over untouched.
    store.setQuery(
      api.reports.listForPlace,
      { placeId },
      cached.map((report) =>
        report._id === args.reportId
          ? {
              ...report,
              ...applyVerdictChange(
                {
                  confirmCount: report.confirmCount,
                  disputeCount: report.disputeCount,
                  myVerdict: report.myVerdict,
                },
                args.verdict,
              ),
            }
          : report,
      ),
    );
  });

  const handleVote = async (reportId: string, verdict: Verdict) => {
    // Cleared up front, so a failure that has since been superseded does not
    // sit next to a control the user has just used successfully.
    setError(null);
    // `VerifyControl` has no in-flight guard, so two taps can be on the wire at
    // once and they can settle out of order. This token is what tells the two
    // apart: only the newest attempt is allowed to write to the screen, so a
    // failure that arrives after a later vote has already succeeded is dropped
    // rather than pasted over a tally that is now correct.
    const attempt = ++latestAttempt.current;
    try {
      // `ReportCard` widens the report id to `string` because it reads the id
      // off its own data, so the branded id the mutation demands is restored
      // here. The same cast `place/[id]/index.tsx` makes for a place id, and
      // the value is unchanged by it.
      await verifyReport({ reportId: reportId as Id<"reports">, verdict });
      // After the await, not before: the optimistic patch is already visible
      // and the tally text is what changed, so that is what to announce.
      AccessibilityInfo.announceForAccessibility(
        verdict === "confirm" ? "Report confirmed." : "Report disputed.",
      );
    } catch (caught) {
      if (attempt !== latestAttempt.current) return;
      const message = verificationErrorMessage(
        classifyVerificationError(caught),
      );
      AccessibilityInfo.announceForAccessibility(message);
      // Surfaced inline rather than in an alert so it sits next to the
      // control the user just pressed.
      setError(message);
    }
  };

  // Signed out, there is nothing this screen can do: the server rejects every
  // vote, so offering the list would only hand the user a control that cannot
  // work. The same shape the US-08 report form uses for the same reason, and
  // checked ahead of the reports query so a signed-out visitor is offered the
  // way out immediately rather than after a load they cannot benefit from.
  if (currentUser === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Reports" }} />
        <Screen>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              Sign in to verify a report
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Confirming or disputing a report is tied to your account, so
              people know who agreed with what.
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

  if (reports === undefined) {
    return (
      <>
        <Stack.Screen options={{ title: "Reports" }} />
        <Screen>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Loading reports…
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Reports" }} />
      <Screen>
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              {/* `alert` as well as the announcement in `handleVote`, so the
                  failure is not only available to whoever happens to be
                  looking at the top of the list. */}
              {error ? (
                <AppText
                  accessibilityRole="alert"
                  style={{ color: colors.danger }}
                >
                  {error}
                </AppText>
              ) : null}
              <AppText variant="title" accessibilityRole="header">
                {reports.length} {reports.length === 1 ? "report" : "reports"}
              </AppText>
            </View>
          }
          ListEmptyComponent={
            <AppText style={{ color: colors.textMuted }}>
              No reports on this place yet.
            </AppText>
          }
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              currentUserId={currentUser?._id}
              onVote={(reportId, verdict) => void handleVote(reportId, verdict)}
            />
          )}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.sm,
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
