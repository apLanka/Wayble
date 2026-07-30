import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function DebugScreen() {
  const health = useQuery(api.health.ping);
  const touch = useMutation(api.health.touch);
  const { appTheme } = useAppTheme();

  if (health === undefined) {
    return (
      <Screen>
        <View style={styles.loading}>
          <AppText accessibilityRole="alert">Connecting to Convex…</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.values}>
          <AppText variant="title" accessibilityRole="header">
            Connection debug
          </AppText>
          <AppText>
            Server time: {new Date(health.serverTime).toISOString()}
          </AppText>
          <AppText>Counter: {health.count}</AppText>
        </View>

        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Increment the health counter"
          accessibilityHint="Sends a mutation to Convex and increments the counter"
          focusColor={appTheme.colors.onPrimary}
          onPress={() => void touch()}
          style={[
            styles.touchButton,
            { backgroundColor: appTheme.colors.primary },
          ]}
        >
          <AppText
            variant="bodyStrong"
            style={{ color: appTheme.colors.onPrimary }}
          >
            Touch
          </AppText>
        </TouchTarget>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  touchButton: {
    alignItems: "center",
    borderRadius: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  values: {
    gap: spacing.sm,
  },
});
