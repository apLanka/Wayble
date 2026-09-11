import { Image } from "expo-image";
import { useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Linking,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePhotoPicker, type PhotoSource } from "@/hooks/use-photo-picker";
import { MAX_CAPTION_LENGTH } from "@packages/backend/convex/reportLimits";
import { defaultCaption, photoValidationMessage } from "./photo-validation";
import type { DraftAction, ReportPhoto } from "./report-draft";

type Props = {
  photo: ReportPhoto | null;
  placeName: string | undefined;
  dispatch: (action: DraftAction) => void;
};

type PickerError = { message: string; offerSettings: boolean };

/**
 * US-09 — the optional photo on step 3: pick one, describe it, or remove it.
 *
 * Owns the picker hook and its error, because neither outlives this step: a
 * failed pick is not a draft fact, and the wizard's own banner is reserved for
 * submit failures. What the user ends up with goes into the draft through
 * `dispatch`, so the photo survives moving between steps.
 *
 * The caption is the photo's alt text, which is why it is a required field
 * once a photo exists, and why every thumbnail uses it as its label.
 */
export function PhotoEvidencePicker({ photo, placeName, dispatch }: Props) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const { pick, isProcessing } = usePhotoPicker();
  const [error, setError] = useState<PickerError | null>(null);

  const showError = (next: PickerError) => {
    setError(next);
    AccessibilityInfo.announceForAccessibility(next.message);
  };

  const handlePick = async (source: PhotoSource) => {
    setError(null);
    const result = await pick(source);
    switch (result.status) {
      case "picked":
        dispatch({
          type: "setPhoto",
          photo: { ...result.photo, caption: defaultCaption(placeName) },
        });
        AccessibilityInfo.announceForAccessibility(
          "Photo added. Describe what it shows below.",
        );
        return;
      case "canceled":
        return;
      case "denied":
        // Once the OS stops asking, only Settings can grant it, so that is the
        // way out offered. While it can still ask, trying again is enough.
        showError({
          message: result.canAskAgain
            ? "Wayble needs camera access to take a photo."
            : "Camera access is turned off for Wayble. You can turn it on in Settings.",
          offerSettings: !result.canAskAgain,
        });
        return;
      case "invalid":
        showError({
          message: photoValidationMessage(result.error),
          offerSettings: false,
        });
        return;
      case "failed":
        showError({
          message: "We couldn't load that photo. Please try again.",
          offerSettings: false,
        });
        return;
    }
  };

  const handleRemove = () => {
    setError(null);
    dispatch({ type: "removePhoto" });
    AccessibilityInfo.announceForAccessibility("Photo removed.");
  };

  const captionMissing = photo !== null && photo.caption.trim().length === 0;

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" accessibilityRole="header">
        Add a photo (optional)
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        A photo of the entrance, lift or bathroom helps the next person judge it
        for themselves.
      </AppText>

      {photo ? (
        <View style={styles.photoBlock}>
          <Image
            source={{ uri: photo.uri }}
            style={[styles.thumbnail, { borderColor: colors.border }]}
            contentFit="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={
              photo.caption.trim() || "Attached photo, no description yet"
            }
          />

          <View style={styles.fieldBlock}>
            <AppText
              variant="label"
              nativeID="photo-caption-label"
              style={{ color: colors.textMuted }}
            >
              Describe the photo (required)
            </AppText>
            <TextInput
              value={photo.caption}
              onChangeText={(text) =>
                dispatch({ type: "setPhotoCaption", caption: text })
              }
              placeholder="For example: ramp to the side entrance, no handrail."
              placeholderTextColor={colors.textMuted}
              maxLength={MAX_CAPTION_LENGTH}
              multiline
              accessibilityLabel="Describe the photo"
              accessibilityLabelledBy="photo-caption-label"
              accessibilityHint="Required. Read aloud to people using a screen reader."
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: captionMissing ? colors.danger : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            />
            {/* Next is disabled while this is blank, so the reason has to be
                on screen, not only implied by a greyed-out button. */}
            {captionMissing ? (
              <AppText
                variant="label"
                accessibilityLiveRegion="polite"
                style={{ color: colors.danger }}
              >
                Add a short description of the photo to continue.
              </AppText>
            ) : null}
          </View>

          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            accessibilityHint="Takes the photo off this report. You can add another."
            onPress={handleRemove}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <AppText variant="bodyStrong" style={{ color: colors.text }}>
              Remove photo
            </AppText>
          </TouchTarget>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <SourceButton
            label="Take photo"
            hint="Opens the camera to photograph this place"
            disabled={isProcessing}
            onPress={() => void handlePick("camera")}
          />
          <SourceButton
            label="Choose from library"
            hint="Opens your photo library to pick a photo"
            disabled={isProcessing}
            onPress={() => void handlePick("library")}
          />
        </View>
      )}

      {isProcessing ? (
        <View style={styles.processing} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} />
          <AppText style={{ color: colors.textMuted }}>
            Preparing photo…
          </AppText>
        </View>
      ) : null}

      {error ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.danger + "1A",
              borderColor: colors.danger,
            },
          ]}
        >
          <AppText style={{ color: colors.danger }}>{error.message}</AppText>
          {error.offerSettings ? (
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              accessibilityHint="Opens Wayble's settings, where you can allow camera access"
              onPress={() => void Linking.openSettings()}
              style={styles.settingsLink}
            >
              <AppText variant="bodyStrong" style={{ color: colors.primary }}>
                Open Settings
              </AppText>
            </TouchTarget>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SourceButton({
  label,
  hint,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  return (
    <TouchTarget
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled, busy: disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.secondaryButton,
        styles.sourceButton,
        { borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <AppText variant="bodyStrong" style={{ color: colors.text }}>
        {label}
      </AppText>
    </TouchTarget>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  photoBlock: {
    gap: spacing.md,
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 88,
    // 16pt, as on every other text input in the app: below that, iOS zooms
    // the viewport on focus and the user loses their place in the wizard.
    fontSize: 16,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sourceButton: {
    flexGrow: 1,
    flexBasis: 140,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  processing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  settingsLink: {
    alignSelf: "flex-start",
    justifyContent: "center",
  },
});
