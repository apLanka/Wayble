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
import { StepIndicator, STEP_TITLES } from "@/components/report/StepIndicator";
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
  // `NotesStep`'s `maxLength` has to stay the only writer for its
  // character counter to be able to reach zero without going negative.
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
   * the screen behind this form already shows it when `router.back()`
   * returns. `getPlace` aggregates last-write-wins on `observedAt`, and this
   * report is the newest by construction, so a straight overwrite of each
   * key matches what the server will compute. Convex reverts the patch
   * automatically if the mutation throws.
   */
  const submitReport = useMutation(
    api.reports.submitReport,
  ).withOptimisticUpdate((localStore, args) => {
    const cached = localStore.getQuery(api.places.getPlace, {
      placeId: args.placeId,
    });
    if (!cached) return;

    // The new report is the newest one, so a key it sets overwrites the
    // cached value and a key it omits keeps it. `reportCount` counts
    // reports rather than attributes, which is why it goes up by exactly
    // one. Both match the aggregate `getPlace` will recompute.
    //
    // A concurrent report written at a clock-skewed `observedAt` in the
    // future is the one input that would make the server keep its value
    // instead, and the next sync of the query corrects the difference.
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
    const title = STEP_TITLES[REPORT_STEPS[step] ?? ""] ?? "";
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
        const title = STEP_TITLES[REPORT_STEPS[draft.step - 1] ?? ""] ?? "";
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
      AccessibilityInfo.announceForAccessibility(
        "Report submitted. Thank you.",
      );
      router.back();
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
        <Stack.Screen options={{ title: "Report accessibility" }} />
        <Screen>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Checking your account…
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  if (currentUser === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Report accessibility" }} />
        <Screen>
          <View style={styles.centered}>
            <AppText variant="title" accessibilityRole="header">
              Sign in to submit a report
            </AppText>
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Reports are tied to your account so other people can confirm or
              dispute what you observed.
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

  if (placeIdArg === undefined) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText style={{ color: colors.danger }}>
            This report form is missing a place. Go back and try again.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Report accessibility" }} />
      <Screen>
        <View style={styles.header}>
          <StepIndicator step={step} />
          {/* The place is named on every step, not just the last one, so
              the submit button's "for this place" has a visible antecedent
              above it instead of an implied one. */}
          {place?.name ? (
            <AppText variant="label" style={{ color: colors.textMuted }}>
              Reporting on {place.name}
            </AppText>
          ) : null}
        </View>

        <ScrollView
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
                dispatch({ type: "goToStep", step: 1 });
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
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Go back a step"
              disabled={step === 0}
              onPress={() => goTo(step - 1)}
              style={[
                styles.footerButton,
                {
                  borderColor: colors.border,
                  opacity: step === 0 ? 0.5 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.text }}>
                Back
              </AppText>
            </TouchTarget>
            {step < 3 ? (
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={`Continue to ${
                  REPORT_STEPS[step + 1] ?? "next step"
                }`}
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
                  Next
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
