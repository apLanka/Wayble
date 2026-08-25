import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export function GuestProfilePrompt() {
  const { appTheme } = useAppTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        accessibilityHint="Opens the sign in screen"
        focusColor={appTheme.colors.onPrimary}
        onPress={() => router.push("/sign-in")}
        style={[
          styles.primaryButton,
          { backgroundColor: appTheme.colors.primary },
        ]}
      >
        <AppText
          variant="bodyStrong"
          style={{ color: appTheme.colors.onPrimary }}
        >
          Sign In
        </AppText>
      </TouchTarget>

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Create account"
        accessibilityHint="Opens the sign up screen"
        onPress={() => router.push("/sign-up")}
        style={[
          styles.secondaryButton,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: appTheme.colors.border,
          },
        ]}
      >
        <AppText variant="bodyStrong">Create Account</AppText>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  primaryButton: {
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
