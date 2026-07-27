import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { useAppTheme } from "@/hooks/use-app-theme";
import { CATEGORY_COLORS } from "@/components/map/CategoryFilter";
import { formatDistance } from "@/utils/format-distance";
import { radii, spacing } from "@/constants/theme";
const ACCESSIBILITY_EMOJIS = {
  wheelchair: "♿️",
  elevator: "🛗",
  bathroom: "🚻",
  multi: "🌟",
};

export default function PlaceDetailScreen() {
  const { appTheme } = useAppTheme();
  const params = useLocalSearchParams();

  // Safely parse params
  const name = typeof params.name === "string" ? params.name : "Unknown Place";
  const category =
    typeof params.category === "string" ? params.category : "unknown";
  const address = typeof params.address === "string" ? params.address : null;
  const distance =
    typeof params.distance === "string" && params.distance !== ""
      ? Number(params.distance)
      : undefined;

  let features: string[] = [];
  if (typeof params.features === "string" && params.features !== "") {
    try {
      features = JSON.parse(params.features);
    } catch (e) {
      console.warn("Failed to parse features param", e);
    }
  }

  let accessibilityCategories: string[] = [];
  if (
    typeof params.accessibilityCategories === "string" &&
    params.accessibilityCategories !== ""
  ) {
    try {
      accessibilityCategories = JSON.parse(params.accessibilityCategories);
    } catch (e) {
      console.warn("Failed to parse accessibilityCategories param", e);
    }
  }

  const categoryColor =
    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
    appTheme.colors.primary;
  const distanceStr = distance !== undefined ? formatDistance(distance) : "";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <AppText style={styles.title} accessibilityRole="header">
            {name}
          </AppText>

          <View style={styles.metaRow}>
            <View
              style={[styles.categoryDot, { backgroundColor: categoryColor }]}
            />
            <AppText
              style={[styles.category, { color: appTheme.colors.textMuted }]}
            >
              {category}
            </AppText>
            {distanceStr ? (
              <AppText
                style={[styles.distance, { color: appTheme.colors.textMuted }]}
              >
                • {distanceStr} away
              </AppText>
            ) : null}
          </View>
        </View>

        {address && (
          <View
            style={[styles.section, { borderTopColor: appTheme.colors.border }]}
          >
            <AppText style={styles.sectionTitle} accessibilityRole="header">
              Address
            </AppText>
            <AppText>{address}</AppText>
          </View>
        )}

        <View
          style={[styles.section, { borderTopColor: appTheme.colors.border }]}
        >
          {accessibilityCategories.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <AppText style={styles.sectionTitle} accessibilityRole="header">
                Accessibility Profile
              </AppText>
              <View style={styles.accessibilityRow}>
                {accessibilityCategories.map((cat: string) => (
                  <View
                    key={cat}
                    style={[
                      styles.accessibilityTile,
                      { backgroundColor: appTheme.colors.surface },
                    ]}
                  >
                    <AppText style={styles.accessibilityEmoji}>
                      {ACCESSIBILITY_EMOJIS[
                        cat as keyof typeof ACCESSIBILITY_EMOJIS
                      ] || "✓"}
                    </AppText>
                    <AppText
                      style={[
                        styles.accessibilityTileText,
                        { color: appTheme.colors.text },
                      ]}
                    >
                      {cat}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <AppText style={styles.sectionTitle} accessibilityRole="header">
            Verified Features
          </AppText>
          {features.length > 0 ? (
            <View style={styles.featuresList}>
              {features.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <AppText>• {feature}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText style={{ color: appTheme.colors.textMuted }}>
              No accessibility features reported.
            </AppText>
          )}

          <View
            style={[
              styles.disclaimerBox,
              { backgroundColor: appTheme.colors.surface },
            ]}
          >
            <AppText
              style={[
                styles.disclaimerText,
                { color: appTheme.colors.textMuted },
              ]}
            >
              Note: A feature not listed here has not been assessed — it does
              not mean it is unavailable.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
  },
  category: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  distance: {
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  accessibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accessibilityTile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    gap: spacing.xs,
  },
  accessibilityEmoji: {
    fontSize: 16,
  },
  accessibilityTileText: {
    fontSize: 14,
    textTransform: "capitalize",
  },

  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    marginBottom: spacing.xs,
  },
  disclaimerBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  disclaimerText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
