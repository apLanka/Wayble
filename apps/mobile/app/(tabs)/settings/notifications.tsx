import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import { Screen } from "@/components/ui/screen";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLocationReporter } from "@/hooks/use-location-reporter";
import { usePushRegistration } from "@/hooks/use-push-registration";

const RADIUS_CHOICES = [
  { meters: 500, label: "Within 500 m" },
  { meters: 2000, label: "Within 2 km" },
  { meters: 5000, label: "Within 5 km" },
];

/**
 * US-21 — opt in to notifications asking you to verify a nearby place.
 *
 * Off by default. Enabling requests OS notification permission and registers
 * this device; if either step fails the toggle does not flip, so the UI never
 * claims notifications are on when they cannot arrive.
 */
export default function NotificationSettingsScreen() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const currentUser = useQuery(api.users.currentUser);
  const updatePrefs = useMutation(api.users.updateNotificationPrefs);
  const { permission, requestAndRegister, unregister } = usePushRegistration();
  const [error, setError] = useState<string | null>(null);

  const enabled = currentUser?.verifyNearbyEnabled === true;
  const radius = currentUser?.verifyNearbyRadiusMeters ?? 2000;

  // Only report location while the user has actually opted in.
  useLocationReporter(enabled);

  if (currentUser === undefined) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (currentUser === null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText variant="bodyStrong" accessibilityRole="header">
            Sign in to manage notifications
          </AppText>
        </View>
      </Screen>
    );
  }

  const handleToggle = async () => {
    setError(null);
    try {
      if (enabled) {
        await updatePrefs({ verifyNearbyEnabled: false });
        await unregister();
        return;
      }
      const ok = await requestAndRegister();
      if (!ok) {
        setError(
          permission === "denied"
            ? "Notifications are blocked for Wayble. Enable them in your device settings, then try again."
            : "Couldn't set up notifications on this device. Push notifications need a real device, not a simulator.",
        );
        return;
      }
      await updatePrefs({ verifyNearbyEnabled: true });
    } catch {
      setError("Couldn't save that change. Check your connection.");
    }
  };

  const handleRadius = async (meters: number) => {
    setError(null);
    try {
      await updatePrefs({ verifyNearbyRadiusMeters: meters });
    } catch {
      setError("Couldn't save that change. Check your connection.");
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={{ color: colors.textMuted }}>
          Get a notification when you&apos;re near a place whose accessibility
          information is missing or out of date, so you can check it while
          you&apos;re there.
        </AppText>

        {error ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.banner,
              {
                backgroundColor: colors.danger + "1A",
                borderColor: colors.danger,
              },
            ]}
          >
            <AppText style={{ color: colors.danger }}>{error}</AppText>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <CheckboxRow
            label="Notify me about nearby places"
            icon="🔔"
            checked={enabled}
            onToggle={() => void handleToggle()}
            accessibilityHint="Asks for notification permission the first time you turn this on"
          />
        </View>

        {enabled ? (
          <View style={styles.section}>
            <AppText
              variant="label"
              accessibilityRole="header"
              style={[styles.header, { color: colors.textMuted }]}
            >
              How close
            </AppText>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {RADIUS_CHOICES.map((choice) => (
                <CheckboxRow
                  key={choice.meters}
                  label={choice.label}
                  checked={radius === choice.meters}
                  onToggle={() => void handleRadius(choice.meters)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="label">What we store</AppText>
          <AppText style={{ color: colors.textMuted }}>
            While this is on, Wayble records your approximate location when you
            open the app — rounded to about 110 metres, never your exact
            position, and never in the background. Turn this off and we stop.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.xl, paddingVertical: spacing.xl },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  section: { gap: spacing.sm },
  header: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  banner: { borderRadius: radii.md, borderWidth: 1, padding: spacing.md },
});
