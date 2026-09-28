import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AddPlaceForm } from "@/components/debug/AddPlaceForm";
import { LoadAllPlacesButton } from "@/components/debug/LoadAllPlacesButton";
import { VerifyPlaceForm } from "@/components/debug/VerifyPlaceForm";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function DebugScreen() {
  const router = useRouter();
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

          <AddPlaceForm />

          <LoadAllPlacesButton />

          <TouchTarget
            accessibilityRole="link"
            accessibilityLabel="View all places"
            accessibilityHint="Opens a list of every place in the database"
            focusColor={appTheme.colors.onPrimary}
            onPress={() => router.push("/debug/places")}
            style={[
              styles.touchButton,
              { backgroundColor: appTheme.colors.surfaceElevated },
            ]}
          >
            <AppText
              variant="bodyStrong"
              style={{ color: appTheme.colors.text }}
            >
              View all places →
            </AppText>
          </TouchTarget>
          <VerifyPlaceForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
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
