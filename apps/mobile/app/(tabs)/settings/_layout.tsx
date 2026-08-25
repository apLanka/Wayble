import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen
        name="accessibility-needs"
        options={{ title: "Accessibility Needs" }}
      />
    </Stack>
  );
}
