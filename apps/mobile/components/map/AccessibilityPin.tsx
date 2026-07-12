import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import type { AccessibleLocation } from "../../data/mock-data";

type Props = {
  category: AccessibleLocation["category"];
  onPress?: () => void;
};

const PIN_MAP: Record<
  AccessibleLocation["category"],
  { emoji: string; color: string }
> = {
  wheelchair: { emoji: "♿", color: "#1565C0" },
  elevator: { emoji: "🛗", color: "#2E7D32" },
  bathroom: { emoji: "🚻", color: "#6A1B9A" },
  multi: { emoji: "⭐", color: "#E65100" },
};

export default function AccessibilityPin({ category, onPress }: Props) {
  const { emoji, color } = PIN_MAP[category];
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
