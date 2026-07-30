import { useColorScheme } from "react-native";

import { appThemes, navigationThemes, type AppTheme } from "@/constants/theme";

export function useAppTheme(): {
  appTheme: AppTheme;
  navigationTheme: (typeof navigationThemes)[keyof typeof navigationThemes];
  isDark: boolean;
} {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const mode = isDark ? "dark" : "light";

  return {
    appTheme: appThemes[mode],
    navigationTheme: navigationThemes[mode],
    isDark,
  };
}
