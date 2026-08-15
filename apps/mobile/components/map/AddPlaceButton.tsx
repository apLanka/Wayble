import React from "react";
import { Platform, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface AddPlaceButtonProps {
  onPress: () => void;
  bottomOffset?: number;
}

export function AddPlaceButton({
  onPress,
  bottomOffset = 30,
}: AddPlaceButtonProps) {
  const { appTheme } = useAppTheme();

  return (
    <TouchTarget
      accessibilityRole="button"
      accessibilityLabel="Add a place"
      accessibilityHint="Opens a form to add a new place to the map"
      focusColor={appTheme.colors.onPrimary}
      onPress={onPress}
      style={[
        styles.button,
        { bottom: bottomOffset, backgroundColor: appTheme.colors.primary },
      ]}
    >
      <AppText
        variant="bodyStrong"
        style={[styles.text, { color: appTheme.colors.onPrimary }]}
      >
        + Add place
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
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
