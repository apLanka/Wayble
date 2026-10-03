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
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface EditDisplayNameModalProps {
  visible: boolean;
  initialName: string;
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function EditDisplayNameModal({
  visible,
  initialName,
  isSaving = false,
  error,
  onClose,
  onSave,
}: EditDisplayNameModalProps) {
  const { appTheme } = useAppTheme();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) {
      setName(initialName);
    }
  }, [visible, initialName]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    onSave(trimmedName);
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
          accessibilityLabel={STRINGS.profile.editName.closeLabel}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: appTheme.colors.surface,
              borderColor: appTheme.colors.border,
            },
          ]}
        >
          <AppText variant="title" accessibilityRole="header">
            {STRINGS.profile.editName.title}
          </AppText>
          <AppText style={{ color: appTheme.colors.textMuted }}>
            {STRINGS.profile.editName.body}
          </AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={STRINGS.profile.editName.placeholder}
            placeholderTextColor={appTheme.colors.textMuted}
            autoFocus
            editable={!isSaving}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel={STRINGS.profile.editName.label}
            style={[
              styles.input,
              {
                color: appTheme.colors.text,
                borderColor: appTheme.colors.border,
                backgroundColor: appTheme.colors.background,
              },
            ]}
          />

          {error ? (
            <AppText
              accessibilityRole="alert"
              style={{ color: appTheme.colors.danger }}
            >
              {error}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={STRINGS.profile.editName.cancelLabel}
              disabled={isSaving}
              onPress={onClose}
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  borderColor: appTheme.colors.border,
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong">
                {STRINGS.profile.editName.cancel}
              </AppText>
            </TouchTarget>

            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={STRINGS.profile.editName.saveLabel}
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              focusColor={appTheme.colors.onPrimary}
              onPress={handleSave}
              style={[
                styles.button,
                {
                  backgroundColor: appTheme.colors.primary,
                  opacity: canSave ? 1 : 0.5,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={appTheme.colors.onPrimary} />
              ) : (
                <AppText
                  variant="bodyStrong"
                  style={{ color: appTheme.colors.onPrimary }}
                >
                  {STRINGS.profile.editName.save}
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
    gap: spacing.md,
    padding: spacing.lg,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    borderWidth: 1,
  },
});
