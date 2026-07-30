import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SettingsScreen() {
  const { appTheme } = useAppTheme();

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
            Accessibility and theme settings will be available here.
          </AppText>
        </View>

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
    borderRadius: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
