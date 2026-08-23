import { Stack } from "expo-router";

export default function MapboxStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="place/[id]"
        options={{
          title: "Place Details",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
