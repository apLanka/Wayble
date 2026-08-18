import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useAppTheme } from "@/hooks/use-app-theme";

export default function TabsLayout() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <NativeTabs
      backgroundColor={colors.tabBackground}
      iconColor={{
        default: colors.tabIcon,
        selected: colors.tabIconSelected,
      }}
      indicatorColor={colors.tabIndicator}
      labelStyle={{ color: colors.tabIcon }}
      labelVisibilityMode="labeled"
      rippleColor={colors.ripple}
      tintColor={colors.tabIconSelected}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="google-maps">
        <NativeTabs.Trigger.Icon
          sf={{ default: "map", selected: "map.fill" }}
          md="map"
        />
        <NativeTabs.Trigger.Label>Apple Maps</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mapbox">
        <NativeTabs.Trigger.Icon
          sf={{ default: "location", selected: "location.fill" }}
          md="place"
        />
        <NativeTabs.Trigger.Label>Mapbox</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
