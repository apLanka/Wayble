import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import {
  ATTRIBUTE_ICON_EMOJI,
  ATTRIBUTE_METADATA,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

type Props = {
  categoryName: string;
  attributeKeys: AccessibilityAttributeKey[];
  selected: ReadonlySet<AccessibilityAttributeKey>;
  onToggle: (key: AccessibilityAttributeKey) => void;
  disabled?: boolean;
};

/**
 * One taxonomy category (Mobility, Vision, …) rendered as a heading plus a
 * checkbox per attribute in that category.
 *
 * Mirrors how `AttributeGroup` presents the same categories on the place
 * detail screen, so selecting a need and reading a place's attributes look
 * and sound consistent.
 */
export function NeedsCategorySection({
  categoryName,
  attributeKeys,
  selected,
  onToggle,
  disabled,
}: Props) {
  const { appTheme } = useAppTheme();

  if (attributeKeys.length === 0) {
    return null;
  }

  const selectedCount = attributeKeys.filter((key) => selected.has(key)).length;

  return (
    <View style={styles.container}>
      <AppText
        variant="label"
        accessibilityRole="header"
        style={[styles.header, { color: appTheme.colors.textMuted }]}
      >
        {categoryName}
        {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
      </AppText>

      <View
        style={[
          styles.content,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: appTheme.colors.border,
          },
        ]}
      >
        {attributeKeys.map((key, index) => (
          <View key={key}>
            {index > 0 ? (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: appTheme.colors.border + "30" },
                ]}
              />
            ) : null}
            <CheckboxRow
              label={ATTRIBUTE_METADATA[key].label}
              icon={ATTRIBUTE_ICON_EMOJI[key]}
              checked={selected.has(key)}
              onToggle={() => onToggle(key)}
              disabled={disabled}
              accessibilityHint={`${categoryName} need. Double tap to ${
                selected.has(key) ? "remove from" : "add to"
              } your accessibility needs.`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  content: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
