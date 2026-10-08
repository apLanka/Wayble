import { useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useMutation } from "convex/react";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { classifyFlagError, flagErrorMessage } from "./flag-errors";

type FlagReason =
  "inaccurate" | "spam" | "abusive" | "privacy" | "duplicate" | "other";

const REASONS: { reason: FlagReason; label: string }[] = [
  { reason: "inaccurate", label: STRINGS.place.reportMenu.reasons.inaccurate },
  { reason: "spam", label: STRINGS.place.reportMenu.reasons.spam },
  { reason: "abusive", label: STRINGS.place.reportMenu.reasons.abusive },
  { reason: "privacy", label: STRINGS.place.reportMenu.reasons.privacy },
  { reason: "duplicate", label: STRINGS.place.reportMenu.reasons.duplicate },
  { reason: "other", label: STRINGS.place.reportMenu.reasons.other },
];

type Props = {
  reportId: string;
  disabled: boolean;
};

export function ReportCardMenu({ reportId, disabled }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const flagReport = useMutation(api.flags.flagReport);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingReason, setPendingReason] = useState<FlagReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPicker = () => {
    setError(null);
    setPickerVisible(true);
  };

  const pickReason = (reason: FlagReason) => {
    setPickerVisible(false);
    setPendingReason(reason);
  };

  const cancelConfirm = () => {
    if (isSubmitting) return;
    setPendingReason(null);
  };

  const confirmFlag = async () => {
    if (!pendingReason || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await flagReport({
        reportId: reportId as Id<"reports">,
        reason: pendingReason,
      });
      setIsSubmitting(false);
      setPendingReason(null);
      // Modal is already gone by the time this fires, so a sighted user has
      // no visible confirmation left on screen — the announcement is the
      // only feedback they get that the flag landed.
      AccessibilityInfo.announceForAccessibility(
        STRINGS.place.reportMenu.flagged,
      );
    } catch (caught) {
      setIsSubmitting(false);
      const message = flagErrorMessage(classifyFlagError(caught));
      setError(message);
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const pendingLabel = REASONS.find((r) => r.reason === pendingReason)?.label;

  return (
    <>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel={STRINGS.place.reportMenu.options}
        accessibilityHint={STRINGS.place.reportMenu.optionsHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={[styles.kebab, { opacity: disabled ? 0.5 : 1 }]}
      >
        <AppText style={[styles.kebabText, { color: colors.primary }]}>
          {STRINGS.place.reportMenu.kebab}
        </AppText>
      </TouchTarget>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.place.reportMenu.closeMenu}
            accessibilityHint={STRINGS.place.reportMenu.closeMenuHint}
            onPress={() => setPickerVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText variant="bodyStrong" accessibilityRole="header">
              {STRINGS.place.reportMenu.pickerTitle}
            </AppText>
            {REASONS.map(({ reason, label }) => (
              <TouchTarget
                key={reason}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.place.reportMenu.reasonLabel(label)}
                accessibilityHint={STRINGS.place.reportMenu.reasonHint}
                onPress={() => pickReason(reason)}
                style={styles.reasonRow}
              >
                <AppText variant="body" style={{ color: colors.text }}>
                  {label}
                </AppText>
              </TouchTarget>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={pendingReason !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelConfirm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <Pressable
            style={styles.backdrop}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.place.reportMenu.cancelFlagging}
            accessibilityHint={STRINGS.place.reportMenu.cancelHint}
            onPress={cancelConfirm}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText variant="bodyStrong" accessibilityRole="header">
              {STRINGS.place.reportMenu.confirmTitle(pendingLabel ?? "")}
            </AppText>
            {error ? (
              <AppText
                accessibilityRole="alert"
                variant="label"
                style={{ color: colors.danger }}
              >
                {error}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={STRINGS.place.reportMenu.cancel}
                accessibilityHint={STRINGS.place.reportMenu.cancelHint}
                disabled={isSubmitting}
                onPress={cancelConfirm}
                style={[
                  styles.button,
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    opacity: isSubmitting ? 0.6 : 1,
                  },
                ]}
              >
                <AppText variant="bodyStrong">
                  {STRINGS.place.reportMenu.cancel}
                </AppText>
              </TouchTarget>
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={STRINGS.place.reportMenu.confirmFlagging}
                accessibilityHint={STRINGS.place.reportMenu.confirmFlaggingHint}
                accessibilityState={{ disabled: isSubmitting }}
                disabled={isSubmitting}
                focusColor={colors.onPrimary}
                onPress={confirmFlag}
                style={[styles.button, { backgroundColor: colors.danger }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <AppText
                    variant="bodyStrong"
                    style={{ color: colors.onPrimary }}
                  >
                    {STRINGS.place.reportMenu.flag}
                  </AppText>
                )}
              </TouchTarget>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Minimums, not fixed sizes (WCAG 1.4.4): the glyph scales with the
  // user's text size, and a fixed 44 × 44 box would clip it at 200 %.
  kebab: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },
  kebabText: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "400",
  },
  overlay: { flex: 1, justifyContent: "center", padding: spacing.lg },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheet: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  reasonRow: {
    paddingVertical: spacing.sm,
    alignItems: "flex-start",
  },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  // `minHeight`, not `height`: a fixed 44 clips the label once text is
  // enlarged (WCAG 1.4.4); the padding keeps wrapped labels off the edges.
  button: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: { borderWidth: 1 },
});
