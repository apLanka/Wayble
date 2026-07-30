import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SettingsScreen() {
  const { appTheme } = useAppTheme();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);

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
  signOutButton: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
