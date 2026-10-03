import { StyleSheet, View } from "react-native";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { AppSymbol, HOME_SYMBOLS } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface ProfileHeaderProps {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  isGuest?: boolean;
  guestSubtitle?: string;
  onEditName?: () => void;
}

export function ProfileHeader({
  displayName,
  email,
  avatarUrl,
  isGuest = false,
  guestSubtitle = "Sign in to save your profile",
  onEditName,
}: ProfileHeaderProps) {
  const { appTheme } = useAppTheme();

  return (
    <View style={styles.container}>
      <ProfileAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        isGuest={isGuest}
      />

      <View style={styles.nameRow}>
        <AppText variant="title" accessibilityRole="header" style={styles.name}>
          {displayName}
        </AppText>
        {onEditName ? (
          <TouchTarget
            onPress={onEditName}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.profile.header.editLabel}
            accessibilityHint={STRINGS.profile.header.editHint}
            style={styles.editButton}
          >
            <AppSymbol
              name={HOME_SYMBOLS.edit}
              size={18}
              tintColor={appTheme.colors.primary}
            />
          </TouchTarget>
        ) : null}
      </View>

      {isGuest ? (
        <AppText style={[styles.email, { color: appTheme.colors.textMuted }]}>
          {guestSubtitle}
        </AppText>
      ) : email ? (
        <AppText
          accessibilityRole="text"
          style={[styles.email, { color: appTheme.colors.textMuted }]}
        >
          {email}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    maxWidth: "100%",
  },
  name: {
    flexShrink: 1,
    textAlign: "center",
  },
  editButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  email: {
    textAlign: "center",
  },
});
