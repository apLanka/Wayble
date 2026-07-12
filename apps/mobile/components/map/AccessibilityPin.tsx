import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import type { AccessibleLocation } from "../../data/mock-data";
import { CATEGORY_COLORS } from "./CategoryFilter";

type Props = {
  category: AccessibleLocation["category"];
  onPress?: () => void;
};

const PIN_EMOJI: Record<AccessibleLocation["category"], string> = {
  wheelchair: "♿",
  elevator: "🛗",
  bathroom: "🚻",
  multi: "⭐",
};

export default function AccessibilityPin({ category, onPress }: Props) {
  const emoji = PIN_EMOJI[category];
  const color = CATEGORY_COLORS[category];
  return (
    <TouchableOpacity
      style={[styles.pin, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </TouchableOpacity>
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
