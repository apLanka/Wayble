import { Stack } from "expo-router";

import { STRINGS } from "@/constants/strings";

export default function SettingsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="notifications"
        options={{ title: STRINGS.navigation.titles.notifications }}
      />
    </Stack>
  );
}
