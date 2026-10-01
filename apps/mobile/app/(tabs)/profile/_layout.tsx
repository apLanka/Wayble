import { Stack } from "expo-router";

import { STRINGS } from "@/constants/strings";

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="accessibility-needs"
        options={{ title: STRINGS.navigation.titles.accessibilityNeeds }}
      />
    </Stack>
  );
}
