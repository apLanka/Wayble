import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

/**
 * Debug-only tool: load the bundled 155-place dataset into Convex so the
 * nearby list and map have rows to show without hand-typing each one.
 *
 * The button stays mounted and reports the mutation's counts rather than
 * disappearing afterwards — the interesting outcome is usually "skipped 155",
 * which is how you find out the database was already seeded.
 *
 * The seed is idempotent server-side, so pressing this twice is harmless; the
 * `isPending` guard is here to stop a double-tap firing two mutations rather
 * than because the second would corrupt anything.
 */
export function LoadAllPlacesButton() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const seedAllPlaces = useMutation(api.seed.seedAllPlaces);

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePress = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { inserted, skipped, total } = await seedAllPlaces({});
      setResult(
        inserted === 0
          ? `Nothing to do — all ${total} already loaded (${skipped} skipped).`
          : `Loaded ${inserted} of ${total} places${skipped > 0 ? `, ${skipped} already existed` : ""}.`,
      );
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to load the places dataset.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        Seed data
      </AppText>
      <AppText variant="label" style={{ color: colors.textMuted }}>
        Loads 155 sample public places around Colombo. Accessibility tags are
        synthetic, not real observations.
      </AppText>

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Load all sample places"
        accessibilityHint="Adds the bundled sample places to the database so the nearby list has data"
        focusColor={colors.onPrimary}
        disabled={isSubmitting}
        onPress={() => void handlePress()}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: isSubmitting ? 0.7 : 1,
          },
        ]}
      >
        <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
          {isSubmitting ? "Loading…" : "Load all places"}
        </AppText>
      </TouchTarget>

      {result ? (
        <AppText
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{ color: colors.success }}
        >
          {result}
        </AppText>
      ) : null}

      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  button: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
