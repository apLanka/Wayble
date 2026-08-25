import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLocationPermission } from "@/hooks/use-location-permission";

export default function SettingsScreen() {
  const { appTheme } = useAppTheme();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);
  const { status } = useLocationPermission();

  const needsCount = currentUser?.accessibilityNeeds?.length ?? 0;
  const needsSummary =
    currentUser == null
      ? "Sign in to set your needs"
      : needsCount === 0
        ? "Not set yet"
        : `${needsCount} need${needsCount === 1 ? "" : "s"} selected`;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

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
            Manage your account and app preferences.
          </AppText>
        </View>

        {/* Account Card */}
        <View
          accessible
          accessibilityLabel="Account information"
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">Account</AppText>
          {currentUser === undefined ? (
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
          ) : currentUser ? (
            <View style={styles.accountDetails}>
              <AppText variant="bodyStrong">
                {currentUser.displayName || currentUser.name || "User"}
              </AppText>
              <AppText style={{ color: appTheme.colors.textMuted }}>
                {currentUser.email || "No email"}
              </AppText>
              <AppText
                style={{ color: appTheme.colors.textMuted, fontSize: 13 }}
              >
                Role: {currentUser.role || "member"}
              </AppText>
            </View>
          ) : (
            <AppText style={{ color: appTheme.colors.textMuted }}>
              Not signed in
            </AppText>
          )}

          <TouchTarget
            accessibilityLabel="Sign out of your account"
            accessibilityRole="button"
            onPress={handleSignOut}
            style={[
              styles.signOutButton,
              {
                backgroundColor: appTheme.colors.danger + "1A",
                borderColor: appTheme.colors.danger,
              },
            ]}
          >
            <AppText
              variant="bodyStrong"
              style={{ color: appTheme.colors.danger }}
            >
              Sign Out
            </AppText>
          </TouchTarget>
        </View>

        {/* Accessibility Needs Card */}
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={`Accessibility needs. ${needsSummary}`}
          accessibilityHint="Opens the screen where you choose the accessibility features you need"
          onPress={() => router.push("/(tabs)/profile/accessibility-needs")}
          style={[
            styles.statusCard,
            styles.navCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <View style={styles.navCardText}>
            <AppText variant="label">Accessibility needs</AppText>
            <AppText style={{ color: appTheme.colors.textMuted }}>
              {needsSummary}
            </AppText>
          </View>
          <AppText
            variant="bodyStrong"
            style={{ color: appTheme.colors.textMuted }}
          >
            ›
          </AppText>
        </TouchTarget>

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
              styles.signOutButton, // Reuse style since it matches layout needs
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
    paddingVertical: spacing.xl,
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
  accountDetails: {
    gap: spacing.xs,
  },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navCardText: {
    flex: 1,
    gap: spacing.xs,
  },
  signOutButton: {
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
