import { Text, type TextProps, type TextStyle } from "react-native";

import { typography } from "@/constants/theme";

export type AppTextVariant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
}

export function AppText({
  variant = "body",
  style,
  allowFontScaling = true,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      allowFontScaling={allowFontScaling}
      style={[typography[variant] as TextStyle, style]}
    />
  );
}
