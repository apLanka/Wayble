import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from "expo-router";

export const colors = {
  light: {
    background: "#F7FAF8",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    text: "#14251A",
    textMuted: "#425248",
    primary: "#0B6B3A",
    onPrimary: "#FFFFFF",
    border: "#5B6B62",
    focus: "#005FCC",
    success: "#176B3A",
    warning: "#795500",
    danger: "#B3261E",
    tabBackground: "#FFFFFF",
    tabIcon: "#425248",
    tabIconSelected: "#0B6B3A",
    tabIndicator: "#0B6B3A",
    ripple: "#0B6B3A",
  },
  dark: {
    background: "#0F1712",
    surface: "#17221B",
    surfaceElevated: "#203027",
    text: "#F2F7F3",
    textMuted: "#B9C7BE",
    primary: "#8CE0A9",
    onPrimary: "#082914",
    border: "#8A9A90",
    focus: "#82B1FF",
    success: "#9BE5B3",
    warning: "#F4C95D",
    danger: "#FFB4AB",
    tabBackground: "#17221B",
    tabIcon: "#B9C7BE",
    tabIconSelected: "#8CE0A9",
    tabIndicator: "#8CE0A9",
    ripple: "#8CE0A9",
  },
} as const;

export type ThemeColors = (typeof colors)[keyof typeof colors];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const sizing = {
  minTouchTarget: 44,
} as const;

export type AppTheme = {
  mode: "light" | "dark";
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  sizing: typeof sizing;
};

const navigationColors = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.light.primary,
      background: colors.light.background,
      card: colors.light.surface,
      text: colors.light.text,
      border: colors.light.border,
      notification: colors.light.danger,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.dark.primary,
      background: colors.dark.background,
      card: colors.dark.surface,
      text: colors.dark.text,
      border: colors.dark.border,
      notification: colors.dark.danger,
    },
  },
} satisfies Record<"light" | "dark", NavigationTheme>;

export const navigationThemes = navigationColors;

export const appThemes: Record<"light" | "dark", AppTheme> = {
  light: {
    mode: "light",
    colors: colors.light,
    spacing,
    typography,
    radii,
    sizing,
  },
  dark: {
    mode: "dark",
    colors: colors.dark,
    spacing,
    typography,
    radii,
    sizing,
  },
};
