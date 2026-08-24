import React from "react";
import { StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./CategoryFilter";

type Props = {
  category: "all" | "wheelchair" | "elevator" | "bathroom" | "multi";
  onPress?: () => void;
};

const PIN_EMOJI: Record<Props["category"], string> = {
  all: "📍",
  wheelchair: "♿️",
  elevator: "🛗",
  bathroom: "🚻",
  multi: "🌟",
};

export default function AccessibilityPin({ category, onPress }: Props) {
  const emoji = PIN_EMOJI[category];
  const color = CATEGORY_COLORS[category];
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const a11yLabel =
    category === "all" ? "Place marker" : `${categoryLabel} place`;

  return (
    <TouchTarget
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={[styles.pin, { backgroundColor: color }]}
      onPress={onPress}
    >
      <AppText style={styles.emoji}>{emoji}</AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
});
