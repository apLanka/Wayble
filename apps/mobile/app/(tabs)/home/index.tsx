import { Link } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function HomeScreen() {
  const { appTheme } = useAppTheme();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introduction}>
          <AppText variant="display" accessibilityRole="header">
            Accessibility Mapper
          </AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            Explore and understand accessibility in public spaces.
          </AppText>
        </View>

        <Link href="/debug" asChild>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel="Open debug screen"
            accessibilityHint="Opens the Convex connection health check"
            focusColor={appTheme.colors.onPrimary}
            style={{
              ...styles.debugButton,
              backgroundColor: appTheme.colors.primary,
            }}
          >
            <AppText
              variant="bodyStrong"
              style={{ color: appTheme.colors.onPrimary }}
            >
              Open debug screen
            </AppText>
          </TouchTarget>
        </Link>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  introduction: {
    gap: spacing.sm,
  },
  debugButton: {
    alignItems: "center",
    borderRadius: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
