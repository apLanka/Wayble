import React, { useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  Keyboard,
} from "react-native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, radii } from "@/constants/theme";
import { AppText } from "@/components/ui/app-text";
import type { NearbyPlace } from "@/hooks/use-nearby-places";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  results?: NearbyPlace[];
  onSelectResult?: (place: NearbyPlace) => void;
  focusOnMount?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search places...",
  results,
  onSelectResult,
  focusOnMount = false,
}: SearchBarProps) {
  const { appTheme } = useAppTheme();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focusOnMount) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [focusOnMount]);

  const showDropdown = value.length > 0 && results && results.length > 0;

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: appTheme.colors.border,
          },
        ]}
      >
        <AppText style={styles.icon}>🔍</AppText>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: appTheme.colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={appTheme.colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityRole="search"
          accessibilityLabel="Search nearby places"
        />
        {value.length > 0 && Platform.OS === "android" && (
          <TouchableOpacity
            onPress={() => {
              onChangeText("");
              inputRef.current?.blur();
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearButton}
          >
            <AppText style={styles.clearIcon}>✕</AppText>
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const distanceStr =
                item.distance !== undefined
                  ? `${(item.distance / 1000).toFixed(1)} km away`
                  : "";
              const featuresStr =
                item.accessibilityCategories &&
                item.accessibilityCategories.length > 0
                  ? item.accessibilityCategories.join(", ")
                  : "";
              const a11yLabel = `${item.name}${distanceStr ? `, ${distanceStr}` : ""}${featuresStr ? `, features: ${featuresStr}` : ""}`;

              return (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: appTheme.colors.border },
                  ]}
                  onPress={() => {
                    onSelectResult?.(item);
                    Keyboard.dismiss();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={a11yLabel}
                >
                  <View style={styles.itemHeader}>
                    <AppText
                      style={[styles.itemName, { color: appTheme.colors.text }]}
                    >
                      {item.name}
                    </AppText>
                    {item.distance !== undefined && (
                      <AppText
                        style={[
                          styles.itemDistance,
                          { color: appTheme.colors.textMuted },
                        ]}
                      >
                        {(item.distance / 1000).toFixed(1)} km
                      </AppText>
                    )}
                  </View>
                  {item.accessibilityCategories &&
                    item.accessibilityCategories.length > 0 && (
                      <AppText
                        style={[
                          styles.itemFeatures,
                          { color: appTheme.colors.primary },
                        ]}
                      >
                        {item.accessibilityCategories.join(" • ")}
                      </AppText>
                    )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    zIndex: 1000,
    elevation: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearIcon: {
    fontSize: 16,
    color: "#9ca3af",
  },
  dropdown: {
    position: "absolute",
    top: 60, // just below the search bar
    left: spacing.md,
    right: spacing.md,
    maxHeight: 250,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    fontWeight: "600",
    fontSize: 16,
  },
  itemDistance: {
    fontSize: 14,
  },
  itemFeatures: {
    fontSize: 12,
    textTransform: "capitalize",
  },
});
