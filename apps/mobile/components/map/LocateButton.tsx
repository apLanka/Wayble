import React from "react";
import { StyleSheet, Platform } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface LocateButtonProps {
  onPress: () => void;
  bottomOffset?: number;
}

export function LocateButton({
  onPress,
  bottomOffset = 30,
}: LocateButtonProps) {
  const { appTheme } = useAppTheme();

  return (
    <TouchTarget
      accessibilityRole="button"
      accessibilityLabel="Locate me"
      accessibilityHint="Centers the map on your current location"
      onPress={onPress}
      style={[
        styles.button,
        {
          bottom: bottomOffset,
          backgroundColor: appTheme.colors.surface,
          borderColor: appTheme.colors.border,
        },
      ]}
    >
      <AppText
        variant="bodyStrong"
        style={[styles.text, { color: appTheme.colors.text }]}
      >
        Locate me 📍
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    zIndex: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    fontSize: 16,
  },
});
