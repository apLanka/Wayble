import { Image, StyleSheet, View } from "react-native";

import { AppSymbol, HOME_SYMBOLS } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { radii, sizing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getInitials } from "@/utils/get-initials";

const AVATAR_SIZE = 80;

interface ProfileAvatarProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  isGuest?: boolean;
}

export function ProfileAvatar({
  displayName,
  avatarUrl,
  isGuest = false,
}: ProfileAvatarProps) {
  const { appTheme } = useAppTheme();

  const accessibilityLabel = isGuest
    ? "Default profile avatar"
    : displayName
      ? `Profile photo for ${displayName}`
      : "Default profile avatar";

  if (isGuest) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.avatar,
          { backgroundColor: appTheme.colors.surfaceElevated },
        ]}
      >
        <AppSymbol
          name={HOME_SYMBOLS.profile}
          size={40}
          tintColor={appTheme.colors.textMuted}
        />
      </View>
    );
  }

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatarImage}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  const initials = getInitials(displayName || "User");

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.avatar,
        { backgroundColor: appTheme.colors.primary + "26" },
      ]}
    >
      <AppText
        variant="title"
        style={[styles.initials, { color: appTheme.colors.primary }]}
      >
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    minWidth: sizing.minTouchTarget,
    minHeight: sizing.minTouchTarget,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
  },
  initials: {
    fontSize: 28,
    lineHeight: 32,
  },
});
