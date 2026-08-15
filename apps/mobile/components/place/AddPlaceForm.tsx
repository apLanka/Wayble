import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import {
  LocationPicker,
  type PickedLocation,
} from "@/components/place/LocationPicker";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLocationPermission } from "@/hooks/use-location-permission";
import { reverseGeocode } from "@/utils/reverse-geocode";

// Matches placeCategoryValidator in packages/backend/convex/schema.ts.
const CATEGORIES = [
  "education",
  "food_and_drink",
  "government",
  "healthcare",
  "lodging",
  "outdoor",
  "retail",
  "transport",
  "workplace",
  "other",
] as const;
type PlaceCategory = (typeof CATEGORIES)[number];

// Matches accessibilityCategoryValidator in packages/backend/convex/schema.ts
// — the actual disability/elderly accessibility tag (pin filter on the map),
// separate from the business category above. Optional: not every place has one.
const ACCESSIBILITY_CATEGORIES = [
  "wheelchair",
  "elevator",
  "bathroom",
  "multi",
] as const;
type AccessibilityCategory = (typeof ACCESSIBILITY_CATEGORIES)[number];

interface AddPlaceFormProps {
  /** Called after the place is created. Omit to stay on the form with a toast. */
  onAdded?: () => void;
}

// Creates a place via `places.create`. Used by the add-place screen and the
// debug screen.
export function AddPlaceForm({ onAdded }: AddPlaceFormProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const { location } = useLocationPermission();
  const createPlace = useMutation(api.places.create);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("other");
  const [accessibilityCategories, setAccessibilityCategories] = useState<
    AccessibilityCategory[]
  >([]);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  // Autofill name/address from the picked point, but never overwrite what the
  // user typed themselves.
  const nameEdited = useRef(false);
  const addressEdited = useRef(false);
  useEffect(() => {
    if (!picked) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void reverseGeocode(
        picked.latitude,
        picked.longitude,
        controller.signal,
      ).then((result) => {
        if (!result || controller.signal.aborted) return;
        if (!nameEdited.current) setName(result.name ?? "");
        if (!addressEdited.current) setAddress(result.address ?? "");
      });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [picked]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleAccessibilityCategory = (tag: AccessibilityCategory) => {
    setAccessibilityCategories((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Name is required.");
    if (!picked) return setError("Pick a location on the map.");
    setError("");
    setIsSubmitting(true);
    try {
      await createPlace({
        name: name.trim(),
        category,
        address: address.trim(),
        location: picked,
        accessibilityCategories: accessibilityCategories.length
          ? accessibilityCategories
          : undefined,
      });
      setName("");
      setAddress("");
      nameEdited.current = false;
      addressEdited.current = false;
      setAccessibilityCategories([]);
      setToast("Place added.");
      onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add place.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <View style={styles.form}>
      <AppText variant="title" accessibilityRole="header">
        Add place
      </AppText>

      <TextInput
        accessibilityLabel="Place name"
        placeholder="Place name"
        placeholderTextColor={colors.textMuted}
        style={inputStyle}
        value={name}
        onChangeText={(text) => {
          nameEdited.current = text.length > 0;
          setName(text);
        }}
      />
      <TextInput
        accessibilityLabel="Address"
        placeholder="Address"
        placeholderTextColor={colors.textMuted}
        style={inputStyle}
        value={address}
        onChangeText={(text) => {
          addressEdited.current = text.length > 0;
          setAddress(text);
        }}
      />
      <AppText variant="label" style={{ color: colors.textMuted }}>
        Location
      </AppText>
      <LocationPicker
        value={picked}
        onChange={setPicked}
        userLocation={
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : null
        }
      />

      <View style={styles.categories}>
        {CATEGORIES.map((cat) => {
          const isActive = cat === category;
          return (
            <TouchTarget
              key={cat}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{ color: isActive ? colors.onPrimary : colors.text }}
              >
                {cat}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>

      <AppText variant="label" style={{ color: colors.textMuted }}>
        Accessibility features (optional, select any)
      </AppText>
      <View style={styles.categories}>
        {ACCESSIBILITY_CATEGORIES.map((tag) => {
          const isActive = accessibilityCategories.includes(tag);
          return (
            <TouchTarget
              key={tag}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isActive }}
              accessibilityLabel={tag}
              onPress={() => toggleAccessibilityCategory(tag)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{ color: isActive ? colors.onPrimary : colors.text }}
              >
                {tag}
              </AppText>
            </TouchTarget>
          );
        })}
      </View>

      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}

      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Add place"
        accessibilityHint="Creates a place and pins it on the map"
        focusColor={colors.onPrimary}
        disabled={isSubmitting}
        onPress={() => void handleSubmit()}
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
        ]}
      >
        <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
          {isSubmitting ? "Adding…" : "Add place"}
        </AppText>
      </TouchTarget>

      {toast ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { backgroundColor: colors.success }]}
        >
          <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
            {toast}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  submitButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
});
