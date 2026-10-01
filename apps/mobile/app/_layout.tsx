import * as Notifications from "expo-notifications";
import { Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { STRINGS } from "@/constants/strings";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useNotificationRouter } from "@/hooks/use-notification-router";

// Show a verification request even if it lands while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useNotificationRouter();
  const { appTheme, navigationTheme, isDark } = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexClientProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              contentStyle: {
                backgroundColor: appTheme.colors.background,
              },
              headerStyle: {
                backgroundColor: appTheme.colors.surface,
              },
              headerTintColor: appTheme.colors.text,
              headerTitleStyle: {
                color: appTheme.colors.text,
              },
            }}
          >
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="debug"
              options={{ title: STRINGS.navigation.titles.debug }}
            />
            {/* Screens are keyed by route *node* name, not href, and a
                directory route's node name keeps its `index` segment (see
                `getReactNavigationConfig.js`). This screen moved from
                `place/[id].tsx` to `place/[id]/index.tsx` so `/place/[id]`
                could have a child, which is what `place/[id]/reports` is.
                The href is still `/place/[id]`. */}
            <Stack.Screen
              name="place/[id]/index"
              options={{ title: STRINGS.navigation.titles.placeDetails }}
            />
            <Stack.Screen
              name="report/[placeId]"
              options={{ title: STRINGS.navigation.titles.reportAccessibility }}
            />
          </Stack>
        </ThemeProvider>
      </ConvexClientProvider>
    </GestureHandlerRootView>
  );
}
