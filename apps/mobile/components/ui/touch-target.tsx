import { useState } from "react";
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { sizing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export function TouchTarget({
  accessibilityState,
  disabled,
  onBlur,
  onFocus,
  style,
  ...props
}: PressableProps) {
  const { appTheme } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const mergedAccessibilityState =
    disabled == null ? accessibilityState : { ...accessibilityState, disabled };

  const resolveStyle = (
    state: PressableStateCallbackType,
  ): StyleProp<ViewStyle> => {
    const resolvedStyle = typeof style === "function" ? style(state) : style;

    return [
      {
        minWidth: sizing.minTouchTarget,
        minHeight: sizing.minTouchTarget,
      },
      resolvedStyle,
      state.pressed && { opacity: 0.8 },
      isFocused && {
        borderColor: appTheme.colors.focus,
        borderWidth: 2,
      },
    ];
  };

  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityState={mergedAccessibilityState}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      style={resolveStyle}
    />
  );
}
