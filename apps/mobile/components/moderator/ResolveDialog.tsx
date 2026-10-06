import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MAX_MODERATOR_NOTE_LENGTH } from "./moderation-history";
import type { ModerationAction } from "./moderation-errors";

type Props = {
  visible: boolean;
  action: ModerationAction;
  placeName: string;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (note: string) => void;
};

const COPY: Record<
  ModerationAction,
  { title: string; body: string; confirm: string }
> = {
  dismiss: {
    title: "Dismiss flags",
    body: "The report stays visible. The flags are closed as unfounded.",
    confirm: "Dismiss",
  },
  remove: {
    title: "Remove report",
    body: "The report is hidden from everyone and the flags are upheld. This can't be undone from the app.",
    confirm: "Remove",
  },
};

/**
 * S4-7b — confirmation step for a moderation decision, with an optional note
 * that is stored with the decision and shown in the history.
 */
export function ResolveDialog({
  visible,
  action,
  placeName,
  isSubmitting = false,
  error,
  onClose,
  onConfirm,
}: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const [note, setNote] = useState("");
  const copy = COPY[action];
  const destructive = action === "remove";
  const confirmColor = destructive ? colors.danger : colors.primary;

  // A fresh note for every dialog, so one decision's text can't leak into the next.
  useEffect(() => {
    if (visible) setNote("");
  }, [visible, action, placeName]);

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
          accessibilityLabel="Close dialog"
          onPress={isSubmitting ? undefined : onClose}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="title" accessibilityRole="header">
            {copy.title}
          </AppText>
          <AppText variant="bodyStrong">{placeName}</AppText>
          <AppText style={{ color: colors.textMuted }}>{copy.body}</AppText>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.textMuted}
            editable={!isSubmitting}
            multiline
            maxLength={MAX_MODERATOR_NOTE_LENGTH}
            accessibilityLabel="Moderator note, optional"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
          <AppText variant="label" style={{ color: colors.textMuted }}>
            {note.length}/{MAX_MODERATOR_NOTE_LENGTH}
          </AppText>

          {error ? (
            <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={isSubmitting}
              onPress={onClose}
              style={[
                styles.button,
                styles.secondary,
                { borderColor: colors.border, opacity: isSubmitting ? 0.6 : 1 },
              ]}
            >
              <AppText variant="bodyStrong">Cancel</AppText>
            </TouchTarget>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={`${copy.confirm} report at ${placeName}`}
              accessibilityState={{
                disabled: isSubmitting,
                busy: isSubmitting,
              }}
              disabled={isSubmitting}
              onPress={() => onConfirm(note)}
              style={[styles.button, { backgroundColor: confirmColor }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <AppText
                  variant="bodyStrong"
                  style={{ color: colors.onPrimary }}
                >
                  {copy.confirm}
                </AppText>
              )}
            </TouchTarget>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheet: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    borderWidth: 1,
  },
});
