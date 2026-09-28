import type { PermissionStatus } from "expo-location";
import * as Linking from "expo-linking";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface LocationPermissionBannerProps {
  status: PermissionStatus | null;
  onRequest: () => void;
}

export function LocationPermissionBanner({
  status,
  onRequest,
}: LocationPermissionBannerProps) {
  const { appTheme } = useAppTheme();

  if (status === "granted") return null;

  const isDenied = status === "denied";

  const handlePress = () => {
    if (isDenied) {
      Linking.openSettings();
    } else {
      onRequest();
    }
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: appTheme.colors.surface,
          borderColor: appTheme.colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <AppText variant="bodyStrong">
          {STRINGS.permissions.location.title}
        </AppText>
        <AppText style={{ color: appTheme.colors.textMuted }}>
          {isDenied
            ? STRINGS.map.location.deniedBody
            : STRINGS.map.location.undeterminedBody}
        </AppText>
      </View>
      <TouchTarget
        accessibilityLabel={
          isDenied
            ? STRINGS.permissions.location.openSettings
            : STRINGS.permissions.location.enableLocation
        }
        accessibilityRole="button"
        onPress={handlePress}
        style={[styles.button, { backgroundColor: appTheme.colors.primary }]}
      >
        <AppText
          variant="bodyStrong"
          style={{ color: appTheme.colors.surface }}
        >
          {isDenied
            ? STRINGS.permissions.location.openSettings
            : STRINGS.permissions.location.enable}
        </AppText>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  button: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
