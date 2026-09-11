import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import {
  ATTRIBUTE_METADATA,
  ATTRIBUTE_ICON_EMOJI,
} from "@/constants/accessibility-metadata";
import { spacing, radii } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultPlaceId?: Id<"places">;
  placesList?: Array<{ _id: string; name: string }>;
};

const COMMON_ATTRIBUTES: AccessibilityAttributeKey[] = [
  "mobility.step_free_entrance",
  "mobility.elevator",
  "mobility.accessible_restroom",
  "mobility.accessible_parking",
  "vision.tactile_guidance",
  "hearing.visual_alarms",
  "assistance.service_animals",
];

export function SubmitVerificationModal({
  visible,
  onClose,
  defaultPlaceId,
  placesList = [],
}: Props) {
  const { appTheme, isDark } = useAppTheme();
  const submitPlaceVerification = useMutation(
    api.verifications.submitPlaceVerification,
  );

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    defaultPlaceId || (placesList.length > 0 ? placesList[0]._id : ""),
  );
  const [selectedAttribute, setSelectedAttribute] =
    useState<AccessibilityAttributeKey>("mobility.step_free_entrance");
  const [verdict, setVerdict] = useState<"confirm" | "dispute">("confirm");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback: list places when no nearby places are available (e.g. location off)
  const nearestPlaces = useQuery(
    api.places.search,
    placesList.length === 0 ? { query: "", limit: 10 } : "skip",
  );

  const effectivePlaces =
    placesList.length > 0
      ? placesList
      : (nearestPlaces || []).map((p) => ({ _id: p._id, name: p.name }));

  // Use the user's pick (or the route's place) only while it is still listed;
  // otherwise fall back to the first available place so submit never stays disabled.
  const activePlaceId =
    defaultPlaceId ||
    (effectivePlaces.some((p) => p._id === selectedPlaceId)
      ? selectedPlaceId
      : (effectivePlaces[0]?._id ?? ""));

  const handleSubmit = async () => {
    if (!activePlaceId) {
      Alert.alert("Missing Place", "Please select a place to verify.");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitPlaceVerification({
        placeId: activePlaceId as Id<"places">,
        attributeKey: selectedAttribute,
        verdict,
        note: note.trim() || undefined,
      });

      setNote("");
      onClose();
      Alert.alert("Verification submitted", "It will appear in the live feed.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit verification.";
      Alert.alert("Verification Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: appTheme.colors.surface },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <AppText
              variant="title"
              style={[styles.title, { color: appTheme.colors.text }]}
            >
              Verify Accessibility
            </AppText>
            <TouchTarget
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close verification modal"
            >
              <AppText
                style={[
                  styles.closeButtonText,
                  { color: appTheme.colors.textMuted },
                ]}
              >
                ✕
              </AppText>
            </TouchTarget>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Place Selection */}
            {effectivePlaces.length === 0 && !defaultPlaceId && (
              <AppText style={{ color: appTheme.colors.textMuted }}>
                Loading places…
              </AppText>
            )}
            {effectivePlaces.length > 0 && !defaultPlaceId && (
              <View style={styles.formSection}>
                <AppText
                  variant="label"
                  style={[styles.sectionLabel, { color: appTheme.colors.text }]}
                >
                  Select Place
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.placesRow}
                >
                  {effectivePlaces.map((p) => {
                    const isSelected = p._id === activePlaceId;
                    return (
                      <TouchTarget
                        key={p._id}
                        onPress={() => setSelectedPlaceId(p._id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select place ${p.name}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? appTheme.colors.primary
                                : isDark
                                  ? appTheme.colors.background
                                  : "#F0F4F2",
                              borderColor: isSelected
                                ? appTheme.colors.primary
                                : appTheme.colors.border + "40",
                            },
                          ]}
                        >
                          <AppText
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? appTheme.colors.onPrimary
                                  : appTheme.colors.text,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {p.name}
                          </AppText>
                        </View>
                      </TouchTarget>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Verdict Selection */}
            <View style={styles.formSection}>
              <AppText
                variant="label"
                style={[styles.sectionLabel, { color: appTheme.colors.text }]}
              >
                Verification Verdict
              </AppText>
              <View style={styles.verdictRow}>
                <TouchTarget
                  onPress={() => setVerdict("confirm")}
                  style={styles.verdictOption}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm feature is accessible"
                  accessibilityState={{ selected: verdict === "confirm" }}
                >
                  <View
                    style={[
                      styles.verdictBox,
                      {
                        backgroundColor:
                          verdict === "confirm"
                            ? isDark
                              ? "#143D22"
                              : "#E6F6ED"
                            : isDark
                              ? appTheme.colors.background
                              : "#F5F5F5",
                        borderColor:
                          verdict === "confirm"
                            ? appTheme.colors.primary
                            : "transparent",
                      },
                    ]}
                  >
                    <AppText style={styles.verdictBigIcon}>✅</AppText>
                    <AppText
                      variant="bodyStrong"
                      style={{
                        color:
                          verdict === "confirm"
                            ? isDark
                              ? "#9BE5B3"
                              : "#0B6B3A"
                            : appTheme.colors.text,
                      }}
                    >
                      Confirm
                    </AppText>
                    <AppText
                      style={[
                        styles.verdictSubtext,
                        { color: appTheme.colors.textMuted },
                      ]}
                    >
                      Feature exists & works
                    </AppText>
                  </View>
                </TouchTarget>

                <TouchTarget
                  onPress={() => setVerdict("dispute")}
                  style={styles.verdictOption}
                  accessibilityRole="button"
                  accessibilityLabel="Dispute feature or report barrier"
                  accessibilityState={{ selected: verdict === "dispute" }}
                >
                  <View
                    style={[
                      styles.verdictBox,
                      {
                        backgroundColor:
                          verdict === "dispute"
                            ? isDark
                              ? "#481E1C"
                              : "#FDEAE9"
                            : isDark
                              ? appTheme.colors.background
                              : "#F5F5F5",
                        borderColor:
                          verdict === "dispute"
                            ? appTheme.colors.danger
                            : "transparent",
                      },
                    ]}
                  >
                    <AppText style={styles.verdictBigIcon}>⚠️</AppText>
                    <AppText
                      variant="bodyStrong"
                      style={{
                        color:
                          verdict === "dispute"
                            ? isDark
                              ? "#FFB4AB"
                              : "#B3261E"
                            : appTheme.colors.text,
                      }}
                    >
                      Dispute
                    </AppText>
                    <AppText
                      style={[
                        styles.verdictSubtext,
                        { color: appTheme.colors.textMuted },
                      ]}
                    >
                      Broken, missing or blocked
                    </AppText>
                  </View>
                </TouchTarget>
              </View>
            </View>

            {/* Attribute Selection */}
            <View style={styles.formSection}>
              <AppText
                variant="label"
                style={[styles.sectionLabel, { color: appTheme.colors.text }]}
              >
                Feature / Attribute
              </AppText>
              <View style={styles.attributesGrid}>
                {COMMON_ATTRIBUTES.map((key) => {
                  const meta = ATTRIBUTE_METADATA[key];
                  const emoji = ATTRIBUTE_ICON_EMOJI[key] || "📍";
                  const isSelected = selectedAttribute === key;
                  return (
                    <TouchTarget
                      key={key}
                      onPress={() => setSelectedAttribute(key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Attribute: ${meta.label}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View
                        style={[
                          styles.attributeChip,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? "#1F3B2B"
                                : "#E3F3EA"
                              : isDark
                                ? appTheme.colors.background
                                : "#F4F7F5",
                            borderColor: isSelected
                              ? appTheme.colors.primary
                              : appTheme.colors.border + "30",
                          },
                        ]}
                      >
                        <AppText style={styles.attrEmoji}>{emoji}</AppText>
                        <AppText
                          style={[
                            styles.attrLabelText,
                            {
                              color: isSelected
                                ? isDark
                                  ? "#9BE5B3"
                                  : "#0B6B3A"
                                : appTheme.colors.text,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {meta.label}
                        </AppText>
                      </View>
                    </TouchTarget>
                  );
                })}
              </View>
            </View>

            {/* Note Input */}
            <View style={styles.formSection}>
              <AppText
                variant="label"
                style={[styles.sectionLabel, { color: appTheme.colors.text }]}
              >
                Verification Note (Optional)
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark
                      ? appTheme.colors.background
                      : "#F8FAF9",
                    color: appTheme.colors.text,
                    borderColor: appTheme.colors.border + "50",
                  },
                ]}
                placeholder="e.g. Ramp is clear with handrails on both sides"
                placeholderTextColor={appTheme.colors.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                accessibilityLabel="Verification note input"
              />
            </View>

            {/* Submit Button */}
            <TouchTarget
              onPress={handleSubmit}
              disabled={isSubmitting || !activePlaceId}
              style={styles.submitTouchTarget}
              accessibilityRole="button"
              accessibilityLabel="Submit Verification button"
            >
              <View
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: appTheme.colors.primary,
                    opacity: isSubmitting || !activePlaceId ? 0.6 : 1,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    color={appTheme.colors.onPrimary}
                    size="small"
                  />
                ) : (
                  <AppText
                    variant="bodyStrong"
                    style={{
                      color: appTheme.colors.onPrimary,
                      fontWeight: "700",
                    }}
                  >
                    Submit Live Verification
                  </AppText>
                )}
              </View>
            </TouchTarget>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "88%",
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  formSection: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  placesRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  verdictRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  verdictOption: {
    flex: 1,
  },
  verdictBox: {
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: 4,
  },
  verdictBigIcon: {
    fontSize: 22,
  },
  verdictSubtext: {
    fontSize: 11,
    textAlign: "center",
  },
  attributesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  attributeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  attrEmoji: {
    fontSize: 13,
  },
  attrLabelText: {
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: "top",
  },
  submitTouchTarget: {
    width: "100%",
    marginTop: spacing.sm,
  },
  submitButton: {
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
