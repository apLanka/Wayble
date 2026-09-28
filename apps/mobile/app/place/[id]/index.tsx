import React from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@packages/backend/convex/_generated/api";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { CategoryBadge } from "@/components/place/CategoryBadge";
import { AttributeGroup } from "@/components/place/AttributeGroup";
import { NoDataPrompt } from "@/components/place/NoDataPrompt";
import {
  ATTRIBUTE_METADATA,
  CATEGORY_DISPLAY_ORDER,
} from "@/constants/accessibility-metadata";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

type Attribute = {
  key: AccessibilityAttributeKey;
  value: string;
  note?: string;
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
        <Stack.Screen options={{ title: STRINGS.common.loadingEllipsis }} />
        <Screen>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <AppText
              style={[styles.loadingText, { color: appTheme.colors.textMuted }]}
            >
              {STRINGS.place.notFound.loading}
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
        <Stack.Screen options={{ title: STRINGS.navigation.titles.notFound }} />
        <Screen>
          <View style={styles.centered}>
            <AppText variant="title" style={{ color: appTheme.colors.text }}>
              {STRINGS.place.notFound.title}
            </AppText>
            <AppText
              style={[styles.loadingText, { color: appTheme.colors.textMuted }]}
            >
              {STRINGS.place.notFound.body}
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
      <Stack.Screen options={{ title: place.name }} />
      <Screen>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Place Info Section ──────────────────────────── */}
          <View style={styles.infoSection}>
            <AppText
              variant="title"
              style={{ color: appTheme.colors.text }}
              accessibilityRole="header"
            >
              {place.name}
            </AppText>

            <CategoryBadge category={place.category} />

            <View
              style={styles.addressRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel={STRINGS.place.addressLabel(place.address)}
            >
              <AppText
                style={styles.addressIcon}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                📍
              </AppText>
              <AppText
                style={[styles.address, { color: appTheme.colors.textMuted }]}
                numberOfLines={2}
              >
                {place.address}
              </AppText>
            </View>
          </View>

          {/* ── Attributes Section ─────────────────────────── */}
          {hasAttributes ? (
            <>
              <View style={styles.attributesSection}>
                <View style={styles.sectionHeader}>
                  <AppText
                    variant="bodyStrong"
                    style={{ color: appTheme.colors.text }}
                    accessibilityRole="header"
                  >
                    {STRINGS.place.attributes.title}
                  </AppText>
                  {/* No `focusColor`, so `TouchTarget` falls back to
                      `colors.focus`. The badge sits on `primary + "20"`,
                      which is a translucent tint over `background` and not
                      solid `primary`, so the `onPrimary` ring this state
                      would otherwise want measures 1.24:1 light and 1.86:1
                      dark against that background — under the 3:1 of WCAG
                      1.4.11. The default `focus` token measures 7.41:1 and
                      24.22:1. The badge has one visual state, so there is
                      nothing to make the ring conditional on. */}
                  <TouchTarget
                    accessibilityRole="link"
                    accessibilityLabel={STRINGS.place.reports.onThisPlace(
                      place.reportCount,
                    )}
                    accessibilityHint={STRINGS.place.reportsLinkHint}
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
                </View>

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
              </View>

              {/* ── Add Or Correct ───────────────────────────── */}
              {/* Sits outside `attributesSection` and outside any
                  `accessible` group, so it is not swallowed by one and not
                  read as part of the attribute list. Outlined rather than
                  filled, which is what keeps it secondary to the data above
                  and to `NoDataPrompt`'s filled call to action on the empty
                  place: this one adds to what is already recorded, or
                  corrects a value that is wrong. */}
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={STRINGS.place.addReport.label}
                accessibilityHint={STRINGS.place.addReport.hint}
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
                  {STRINGS.place.addReport.button}
                </AppText>
              </TouchTarget>
            </>
          ) : (
            /* ── No Data State ─────────────────────────────── */
            <NoDataPrompt onContribute={openReportForm} />
          )}
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
  },
  infoSection: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  addressIcon: {
    fontSize: 16,
    lineHeight: 22,
  },
  address: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  attributesSection: {
    gap: spacing.sm,
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
  addReportButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
});
