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
                isActive ? styles.pillActive : styles.pillInactive,
                {
                  backgroundColor: isActive
                    ? CATEGORY_COLORS[cat]
                    : `${CATEGORY_COLORS[cat]}15`, // 15% opacity tint for background
                  borderColor: isActive
                    ? CATEGORY_COLORS[cat]
                    : `${CATEGORY_COLORS[cat]}30`, // 30% opacity tint for border
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
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                  !isActive && { color: CATEGORY_COLORS[cat] },
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
    borderRadius: 24, // softer pill shape
    borderWidth: 1.5, // slightly bolder border
    minHeight: 40,
    justifyContent: "center",
  },
  pillActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pillInactive: {
    elevation: 0,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700", // punchier text
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: "#fff",
  },
  pillTextInactive: {
    opacity: 1, // Let the inline color dictate appearance
  },
});
