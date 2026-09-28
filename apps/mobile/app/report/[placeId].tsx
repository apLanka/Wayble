import { useCallback, useEffect, useReducer, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";

import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  AccessibilityAttribute,
  AccessibilityAttributeKey,
} from "@packages/backend/convex/accessibility";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { AttributesStep } from "@/components/report/AttributesStep";
import { CategoryStep } from "@/components/report/CategoryStep";
import { ConfirmStep } from "@/components/report/ConfirmStep";
import { NotesStep } from "@/components/report/NotesStep";
import { StepIndicator, stepTitle } from "@/components/report/StepIndicator";
import {
  REPORT_STEPS,
  canAdvance,
  emptyDraft,
  reportReducer,
  selectedAttributes,
  type ReportDraft,
} from "@/components/report/report-draft";
import {
  classifyReportError,
  reportErrorMessage,
} from "@/components/report/report-errors";
import { radii, spacing } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";

/**
 * US-08 — the four-step accessibility report wizard.
 *
 * All draft state is local and nothing is written until the final submit, so
 * backing out of a step never leaves a half-finished report behind and there
 * is exactly one failure path to handle.
 */
export default function ReportScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  // Never seeded from anywhere, and `setSummary` is dispatched from
  // `NotesStep` alone: the reducer stores the summary verbatim, so
  // `NotesStep`'s `maxLength` has to stay the only thing bounding what its
  // `onChangeText` can hand the reducer, for its character counter to be
  // able to reach zero without going negative.
  const [draft, dispatch] = useReducer(reportReducer, emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const placeIdArg = placeId as Id<"places"> | undefined;
  const currentUser = useQuery(api.users.currentUser);
  const place = useQuery(
    api.places.getPlace,
    placeIdArg ? { placeId: placeIdArg } : "skip",
  );

  /**
   * Optimistically splice the new report into the cached place detail, so
   * the place screen the user lands on already shows it. Convex reverts the
   * patch automatically if the mutation throws.
   *
   * `getPlace` keeps, per key, the attribute from the report with the
   * greatest `observedAt`, and this overwrites every key the new report
   * mentions. That matches what the server computes *provided* the new
   * `observedAt` is at least as great as every existing report's — which
   * holds only while the submitting device's clock is ahead of them all.
   * `observedAt` is the device's clock at submit, and the server accepts
   * anything from a year old to five minutes ahead, so a device sitting
   * behind the existing reports makes the server keep their older value
   * instead. The stored report is correct either way; the optimistic display
   * is briefly wrong and corrects itself on the next sync.
   *
   * `getPlace` flattens its aggregate to a bare `AccessibilityAttribute[]`,
   * discarding the per-key timestamps, so the client cannot detect that case
   * and cannot do better than patch optimistically. Resolving it means
   * changing the shape of a query other screens already consume, which is a
   * follow-up rather than this task.
   */
  const submitReport = useMutation(
    api.reports.submitReport,
  ).withOptimisticUpdate((localStore, args) => {
    const cached = localStore.getQuery(api.places.getPlace, {
      placeId: args.placeId,
    });
    if (!cached) return;

    // A key the new report sets overwrites the cached value and a key it
    // omits keeps it, which is what the server's aggregate does too. And
    // `reportCount` counts reports rather than attributes, which is why it
    // goes up by exactly one.
    const merged = new Map<AccessibilityAttributeKey, AccessibilityAttribute>(
      cached.attributes.map((a) => [a.key, a]),
    );
    for (const attribute of args.attributes) {
      merged.set(attribute.key, attribute);
    }

    localStore.setQuery(
      api.places.getPlace,
      { placeId: args.placeId },
      {
        ...cached,
        attributes: Array.from(merged.values()),
        reportCount: cached.reportCount + 1,
        lastReportedAt: Math.max(cached.lastReportedAt ?? 0, args.observedAt),
      },
    );
  });

  const goTo = useCallback((step: number) => {
    // Any step change ends the previous submit attempt, so its banner must
    // not follow the user to the next step still reading as a live failure.
    setError(null);
    dispatch({ type: "goToStep", step });
    const title = stepTitle(step);
    if (title) {
      AccessibilityInfo.announceForAccessibility(
        `Step ${step + 1} of ${REPORT_STEPS.length}: ${title}`,
      );
    }
  }, []);

  // Hardware back walks the wizard before it leaves the screen, so a
  // four-step form does not dump the whole draft on the first back press.
  // The handler reads `draft.step` and the subscription is re-created
  // whenever that changes, so it can never act on a step the user has
  // already left.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (draft.step === 0) return false;
        dispatch({ type: "back" });
        const title = stepTitle(draft.step - 1);
        AccessibilityInfo.announceForAccessibility(
          `Step ${draft.step} of ${REPORT_STEPS.length}: ${title}`,
        );
        return true;
      },
    );
    return () => subscription.remove();
  }, [draft.step]);

  const handleSubmit = useCallback(async () => {
    if (!placeIdArg || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await submitReport({
        placeId: placeIdArg,
        attributes: selectedAttributes(draft),
        // Trimmed here, at the boundary, rather than on every keystroke —
        // see the setSummary reducer for why the draft keeps the raw text.
        summary:
          draft.summary.trim().length > 0 ? draft.summary.trim() : undefined,
        observedAt: Date.now(),
      });
      // The place screen, not `router.back()`: this route is registered in
      // the root Stack and so can be opened by deep link, where there is no
      // history to pop and the wizard would simply sit there completed.
      // `dismissTo` pops to the place screen the wizard was pushed from when
      // there is one, and replaces the wizard with it when there is not, so
      // the outcome does not depend on how the route was entered. Because
      // the submit patched that place's cached query, whichever screen the
      // user lands on already shows the new attributes — that is the visible
      // confirmation, and it is why nothing else has to report success.
      // Announced after the navigation, since a view-controller transition
      // commonly drops an announcement queued in the same tick as it.
      router.dismissTo({
        pathname: "/place/[id]",
        params: { id: placeIdArg },
      });
      AccessibilityInfo.announceForAccessibility(
        "Report submitted. Thank you.",
      );
    } catch (caught) {
      // Convex reverts the optimistic patch on failure; all that is left is
      // to tell the user in plain language rather than raw server jargon.
      const message = reportErrorMessage(classifyReportError(caught));
      setError(message);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, isSubmitting, placeIdArg, router, submitReport]);

  /**
   * `goToStep` bypasses the `canAdvance` gate, so a programmatic step
   * change could reach step four with no category — and `ConfirmStep` would
   * render a bare " · 3 attributes" with nothing before the dot. Nothing on
   * this screen can do that, but a wizard must not be able to display an
   * invalid state, so the draft is pinned to the first step until a category
   * exists. Outside that case this is the same object, not a copy.
   */
  const safeDraft: ReportDraft =
    draft.category === null ? { ...draft, step: 0 } : draft;
  const step = safeDraft.step;

  if (currentUser === undefined) {
    return (
      <>
        <Stack.Screen
          options={{ title: STRINGS.navigation.titles.reportAccessibility }}
        />
        <Screen>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              {STRINGS.report.account.checking}
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  if (currentUser === null) {
    return (
      <>
        <Stack.Screen
          options={{ title: STRINGS.navigation.titles.reportAccessibility }}
        />
        <Screen>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              {STRINGS.report.account.signedOutTitle}
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              {STRINGS.report.account.signedOutBody}
            </AppText>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={STRINGS.report.account.signInLabel}
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

  if (placeIdArg === undefined) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText style={{ color: colors.danger }}>
            {STRINGS.report.account.missingPlace}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: STRINGS.navigation.titles.reportAccessibility }}
      />
      <Screen>
        <View style={styles.header}>
          <StepIndicator step={step} />
          {/* The place is named on every step, not just the last one, so
              the submit button's "for this place" has a visible antecedent
              above it instead of an implied one. */}
          {place?.name ? (
            <AppText variant="label" style={{ color: colors.textMuted }}>
              {STRINGS.report.account.reportingOn(place.name)}
            </AppText>
          ) : null}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.danger + "1A",
                  borderColor: colors.danger,
                },
              ]}
            >
              <AppText style={{ color: colors.danger }}>{error}</AppText>
            </View>
          ) : null}

          {step === 0 ? (
            <CategoryStep
              selected={draft.category}
              onSelect={(category) => {
                dispatch({ type: "chooseCategory", category });
                // Through the helper, not two raw dispatches: the most-used
                // forward transition in the wizard has to announce the step
                // it lands on like every other one does.
                goTo(1);
              }}
            />
          ) : null}

          {step === 1 && safeDraft.category ? (
            <AttributesStep
              category={safeDraft.category}
              draft={safeDraft}
              dispatch={dispatch}
            />
          ) : null}

          {step === 2 ? (
            <NotesStep draft={safeDraft} dispatch={dispatch} />
          ) : null}

          {step === 3 ? (
            <ConfirmStep
              draft={safeDraft}
              isSubmitting={isSubmitting}
              onSubmit={() => void handleSubmit()}
            />
          ) : null}
        </ScrollView>

        {/* Back is shown on every step after the first, the confirm step
            included: someone who spots one wrong value on the last screen
            has to be able to correct it, and the header chevron would pop
            the route and discard the whole draft. Next stops at the confirm
            step, where `canAdvance` is false by design and the step's own
            submit button is the action — so the wizard can never advance
            past the submit. Steps 1 and 2 can always be left forwards, as
            `canAdvance` is true on step 2. */}
        {step > 0 ? (
          <View style={styles.footer}>
            {/* `step > 0` gates this footer and `step === 0` is its exact
                complement, so that half of the guard below is unreachable
                today; kept so the two cannot disagree if the gate is ever
                relaxed. The `isSubmitting` half is the live one, and it
                drives the dimming too — `disabled` alone gives a screen
                reader the state but a sighted user no visual cue, and
                `ConfirmStep` already dims its own submit for that reason. */}
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={STRINGS.report.backLabel}
              disabled={isSubmitting || step === 0}
              onPress={() => goTo(step - 1)}
              style={[
                styles.footerButton,
                {
                  borderColor: colors.border,
                  opacity: isSubmitting || step === 0 ? 0.5 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.text }}>
                {STRINGS.report.back}
              </AppText>
            </TouchTarget>
            {step < 3 ? (
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={STRINGS.report.continueToLabel(
                  stepTitle(step + 1, STRINGS.report.nextStepFallback),
                )}
                accessibilityState={{ disabled: !canAdvance(safeDraft) }}
                disabled={!canAdvance(safeDraft)}
                onPress={() => goTo(step + 1)}
                style={[
                  styles.footerButton,
                  {
                    backgroundColor: canAdvance(safeDraft)
                      ? colors.primary
                      : colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText
                  variant="bodyStrong"
                  style={{
                    color: canAdvance(safeDraft)
                      ? colors.onPrimary
                      : colors.textMuted,
                  }}
                >
                  {STRINGS.report.next}
                </AppText>
              </TouchTarget>
            ) : null}
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  centeredText: {
    textAlign: "center",
  },
});
