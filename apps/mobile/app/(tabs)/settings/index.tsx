import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
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
  const needsSummary = STRINGS.profile.needsSummary(
    currentUser != null,
    needsCount,
  );

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
            {STRINGS.settings.title}
          </AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            {STRINGS.settings.body}
          </AppText>
        </View>

        {/* Account Card */}
        <View
          accessible
          accessibilityLabel={STRINGS.settings.account.a11yLabel}
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">{STRINGS.settings.account.section}</AppText>
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
              {STRINGS.settings.account.signedOut}
            </AppText>
          )}

          <TouchTarget
            accessibilityLabel={STRINGS.profile.signOut.label}
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
              {STRINGS.profile.signOut.button}
            </AppText>
          </TouchTarget>
        </View>

        {/* Accessibility Needs Card */}
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={STRINGS.profile.navRowLabel(
            STRINGS.profile.accessibilityNeedsTitle,
            needsSummary,
          )}
          accessibilityHint={STRINGS.profile.needsLinkHint}
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
            <AppText variant="label">
              {STRINGS.profile.accessibilityNeedsTitle}
            </AppText>
            <AppText style={{ color: appTheme.colors.textMuted }}>
              {needsSummary}
            </AppText>
          </View>
          <AppText
            variant="bodyStrong"
            style={{ color: appTheme.colors.textMuted }}
          >
            {STRINGS.common.chevron}
          </AppText>
        </TouchTarget>

        {/* Theme Card */}
        <View
          accessible
          accessibilityLabel={STRINGS.settings.theme.label(appTheme.mode)}
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">{STRINGS.settings.theme.title}</AppText>
          <AppText>
            {appTheme.mode === "dark"
              ? STRINGS.settings.theme.dark
              : STRINGS.settings.theme.light}
          </AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            {STRINGS.settings.theme.body}
          </AppText>
        </View>

        {/* Location Card */}
        <View
          accessible
          accessibilityLabel={STRINGS.settings.location.a11yLabel}
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">{STRINGS.settings.location.section}</AppText>
          <AppText>
            {STRINGS.settings.location.statusPrefix}
            {STRINGS.settings.location.status(status ?? "undetermined")}
          </AppText>
          <TouchTarget
            accessibilityLabel={STRINGS.settings.location.openOsSettings}
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
            <AppText variant="bodyStrong">
              {STRINGS.permissions.location.openSettings}
            </AppText>
          </TouchTarget>
        </View>

        {/* Developer */}
        <View
          accessible
          accessibilityLabel={STRINGS.settings.developer.a11yLabel}
          style={[
            styles.statusCard,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="label">
            {STRINGS.settings.developer.section}
          </AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            {STRINGS.settings.developer.body}
          </AppText>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel={STRINGS.settings.developer.openLabel}
            accessibilityHint={STRINGS.settings.developer.openHint}
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
              {STRINGS.settings.developer.openButton}
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
