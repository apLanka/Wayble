import { useState } from "react";
import {
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
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

type FlagReason =
  "inaccurate" | "spam" | "abusive" | "privacy" | "duplicate" | "other";

const REASONS: { reason: FlagReason; label: string }[] = [
  { reason: "inaccurate", label: "Inaccurate" },
  { reason: "spam", label: "Spam" },
  { reason: "abusive", label: "Abusive" },
  { reason: "privacy", label: "Privacy concern" },
  { reason: "duplicate", label: "Duplicate" },
  { reason: "other", label: "Other" },
];

type Props = {
  reportId: string;
  disabled: boolean;
  disabledReason: string;
};

export function ReportCardMenu({ reportId, disabled, disabledReason }: Props) {
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
    } catch (caught) {
      setIsSubmitting(false);
      setError(
        caught instanceof Error ? caught.message : "Failed to flag report",
      );
    }
  };

  const pendingLabel = REASONS.find((r) => r.reason === pendingReason)?.label;

  return (
    <View>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Report options"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={[styles.kebab, { opacity: disabled ? 0.5 : 1 }]}
      >
        <AppText variant="bodyStrong" style={{ color: colors.text }}>
          ⋮
        </AppText>
      </TouchTarget>
      {disabled ? (
        <AppText variant="label" style={{ color: colors.textMuted }}>
          {disabledReason}
        </AppText>
      ) : null}
      {error ? (
        <AppText
          accessibilityRole="alert"
          variant="label"
          style={{ color: colors.danger }}
        >
          {error}
        </AppText>
      ) : null}

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
            accessibilityLabel="Close report reason menu"
            onPress={() => setPickerVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText variant="title" accessibilityRole="header">
              Report this report as…
            </AppText>
            {REASONS.map(({ reason, label }) => (
              <TouchTarget
                key={reason}
                accessibilityRole="button"
                accessibilityLabel={`Report as ${label}`}
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
            accessibilityLabel="Cancel flagging this report"
            onPress={cancelConfirm}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText variant="title" accessibilityRole="header">
              Flag this report as {pendingLabel}?
            </AppText>
            <View style={styles.actions}>
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Cancel"
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
                <AppText variant="bodyStrong">Cancel</AppText>
              </TouchTarget>
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Confirm flagging this report"
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
                    Flag
                  </AppText>
                )}
              </TouchTarget>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  kebab: {
    alignItems: "center",
    justifyContent: "center",
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
  button: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: { borderWidth: 1 },
});
