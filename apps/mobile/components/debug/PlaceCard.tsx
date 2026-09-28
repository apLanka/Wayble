import { StyleSheet, View } from "react-native";

import { CategoryBadge } from "@/components/place/CategoryBadge";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type DebugPlace = {
  _id: string;
  name: string;
  category: string;
  address: string;
  accessibilityCategories: string[];
  reportCount: number;
};

type Props = {
  place: DebugPlace;
  onPress: (place: DebugPlace) => void;
};

/**
 * One place in the debug list.
 *
 * A card rather than the `PlaceListItem` row the nearby list uses: this view
 * is a verification tool, so it shows everything the query returns at once —
 * business category, address, accessibility tags and report count side by
 * side — instead of the name-and-distance pair the map list optimises for.
 *
 * Tapping opens the place detail, which is where the report CTA lives, so a
 * seeded place is two taps from the S3-01 wizard.
 */
export function PlaceCard({ place, onPress }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  return (
    <TouchTarget
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.address}, ${place.reportCount} ${
        place.reportCount === 1 ? "report" : "reports"
      }`}
      accessibilityHint="Opens the place detail"
      focusColor={colors.onPrimary}
      onPress={() => onPress(place)}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <AppText variant="bodyStrong" style={{ color: colors.text }}>
        {place.name}
      </AppText>

      <CategoryBadge category={place.category} />

      <AppText variant="label" style={{ color: colors.textMuted }}>
        {place.address}
      </AppText>

      {place.accessibilityCategories.length > 0 ? (
        <View style={styles.tags}>
          {place.accessibilityCategories.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.surfaceElevated }]}
            >
              <AppText variant="label" style={{ color: colors.text }}>
                {tag}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="label" style={{ color: colors.textMuted }}>
          No accessibility tags
        </AppText>
      )}

      <AppText variant="label" style={{ color: colors.textMuted }}>
        {place.reportCount === 0
          ? "No reports yet"
          : `${place.reportCount} ${
              place.reportCount === 1 ? "report" : "reports"
            }`}
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
