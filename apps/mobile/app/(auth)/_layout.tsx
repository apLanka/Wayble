import { Stack } from "expo-router";

import { useAppTheme } from "@/hooks/use-app-theme";

export default function AuthLayout() {
  const { appTheme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: appTheme.colors.background,
        },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
