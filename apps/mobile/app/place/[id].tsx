import React, { useState } from "react";
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
import { SubmitVerificationModal } from "@/components/feed/SubmitVerificationModal";
import {
  ATTRIBUTE_METADATA,
  CATEGORY_DISPLAY_ORDER,
} from "@/constants/accessibility-metadata";
import { spacing, radii } from "@/constants/theme";
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
  const { appTheme } = useAppTheme();
  const router = useRouter();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

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
              accessibilityLabel={`Address: ${place.address}`}
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
            <View style={styles.attributesSection}>
              <View style={styles.sectionHeader}>
                <AppText
                  variant="bodyStrong"
                  style={{ color: appTheme.colors.text }}
                  accessibilityRole="header"
                >
                  Accessibility Attributes
                </AppText>
                <View
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
                </View>
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

              {/* ── Community Verification Actions ───────────── */}
              <View style={styles.verificationActionsSection}>
                <TouchTarget
                  onPress={() => setIsVerifyModalOpen(true)}
                  style={styles.actionTouchTarget}
                  accessibilityRole="button"
                  accessibilityLabel="Verify this place"
                >
                  <View
                    style={[
                      styles.verifyCtaButton,
                      { backgroundColor: appTheme.colors.primary },
                    ]}
                  >
                    <AppText
                      variant="bodyStrong"
                      style={{ color: appTheme.colors.onPrimary }}
                    >
                      ✓ Verify Accessibility
                    </AppText>
                  </View>
                </TouchTarget>

                <TouchTarget
                  onPress={() =>
                    router.push({
                      pathname: "/feed",
                      params: { placeId: place._id },
                    })
                  }
                  style={styles.actionTouchTarget}
                  accessibilityRole="button"
                  accessibilityLabel="View live verification feed for this place"
                >
                  <View
                    style={[
                      styles.viewFeedButton,
                      {
                        borderColor: appTheme.colors.primary,
                        backgroundColor: appTheme.colors.surface,
                      },
                    ]}
                  >
                    <AppText
                      variant="bodyStrong"
                      style={{ color: appTheme.colors.primary }}
                    >
                      📡 View Live Verification Activity
                    </AppText>
                  </View>
                </TouchTarget>
              </View>
            </View>
          ) : (
            /* ── No Data State ─────────────────────────────── */
            <NoDataPrompt
              onContribute={() => {
                setIsVerifyModalOpen(true);
              }}
            />
          )}
        </ScrollView>
      </Screen>

      <SubmitVerificationModal
        visible={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        defaultPlaceId={place._id}
      />
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
  verificationActionsSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionTouchTarget: {
    width: "100%",
  },
  verifyCtaButton: {
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewFeedButton: {
    borderRadius: radii.md,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
