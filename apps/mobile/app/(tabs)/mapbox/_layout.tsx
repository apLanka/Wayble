import { Stack } from "expo-router";

import { STRINGS } from "@/constants/strings";

export default function MapboxStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="place/[id]"
        options={{
          title: STRINGS.navigation.titles.placeDetails,
          headerBackTitle: STRINGS.navigation.back,
        }}
      />
    </Stack>
  );
}
