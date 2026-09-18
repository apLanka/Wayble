import React from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@packages/backend/convex/_generated/api";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { AttributeGroup } from "@/components/place/AttributeGroup";
import { CATEGORY_LABELS } from "@/components/map/CategoryFilter";
import {
  ATTRIBUTE_METADATA,
  CATEGORY_DISPLAY_ORDER,
} from "@/constants/accessibility-metadata";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

type Attribute = {
  key: AccessibilityAttributeKey;
  value: string;
  note?: string;
};

const ACCESSIBILITY_EMOJIS = {
  wheelchair: "♿️",
  elevator: "🛗",
  bathroom: "🚻",
  multi: "🌟",
};

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appTheme } = useAppTheme();

  const place = useQuery(
    api.places.getPlace,
    id ? { placeId: id as Id<"places"> } : "skip",
  );

  // Loading state
  if (place === undefined) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading…" }} />
        <Screen>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <AppText
              style={[styles.loadingText, { color: appTheme.colors.textMuted }]}
            >
              Loading place details…
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  // Not found state
  if (place === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Not Found" }} />
        <Screen>
          <View style={styles.centered}>
            <AppText variant="title" style={{ color: appTheme.colors.text }}>
              Place not found
            </AppText>
            <AppText
              style={[styles.loadingText, { color: appTheme.colors.textMuted }]}
            >
              This place may have been removed or doesn't exist.
            </AppText>
          </View>
        </Screen>
      </>
    );
  }

  // Group attributes by their display category
  const groupedAttributes = groupAttributesByCategory(
    place.attributes as Attribute[],
  );
  const hasAttributes = place.attributes.length > 0;

  /**
   * The report form, from either state of the screen: the empty place
   * invites the first report, the populated one adds to or corrects what is
   * already recorded. One call, so the two entry points cannot diverge.
   */
  const openReportForm = () =>
    router.push({
      pathname: "/report/[placeId]",
      params: { placeId: id },
    });

  return (
    <>
      <Stack.Screen options={{ title: "Place Details" }} />
      <Screen>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Place Info Section ──────────────────────────── */}
          <View style={styles.header}>
            <AppText
              style={[styles.title, { color: appTheme.colors.text }]}
              accessibilityRole="header"
            >
              {place.name}
            </AppText>

            <View style={styles.metaRow}>
              <View
                style={[styles.categoryDot, { backgroundColor: "#6b7280" }]}
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
              <AppText
                style={[styles.category, { color: appTheme.colors.textMuted }]}
              >
                {place.category.replace(/_/g, " ")}
              </AppText>
            </View>
          </View>

          {place.address ? (
            <View
              style={[
                styles.section,
                { borderTopColor: appTheme.colors.border },
              ]}
            >
              <AppText
                style={[styles.sectionTitle, { color: appTheme.colors.text }]}
                accessibilityRole="header"
              >
                Address
              </AppText>
              <AppText style={{ color: appTheme.colors.text }}>
                {place.address}
              </AppText>
            </View>
          ) : null}

          {/* ── Accessibility Profile Section ───────────────── */}
          <View
            style={[styles.section, { borderTopColor: appTheme.colors.border }]}
          >
            {place.accessibilityCategories &&
              place.accessibilityCategories.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <AppText
                    style={[
                      styles.sectionTitle,
                      { color: appTheme.colors.text },
                    ]}
                    accessibilityRole="header"
                  >
                    Accessibility Profile
                  </AppText>
                  <View style={styles.accessibilityRow}>
                    {place.accessibilityCategories.map((cat: string) => {
                      const label =
                        CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ||
                        `${cat} accessible`;
                      return (
                        <View
                          key={cat}
                          style={[
                            styles.accessibilityTile,
                            {
                              backgroundColor: appTheme.colors.surface,
                              borderColor: appTheme.colors.border,
                            },
                          ]}
                          accessible
                          accessibilityRole="text"
                          accessibilityLabel={label}
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
                      );
                    })}
                  </View>
                </View>
              )}

            <View style={styles.sectionHeader}>
              <AppText
                style={[styles.sectionTitle, { color: appTheme.colors.text }]}
                accessibilityRole="header"
              >
                Verified Features
              </AppText>
              {hasAttributes && (
                <TouchTarget
                  accessibilityRole="link"
                  accessibilityLabel={`${place.reportCount} ${
                    place.reportCount === 1 ? "report" : "reports"
                  } on this place`}
                  accessibilityHint="Opens the list of reports so you can confirm or dispute them"
                  onPress={() =>
                    router.push({
                      pathname: "/place/[id]/reports",
                      params: { id: place._id },
                    })
                  }
                  style={[
                    styles.countBadge,
                    { backgroundColor: appTheme.colors.primary + "20" },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{ color: appTheme.colors.primary, fontSize: 12 }}
                  >
                    {place.reportCount}{" "}
                    {place.reportCount === 1 ? "report" : "reports"}
                  </AppText>
                </TouchTarget>
              )}
            </View>

            {hasAttributes ? (
              <View style={styles.featuresList}>
                {CATEGORY_DISPLAY_ORDER.map((categoryName) => {
                  const attrs = groupedAttributes.get(categoryName);
                  if (!attrs || attrs.length === 0) return null;
                  return (
                    <AttributeGroup
                      key={categoryName}
                      categoryName={categoryName}
                      attributes={attrs}
                    />
                  );
                })}

                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel="Add or correct this report"
                  accessibilityHint="Opens the accessibility report form to add what others missed or fix a value that is wrong"
                  onPress={openReportForm}
                  style={[
                    styles.addReportButton,
                    { borderColor: appTheme.colors.border },
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    style={{ color: appTheme.colors.primary }}
                  >
                    Add or correct this report
                  </AppText>
                </TouchTarget>
              </View>
            ) : (
              <>
                <AppText style={{ color: appTheme.colors.textMuted }}>
                  No accessibility features reported.
                </AppText>
                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel="Add the first report"
                  onPress={openReportForm}
                  style={[
                    styles.addReportButton,
                    { borderColor: appTheme.colors.border },
                  ]}
                >
                  <AppText
                    variant="bodyStrong"
                    style={{ color: appTheme.colors.primary }}
                  >
                    Be the first to report
                  </AppText>
                </TouchTarget>
              </>
            )}

            <View
              style={[
                styles.disclaimerBox,
                { backgroundColor: appTheme.colors.surface },
              ]}
              accessible
              accessibilityRole="summary"
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
    </>
  );
}

/**
 * Groups an array of attributes by their display category name.
 */
function groupAttributesByCategory(
  attributes: Attribute[],
): Map<string, Attribute[]> {
  const groups = new Map<string, Attribute[]>();

  for (const attr of attributes) {
    const meta = ATTRIBUTE_METADATA[attr.key];
    const category = meta?.category ?? "Other";
    const list = groups.get(category) ?? [];
    list.push(attr);
    groups.set(category, list);
  }

  return groups;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  category: {
    fontSize: 14,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  accessibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  accessibilityTile: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  accessibilityEmoji: {
    fontSize: 24,
  },
  accessibilityTileText: {
    fontSize: 11,
    textAlign: "center",
    textTransform: "capitalize",
  },
  featuresList: {
    gap: spacing.sm,
  },
  addReportButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  disclaimerBox: {
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
