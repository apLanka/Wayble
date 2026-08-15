import React, { useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, radii } from "@/constants/theme";
import { AppText } from "@/components/ui/app-text";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search places...",
}: SearchBarProps) {
  const { appTheme } = useAppTheme();
  const inputRef = useRef<TextInput>(null);

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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    zIndex: 10,
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
});
