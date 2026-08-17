import { useConvexAuth } from "convex/react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { appTheme } = useAppTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: appTheme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/sign-in" />;
}
