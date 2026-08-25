import { useConvexAuth } from "convex/react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

const ONBOARDING_STORAGE_KEY = "has_seen_onboarding";

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { appTheme } = useAppTheme();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY)
      .then((val) => {
        if (isMounted) {
          setHasSeenOnboarding(val === "true");
          setHasCheckedOnboarding(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasSeenOnboarding(false);
          setHasCheckedOnboarding(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !hasCheckedOnboarding) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: appTheme.colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={appTheme.colors.primary}
          accessibilityLabel="Loading, please wait"
        />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/sign-in" />;
}
