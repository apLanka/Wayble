import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLocationPermission } from "@/hooks/use-location-permission";

export default function SettingsScreen() {
  const { appTheme } = useAppTheme();
  const router = useRouter();
  const { status } = useLocationPermission();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <AppText variant="title" accessibilityRole="header">
            Settings
          </AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            Manage app preferences.
          </AppText>
        </View>

        {/* Theme Card */}
        <View
          accessible
          accessibilityLabel={`Theme: ${appTheme.mode}`}
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">Current theme</AppText>
          <AppText>{appTheme.mode === "dark" ? "Dark" : "Light"}</AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            Follows your device appearance setting.
          </AppText>
        </View>

        {/* Location Card */}
        <View
          accessible
          accessibilityLabel="Location permissions"
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">Location</AppText>
          <AppText>
            Status:{" "}
            {status === "granted"
              ? "Granted"
              : status === "denied"
                ? "Denied"
                : "Undetermined"}
          </AppText>
          <TouchTarget
            accessibilityLabel="Open OS settings for location"
            accessibilityRole="button"
            onPress={() => Linking.openSettings()}
            style={[
              styles.actionButton,
              {
                backgroundColor: appTheme.colors.surface,
                borderColor: appTheme.colors.border,
              },
            ]}
          >
            <AppText variant="bodyStrong">Open Settings</AppText>
          </TouchTarget>
        </View>

        {/* Developer */}
        <View
          accessible
          accessibilityLabel="Developer tools"
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">Developer</AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            Convex connection health check and debug utilities.
          </AppText>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel="Open debug screen"
            accessibilityHint="Opens the Convex connection health check"
            focusColor={appTheme.colors.onPrimary}
            onPress={() => router.push("/debug")}
            style={[
              styles.debugButton,
              { backgroundColor: appTheme.colors.primary },
            ]}
          >
            <AppText
              variant="bodyStrong"
              style={{ color: appTheme.colors.onPrimary }}
            >
              Open debug screen
            </AppText>
          </TouchTarget>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  statusCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionButton: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  debugButton: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
