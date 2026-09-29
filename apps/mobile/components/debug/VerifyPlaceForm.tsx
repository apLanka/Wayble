import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

// Debug-only tool: exercises the report/verification pipeline end to end —
// pick a place, cast a confirm/dispute vote, watch its confidence tier move
// on the place details screen. No auth UI needed for this; see reports.ts.
export function VerifyPlaceForm() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const places = useQuery(api.places.listPlaces);
  const addVerification = useMutation(api.reports.debugAddVerification);

  const [placeId, setPlaceId] = useState<Id<"places"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const vote = async (verdict: "confirm" | "dispute") => {
    if (!placeId) return;
    setIsSubmitting(true);
    try {
      await addVerification({ placeId, verdict });
      setToast(verdict === "confirm" ? "Confirmed." : "Disputed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <AppText variant="title" accessibilityRole="header">
        Verify place
      </AppText>

      {places === undefined ? (
        <AppText style={{ color: colors.textMuted }}>Loading places…</AppText>
      ) : places.length === 0 ? (
        <AppText style={{ color: colors.textMuted }}>
          No places yet — add one above first.
        </AppText>
      ) : (
        <View style={styles.categories}>
          {places.map((p) => {
            const isActive = p._id === placeId;
            return (
              <TouchTarget
                key={p._id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={p.name}
                onPress={() => setPlaceId(p._id)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="label"
                  style={{ color: isActive ? colors.onPrimary : colors.text }}
                >
                  {p.name}
                </AppText>
              </TouchTarget>
            );
          })}
        </View>
      )}

      <View style={styles.row}>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Confirm report"
          accessibilityHint="Adds a confirm verification vote to this place's report"
          disabled={!placeId || isSubmitting}
          onPress={() => void vote("confirm")}
          style={[
            styles.voteButton,
            {
              backgroundColor: colors.success,
              opacity: !placeId || isSubmitting ? 0.5 : 1,
            },
          ]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
            Confirm
          </AppText>
        </TouchTarget>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Dispute report"
          accessibilityHint="Adds a dispute verification vote to this place's report"
          disabled={!placeId || isSubmitting}
          onPress={() => void vote("dispute")}
          style={[
            styles.voteButton,
            {
              backgroundColor: colors.danger,
              opacity: !placeId || isSubmitting ? 0.5 : 1,
            },
          ]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
            Dispute
          </AppText>
        </TouchTarget>
      </View>

      {toast ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { backgroundColor: colors.success }]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
            {toast}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  voteButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
});
