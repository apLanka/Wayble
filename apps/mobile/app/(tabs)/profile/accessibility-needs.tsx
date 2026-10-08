import {
  ACCESSIBILITY_ATTRIBUTE_KEYS,
  type AccessibilityAttributeKey,
} from "@packages/backend/convex/accessibility";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { NeedsCategorySection } from "@/components/profile/NeedsCategorySection";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ATTRIBUTE_KEYS_BY_CATEGORY,
  ATTRIBUTE_METADATA,
  CATEGORY_DISPLAY_ORDER,
} from "@/constants/accessibility-metadata";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

/**
 * US-02 — lets the signed-in user record which accessibility attributes they
 * personally need.
 *
 * Each toggle persists immediately with an optimistic update rather than
 * waiting behind a Save button: the tick responds instantly, Convex rolls the
 * value back on failure, and there is no way to lose a selection by leaving
 * the screen.
 */
export default function AccessibilityNeedsScreen() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const currentUser = useQuery(api.users.currentUser);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useMutation(
    api.users.updateProfile,
  ).withOptimisticUpdate((localStore, args) => {
    if (args.accessibilityNeeds === undefined) return;
    const user = localStore.getQuery(api.users.currentUser, {});
    if (!user) return;
    localStore.setQuery(
      api.users.currentUser,
      {},
      { ...user, accessibilityNeeds: args.accessibilityNeeds },
    );
  });

  if (currentUser === undefined) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ color: colors.textMuted }}>
            {STRINGS.profile.needs.loading}
          </AppText>
        </View>
      </Screen>
    );
  }

  if (currentUser === null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText variant="bodyStrong" accessibilityRole="header">
            {STRINGS.profile.needs.signInToSet}
          </AppText>
          <AppText style={[styles.centeredText, { color: colors.textMuted }]}>
            {STRINGS.profile.needs.signedInBody}
          </AppText>
        </View>
      </Screen>
    );
  }

  const selected = new Set<AccessibilityAttributeKey>(
    currentUser.accessibilityNeeds ?? [],
  );

  /** Persists a new selection, keeping the stored array in taxonomy order. */
  const persist = async (next: Set<AccessibilityAttributeKey>) => {
    setError(null);
    const accessibilityNeeds = ACCESSIBILITY_ATTRIBUTE_KEYS.filter((key) =>
      next.has(key),
    );
    try {
      await updateProfile({ accessibilityNeeds });
    } catch {
      setError(STRINGS.errors.saveFailed);
      AccessibilityInfo.announceForAccessibility(STRINGS.errors.saveFailed);
    }
  };

  const handleToggle = (key: AccessibilityAttributeKey) => {
    const next = new Set(selected);
    const isAdding = !next.has(key);
    if (isAdding) {
      next.add(key);
    } else {
      next.delete(key);
    }
    AccessibilityInfo.announceForAccessibility(
      `${ATTRIBUTE_METADATA[key].label} ${isAdding ? "added to" : "removed from"} your needs. ${next.size} selected.`,
    );
    void persist(next);
  };

  const handleClearAll = () => {
    AccessibilityInfo.announceForAccessibility(
      STRINGS.announcements.needsCleared,
    );
    void persist(new Set());
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <AppText style={{ color: colors.textMuted }}>
            {STRINGS.profile.needs.editorBody}
          </AppText>
          <AppText variant="bodyStrong" accessibilityRole="text">
            {selected.size === 0
              ? STRINGS.profile.needs.noneSelected
              : STRINGS.profile.needsCountLabel(selected.size)}
          </AppText>
        </View>

        {error ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.danger + "1A",
                borderColor: colors.danger,
              },
            ]}
          >
            <AppText style={{ color: colors.danger }}>{error}</AppText>
          </View>
        ) : null}

        {CATEGORY_DISPLAY_ORDER.map((category) => (
          <NeedsCategorySection
            key={category}
            categoryName={category}
            attributeKeys={ATTRIBUTE_KEYS_BY_CATEGORY[category] ?? []}
            selected={selected}
            onToggle={handleToggle}
          />
        ))}

        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel={STRINGS.profile.needs.clearAllLabel}
          accessibilityState={{ disabled: selected.size === 0 }}
          disabled={selected.size === 0}
          onPress={handleClearAll}
          style={[
            styles.clearButton,
            {
              borderColor: selected.size === 0 ? colors.border : colors.danger,
              opacity: selected.size === 0 ? 0.5 : 1,
            },
          ]}
        >
          <AppText
            variant="bodyStrong"
            style={{
              color: selected.size === 0 ? colors.textMuted : colors.danger,
            }}
          >
            {STRINGS.profile.needs.clearAll}
          </AppText>
        </TouchTarget>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  intro: {
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  centeredText: {
    textAlign: "center",
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  clearButton: {
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
