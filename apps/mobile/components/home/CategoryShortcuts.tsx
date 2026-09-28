import { ScrollView, StyleSheet, View } from "react-native";

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Category,
} from "@/components/map/CategoryFilter";
import {
  AppSymbol,
  HOME_SYMBOLS,
  type PlatformSymbol,
} from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { spacing } from "@/constants/theme";

const HOME_CATEGORIES = [
  "wheelchair",
  "elevator",
  "bathroom",
  "multi",
] as const satisfies readonly Category[];

type HomeCategory = (typeof HOME_CATEGORIES)[number];

const CATEGORY_SYMBOLS: Record<HomeCategory, PlatformSymbol> = {
  wheelchair: HOME_SYMBOLS.wheelchair,
  elevator: HOME_SYMBOLS.elevator,
  bathroom: HOME_SYMBOLS.bathroom,
  multi: HOME_SYMBOLS.multi,
};

interface CategoryShortcutsProps {
  onSelectCategory: (category: Category) => void;
}

export function CategoryShortcuts({
  onSelectCategory,
}: CategoryShortcutsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {HOME_CATEGORIES.map((category) => {
        const color = CATEGORY_COLORS[category];

        return (
          <TouchTarget
            key={category}
            style={[
              styles.pill,
              {
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
              },
            ]}
            onPress={() => onSelectCategory(category)}
            accessibilityRole="button"
            accessibilityLabel={CATEGORY_LABELS[category]}
            accessibilityHint={STRINGS.home.a11y.categoryShortcutHint}
          >
            <View style={styles.pillContent}>
              <AppSymbol
                name={CATEGORY_SYMBOLS[category]}
                size={16}
                tintColor={color}
              />
              <AppText style={[styles.pillText, { color }]}>
                {CATEGORY_LABELS[category]}
              </AppText>
            </View>
          </TouchTarget>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1.5,
    minHeight: 40,
    justifyContent: "center",
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
