import {
  SafeAreaView,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";

import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const defaultEdges = ["top", "left", "right"] as const;

export function Screen({
  edges = defaultEdges,
  style,
  ...props
}: SafeAreaViewProps) {
  const { appTheme } = useAppTheme();

  return (
    <SafeAreaView
      {...props}
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: appTheme.colors.background,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        },
        style,
      ]}
    />
  );
}
