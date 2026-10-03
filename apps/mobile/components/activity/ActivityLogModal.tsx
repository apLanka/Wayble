import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppSymbol } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  ACTIVITY_RATING_CONFIGS,
  validateActivityDraft,
  type ActivityDraft,
  type ActivityLogItem,
  type ActivityRating,
} from "./activity-helpers";

interface PlaceSuggestion {
  _id: string;
  name: string;
}

interface ActivityLogModalProps {
  visible: boolean;
  initialItem?: ActivityLogItem | null;
  places?: PlaceSuggestion[];
  isSaving?: boolean;
  onClose: () => void;
  onSave: (draft: ActivityDraft) => Promise<void>;
}

const RATING_OPTIONS: ActivityRating[] = [
  "accessible",
  "partially_accessible",
  "inaccessible",
];

const PHOTO_PRESETS = [
  {
    label: "Ramp Entrance",
    url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
    defaultAlt:
      "Wide concrete wheelchair ramp with dual steel handrails leading to automatic entrance doors",
    tag: "WheelchairRamp",
  },
  {
    label: "Elevator Access",
    url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
    defaultAlt:
      "Public elevator with braille call buttons and wide automatic doors",
    tag: "ElevatorWorking",
  },
  {
    label: "Accessible Restroom",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    defaultAlt:
      "Spacious accessible restroom equipped with grab bars and emergency pull cord",
    tag: "AccessibleRestroom",
  },
  {
    label: "Tactile Guidance",
    url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
    defaultAlt:
      "High-contrast tactile paving indicators on ground for visually impaired navigation",
    tag: "TactilePaving",
  },
];

export function ActivityLogModal({
  visible,
  initialItem,
  places = [],
  isSaving = false,
  onClose,
  onSave,
}: ActivityLogModalProps) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;

  const isEditing = Boolean(initialItem);

  const [placeName, setPlaceName] = useState("");
  const [title, setTitle] = useState("");
  const [accessibilityRating, setAccessibilityRating] =
    useState<ActivityRating>("accessible");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>(
    "WheelchairAccessible",
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialItem) {
        setPlaceName(initialItem.placeName);
        setTitle(initialItem.title);
        setAccessibilityRating(initialItem.accessibilityRating);
        setNotes(initialItem.notes ?? "");
        setImageUrl(initialItem.imageUrl ?? "");
        setImageAlt(initialItem.imageAlt ?? "");
        setSelectedTag(initialItem.tags?.[0] ?? "WheelchairAccessible");
      } else {
        setPlaceName("");
        setTitle("");
        setAccessibilityRating("accessible");
        setNotes("");
        setImageUrl(
          "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
        );
        setImageAlt(
          "Wide concrete wheelchair ramp with dual steel handrails leading to automatic entrance doors",
        );
        setSelectedTag("WheelchairAccessible");
      }
      setValidationError(null);
    }
  }, [visible, initialItem]);

  const handleSave = async () => {
    const validation = validateActivityDraft({ placeName, title });
    if (!validation.isValid) {
      setValidationError(validation.error ?? "Invalid input");
      return;
    }

    setValidationError(null);
    await onSave({
      placeName: placeName.trim(),
      title: title.trim(),
      accessibilityRating,
      notes: notes.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      tags: selectedTag ? [selectedTag] : ["AccessibilityCheck"],
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close activity dialog"
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessible
          accessibilityRole="none"
          accessibilityLabel={
            isEditing ? "Edit activity log dialog" : "New activity log dialog"
          }
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <AppText variant="title" accessibilityRole="header">
                {isEditing ? "Edit Activity Log" : "Log Place Visit"}
              </AppText>
              <AppText style={{ color: colors.textMuted }}>
                Record your personal visit and accessibility observations.
              </AppText>
            </View>

            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={onClose}
              style={styles.closeButton}
            >
              <AppSymbol
                name={{ ios: "xmark.circle.fill", android: "cancel" }}
                size={22}
                tintColor={colors.textMuted}
              />
            </TouchTarget>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {validationError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: `${colors.danger}20`,
                    borderColor: colors.danger,
                  },
                ]}
                accessible
                accessibilityRole="alert"
              >
                <AppText style={{ color: colors.danger, fontWeight: "600" }}>
                  {validationError}
                </AppText>
              </View>
            ) : null}

            {/* Place Name Input */}
            <View style={styles.inputGroup}>
              <AppText variant="label" style={{ color: colors.text }}>
                Place / Venue Name *
              </AppText>
              <TextInput
                value={placeName}
                onChangeText={(text) => {
                  setPlaceName(text);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. Central Library, City Metro Station"
                placeholderTextColor={colors.textMuted}
                maxLength={80}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel="Place or venue name"
              />

              {places.length > 0 && !isEditing ? (
                <View style={styles.suggestionsContainer}>
                  <AppText
                    variant="label"
                    style={{ color: colors.textMuted, fontSize: 12 }}
                  >
                    Nearby suggestions:
                  </AppText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionChips}
                  >
                    {places.slice(0, 5).map((p) => (
                      <TouchTarget
                        key={p._id}
                        onPress={() => setPlaceName(p.name)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select place ${p.name}`}
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              placeName === p.name
                                ? `${colors.primary}20`
                                : colors.surfaceElevated,
                            borderColor:
                              placeName === p.name
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        <AppText
                          variant="label"
                          style={{
                            color:
                              placeName === p.name
                                ? colors.primary
                                : colors.text,
                            fontSize: 12,
                          }}
                        >
                          {p.name}
                        </AppText>
                      </TouchTarget>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            {/* Title / Headline Input */}
            <View style={styles.inputGroup}>
              <AppText variant="label" style={{ color: colors.text }}>
                Activity Headline *
              </AppText>
              <TextInput
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. Tested main entrance wheelchair ramp"
                placeholderTextColor={colors.textMuted}
                maxLength={100}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel="Activity headline"
              />
            </View>

            {/* Accessibility Rating Selector */}
            <View style={styles.inputGroup}>
              <AppText variant="label" style={{ color: colors.text }}>
                Accessibility Experience *
              </AppText>
              <View style={styles.ratingRow}>
                {RATING_OPTIONS.map((rating) => {
                  const config = ACTIVITY_RATING_CONFIGS[rating];
                  const isSelected = accessibilityRating === rating;
                  const themeColor = colors[config.colorKey];

                  return (
                    <TouchTarget
                      key={rating}
                      onPress={() => setAccessibilityRating(rating)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${config.label}: ${config.description}`}
                      style={[
                        styles.ratingButton,
                        {
                          backgroundColor: isSelected
                            ? `${themeColor}22`
                            : colors.surfaceElevated,
                          borderColor: isSelected ? themeColor : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <AppSymbol
                        name={config.symbolName}
                        size={18}
                        tintColor={isSelected ? themeColor : colors.textMuted}
                      />
                      <AppText
                        variant="label"
                        style={[
                          styles.ratingText,
                          {
                            color: isSelected ? themeColor : colors.text,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {config.shortLabel}
                      </AppText>
                    </TouchTarget>
                  );
                })}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <AppText variant="label" style={{ color: colors.text }}>
                Personal Notes & Observations (Optional)
              </AppText>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add details (e.g. ramp slope, elevator working, door width, lighting, staff assistance)..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                style={[
                  styles.multilineInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel="Personal notes and observations"
              />
            </View>

            {/* Accessibility Media Photo Presets */}
            <View style={styles.inputGroup}>
              <AppText variant="label" style={{ color: colors.text }}>
                Accessibility Feature Photo
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionChips}
              >
                {PHOTO_PRESETS.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <TouchTarget
                      key={preset.label}
                      onPress={() => {
                        setImageUrl(preset.url);
                        setImageAlt(preset.defaultAlt);
                        setSelectedTag(preset.tag);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select photo preset: ${preset.label}`}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? `${colors.primary}20`
                            : colors.surfaceElevated,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={{
                          color: isSelected ? colors.primary : colors.text,
                          fontSize: 12,
                          fontWeight: isSelected ? "700" : "500",
                        }}
                      >
                        📷 {preset.label}
                      </AppText>
                    </TouchTarget>
                  );
                })}
              </ScrollView>
            </View>

            {/* Image Alt-Text Input for Screen Readers / Low Vision */}
            <View style={styles.inputGroup}>
              <AppText variant="label" style={{ color: colors.text }}>
                Image Description / ALT Text (For Visually Impaired)
              </AppText>
              <TextInput
                value={imageAlt}
                onChangeText={setImageAlt}
                placeholder="Describe what is visible in the photo (e.g. slope, handrails, door width)..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                maxLength={300}
                style={[
                  styles.multilineInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    minHeight: 64,
                  },
                ]}
                accessibilityLabel="Image description and alt text"
              />
            </View>

            {/* Buttons */}

            <View style={styles.buttonRow}>
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                disabled={isSaving}
                onPress={onClose}
                style={[
                  styles.actionBtn,
                  {
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <AppText variant="bodyStrong" style={{ color: colors.text }}>
                  Cancel
                </AppText>
              </TouchTarget>

              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={isEditing ? "Save changes" : "Log activity"}
                disabled={isSaving}
                onPress={() => void handleSave()}
                style={[
                  styles.actionBtn,
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <AppText
                    variant="bodyStrong"
                    style={{ color: colors.onPrimary }}
                  >
                    {isEditing ? "Update Log" : "Save Log"}
                  </AppText>
                )}
              </TouchTarget>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    maxHeight: "90%",
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    textAlignVertical: "top",
  },
  suggestionsContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  suggestionChips: {
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  ratingText: {
    fontSize: 12,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flex: 1.5,
  },
});
