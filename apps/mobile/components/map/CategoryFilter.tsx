import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";

export type Category = "all" | "wheelchair" | "elevator" | "bathroom" | "multi";

export const CATEGORY_COLORS: Record<Exclude<Category, "all">, string> = {
  wheelchair: "#1565C0",
  elevator: "#2E7D32",
  bathroom: "#6A1B9A",
  multi: "#E65100",
};

type Props = {
  selected: Category;
  onSelect: (c: Category) => void;
};

const PILLS: { label: string; value: Category }[] = [
  { label: "All", value: "all" },
  { label: "♿ Wheelchair", value: "wheelchair" },
  { label: "🛗 Elevator", value: "elevator" },
  { label: "🚻 Bathroom", value: "bathroom" },
  { label: "⭐ Multi", value: "multi" },
];

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PILLS.map((pill) => (
        <TouchableOpacity
          key={pill.value}
          style={[styles.pill, selected === pill.value && styles.pillSelected]}
          onPress={() => onSelect(pill.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.label,
              selected === pill.value && styles.labelSelected,
            ]}
          >
            {pill.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    backgroundColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillSelected: {
    backgroundColor: "#37474F",
  },
  label: {
    fontSize: 14,
    color: "#333",
  },
  labelSelected: {
    color: "#fff",
  },
});
