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
import { STRINGS } from "@/constants/strings";
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
    //
    // It is incremented at the *tap*, not when the mutation settles, so it
    // orders attempts by intent: the newer tap is the one the user is waiting
    // on, and an older attempt that settles late has been overtaken no matter
    // how it settled. Both the success path and the `catch` below are gated on
    // it, and they have to be gated together — the announcement is as much a
    // write to the screen as the banner is, and a screen-reader user hears it
    // in place of the banner. Gating only the `catch` would let a stale success
    // announce "Report confirmed." on top of a live error saying the vote
    // failed.
    const attempt = ++latestAttempt.current;
    try {
      // `ReportCard` widens the report id to `string` because it reads the id
      // off its own data, so the branded id the mutation demands is restored
      // here. The same cast `place/[id]/index.tsx` makes for a place id, and
      // the value is unchanged by it.
      await verifyReport({ reportId: reportId as Id<"reports">, verdict });
      if (attempt !== latestAttempt.current) return;
      // After the await, not before: the optimistic patch is already visible
      // and the tally text is what changed, so that is what to announce.
      AccessibilityInfo.announceForAccessibility(
        verdict === "confirm"
          ? STRINGS.announcements.reportConfirmed
          : STRINGS.announcements.reportDisputed,
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
        <Stack.Screen
          options={{
            title: STRINGS.place.reports.title,
            headerBackTitle: STRINGS.navigation.back,
          }}
        />
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              {STRINGS.place.reports.signedOutTitle}
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              {STRINGS.place.reports.signedOutBody}
            </AppText>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={STRINGS.report.account.signInLabel}
              accessibilityHint={STRINGS.report.account.verifySignInHint}
              onPress={() => router.replace("/sign-in")}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
                {STRINGS.common.signIn}
              </AppText>
            </TouchTarget>
          </View>
        </Screen>
      </>
    );
  }

  // `undefined` is "still loading" and `null` is "signed out", so the two have
  // to stay distinguishable: the gate below waits on the session so no card
  // renders before it is known, while the branch above answers a known-signed
  // -out visitor immediately. Without the `currentUser` half of the gate, a card
  // would render in the window before the session resolved with
  // `currentUser?._id` undefined, which makes `isOwnReport` false for the
  // caller's own report and shows them live controls on it — the server still
  // rejects the vote, so there is no security hole, only a tap that is bound to
  // fail and produce an error banner.
  if (currentUser === undefined || reports === undefined) {
    return (
      <>
        <Stack.Screen
          options={{
            title: STRINGS.place.reports.title,
            headerBackTitle: STRINGS.navigation.back,
          }}
        />
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              {STRINGS.place.reports.loading}
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: STRINGS.place.reports.title,
          headerBackTitle: STRINGS.navigation.back,
        }}
      />
      <Screen edges={["left", "right", "bottom"]}>
        {/* The banner is a sibling of the list, not part of its header. A vote
            can fail on a card below the fold, and inside `ListHeaderComponent`
            the message scrolls away with the list, so a sighted user gets no
            failure feedback at all and only the screen-reader announcement
            covers it. `accessibilityRole="alert"` stays, so the banner is still
            announced when it appears without moving.
            The wrapper takes the remaining height and the list flexes inside
            it, so a long list scrolls instead of pushing the banner off-screen. */}
        <View style={styles.body}>
          {error ? (
            <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </AppText>
          ) : null}
          <FlatList
            style={styles.list}
            data={reports}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <AppText variant="title" accessibilityRole="header">
                {STRINGS.place.reports.header(reports.length)}
              </AppText>
            }
            ListEmptyComponent={
              <AppText style={{ color: colors.textMuted }}>
                {STRINGS.place.reports.empty}
              </AppText>
            }
            renderItem={({ item }) => (
              <ReportCard
                report={item}
                currentUserId={currentUser?._id}
                onVote={(reportId, verdict) =>
                  void handleVote(reportId, verdict)
                }
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
