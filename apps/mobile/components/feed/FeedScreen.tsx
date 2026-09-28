import { Stack } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useVerificationFeed } from "@/hooks/use-verification-feed";
import { FeedItemRow } from "./FeedItemRow";

/**
 * S3-7 (US-23) — live feed of recent verifications near you.
 *
 * Read-only and driven entirely by Convex subscriptions: there is no refresh
 * control because none is needed. Announcements live in the hook.
 */
export function FeedScreen() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const {
    status,
    isLocating,
    hasLocation,
    requestPermission,
    items,
    currentUserId,
  } = useVerificationFeed();

  const title = <Stack.Screen options={{ title: "Nearby activity" }} />;

  if (!hasLocation) {
    const denied = !isLocating && status !== "granted";
    return (
      <>
        {title}
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            {denied ? (
              <>
                <AppText variant="title" accessibilityRole="header">
                  Location needed
                </AppText>
                <AppText
                  style={[styles.centeredText, { color: colors.textMuted }]}
                >
                  Allow location to see verifications happening near you.
                </AppText>
                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel="Allow location access"
                  onPress={() => void requestPermission()}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    style={{ color: colors.onPrimary }}
                  >
                    Allow location
                  </AppText>
                </TouchTarget>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText
                  style={[styles.centeredText, { color: colors.textMuted }]}
                >
                  Finding your location…
                </AppText>
              </>
            )}
          </View>
        </Screen>
      </>
    );
  }

  if (items === undefined) {
    return (
      <>
        {title}
        <Screen edges={["left", "right", "bottom"]}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
              Loading nearby activity…
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      {title}
      <Screen edges={["left", "right", "bottom"]}>
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <AppText variant="title" accessibilityRole="header">
              Nearby verifications
            </AppText>
          }
          ListEmptyComponent={
            <AppText style={{ color: colors.textMuted }}>
              No verifications near you yet. When someone confirms or disputes a
              report nearby, it will show up here.
            </AppText>
          }
          renderItem={({ item }) => (
            <FeedItemRow item={item} currentUserId={currentUserId} />
          )}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  centeredText: {
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
});
