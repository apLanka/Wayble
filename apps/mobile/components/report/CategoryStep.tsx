import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ATTRIBUTE_KEYS_BY_CATEGORY,
  CATEGORY_DISPLAY_ORDER,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Props = {
  selected: string | null;
  onSelect: (category: string) => void;
};

/**
 * Step 1 of the report wizard.
 *
 * The user narrows to one accessibility group here so step 2 offers at most
 * seven attributes instead of all nineteen. This is a navigation device,
 * not data: the stored report has no category field, and the group is
 * implied by the attribute keys the user picks in step 2.
 */
export function CategoryStep({ selected, onSelect }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <View style={styles.container}>
      <AppText variant="title" accessibilityRole="header">
        What would you like to report?
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        Pick a group. You will confirm the exact details in the next step.
      </AppText>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Accessibility group"
        style={styles.list}
      >
        {CATEGORY_DISPLAY_ORDER.filter(
          (category) => (ATTRIBUTE_KEYS_BY_CATEGORY[category]?.length ?? 0) > 0,
        ).map((category) => {
          const count = ATTRIBUTE_KEYS_BY_CATEGORY[category]?.length ?? 0;
          const countLabel = `${count} attribute${count === 1 ? "" : "s"}`;
          const isSelected = selected === category;
          return (
            <TouchTarget
              key={category}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={category}
              accessibilityHint={`${countLabel}. Double tap to report on ${category.toLowerCase()}.`}
              onPress={() => onSelect(category)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="bodyStrong"
                style={{
                  color: isSelected ? colors.onPrimary : colors.text,
                }}
              >
                {isSelected ? "✓ " : ""}
                {category}
              </AppText>
              <AppText
                variant="label"
                style={{
                  color: isSelected ? colors.onPrimary : colors.textMuted,
                }}
              >
                {countLabel}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  pill: {
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    gap: 2,
  },
});
