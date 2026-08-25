import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { EditDisplayNameModal } from "@/components/profile/EditDisplayNameModal";
import { GuestProfilePrompt } from "@/components/profile/GuestProfilePrompt";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileNavRow } from "@/components/profile/ProfileNavRow";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getAccessibilityNeedsSummary } from "@/utils/get-accessibility-needs-summary";

export default function ProfileScreen() {
  const { appTheme } = useAppTheme();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const updateProfile = useMutation(
    api.users.updateProfile,
  ).withOptimisticUpdate((localStore, args) => {
    const user = localStore.getQuery(api.users.currentUser, {});
    if (!user) return;

    localStore.setQuery(
      api.users.currentUser,
      {},
      {
        ...user,
        ...(args.displayName !== undefined && {
          displayName: args.displayName,
        }),
        ...(args.accessibilityNeeds !== undefined && {
          accessibilityNeeds: args.accessibilityNeeds,
        }),
      },
    );
  });

  const needsSummary = getAccessibilityNeedsSummary(currentUser);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const handleSaveDisplayName = async (name: string) => {
    setNameError(null);
    setIsSavingName(true);
    try {
      await updateProfile({ displayName: name });
      setIsEditModalVisible(false);
    } catch {
      setNameError("Couldn't save your name. Check your connection.");
    } finally {
      setIsSavingName(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <AppText style={{ color: appTheme.colors.textMuted }}>
            Loading profile…
          </AppText>
        </View>
      </Screen>
    );
  }

  const isGuest = currentUser === null;
  const displayName = isGuest
    ? "Guest"
    : currentUser.displayName || currentUser.name || "User";

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Profile"
      >
        <ProfileHeader
          displayName={displayName}
          email={isGuest ? null : currentUser.email}
          avatarUrl={isGuest ? null : currentUser.avatarUrl}
          isGuest={isGuest}
          onEditName={
            isGuest
              ? undefined
              : () => {
                  setNameError(null);
                  setIsEditModalVisible(true);
                }
          }
        />

        <ProfileNavRow
          title="My accessibility needs"
          subtitle={needsSummary}
          accessibilityHint="Opens the screen where you choose the accessibility features you need"
          onPress={() => router.push("/profile/accessibility-needs")}
        />

        {isGuest ? (
          <GuestProfilePrompt />
        ) : (
          <TouchTarget
            accessibilityLabel="Sign out of your account"
            accessibilityRole="button"
            accessibilityHint="Signs you out and returns to the sign in screen"
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
        )}
      </ScrollView>

      {!isGuest ? (
        <EditDisplayNameModal
          visible={isEditModalVisible}
          initialName={displayName}
          isSaving={isSavingName}
          error={nameError}
          onClose={() => {
            if (!isSavingName) {
              setIsEditModalVisible(false);
              setNameError(null);
            }
          }}
          onSave={handleSaveDisplayName}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  signOutButton: {
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
