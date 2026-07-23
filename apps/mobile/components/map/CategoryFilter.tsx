import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { spacing } from "@/constants/theme";

export type Category = "all" | "food" | "retail" | "transit" | "health";

export const CATEGORY_COLORS = {
  all: "#6b7280", // Gray
  food: "#ef4444", // Red
  retail: "#3b82f6", // Blue
  transit: "#10b981", // Green
  health: "#f59e0b", // Yellow
};

export const CATEGORY_LABELS = {
  all: "All places",
  food: "Food & Drink",
  retail: "Retail & Shopping",
  transit: "Transit Stations",
  health: "Health & Medical",
};

const CATEGORY_EMOJIS = {
  all: "📍",
  food: "🍽️",
  retail: "🛍️",
  transit: "🚇",
  health: "⚕️",
};

interface CategoryFilterProps {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export function CategoryFilter({
  activeCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const categories: Category[] = ["all", "food", "retail", "transit", "health"];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <TouchTarget
              key={cat}
              style={[
                styles.pill,
                isActive && {
                  backgroundColor: CATEGORY_COLORS[cat],
                  borderColor: CATEGORY_COLORS[cat],
                },
              ]}
              onPress={() => onSelectCategory(cat)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={CATEGORY_LABELS[cat]}
            >
              <AppText
                style={[
                  styles.pillText,
                  isActive && styles.pillTextActive,
                  { color: isActive ? "#fff" : CATEGORY_COLORS[cat] },
                ]}
              >
                {CATEGORY_EMOJIS[cat]} {cat}
              </AppText>
            </TouchTarget>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    minHeight: 40,
    justifyContent: "center",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pillTextActive: {
    color: "#fff",
  },
});
