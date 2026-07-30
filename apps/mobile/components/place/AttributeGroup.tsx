import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { AttributeRow } from "@/components/place/AttributeRow";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

type Attribute = {
  key: AccessibilityAttributeKey;
  value: string;
  note?: string;
};

type Props = {
  categoryName: string;
  attributes: Attribute[];
};

/**
 * Groups a set of accessibility attributes under a category heading.
 * Renders each attribute as an `AttributeRow`.
 */
export function AttributeGroup({ categoryName, attributes }: Props) {
  const { appTheme } = useAppTheme();

  if (attributes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppText
        variant="label"
        style={[styles.header, { color: appTheme.colors.textMuted }]}
        accessibilityRole="header"
      >
        {categoryName}
      </AppText>
      <View
        style={[styles.content, { backgroundColor: appTheme.colors.surface }]}
      >
        {attributes.map((attr, index) => (
          <View key={attr.key}>
            {index > 0 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: appTheme.colors.border + "30" },
                ]}
              />
            )}
            <AttributeRow
              attributeKey={attr.key}
              value={attr.value}
              note={attr.note}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  content: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
