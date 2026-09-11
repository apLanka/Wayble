import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";

import {
  PHOTO_JPEG_QUALITY,
  resizeFor,
  validatePhoto,
  type PhotoValidationError,
} from "@/components/report/photo-validation";
import type { ReportPhoto } from "@/components/report/report-draft";

export type PhotoSource = "camera" | "library";

/** A picked, compressed, validated photo — everything but its caption. */
export type PickedPhoto = Omit<ReportPhoto, "caption">;

export type PickResult =
  | { status: "picked"; photo: PickedPhoto }
  | { status: "canceled" }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "invalid"; error: PhotoValidationError }
  | { status: "failed" };

/**
 * US-09 — take or choose one photo, compress it, and check it is uploadable.
 *
 * Only the camera asks for permission. The library opens the system photo
 * picker (PHPicker on iOS 14+, the Android photo picker), which runs out of
 * process and hands back only what the user chose, so it needs none.
 *
 * Every photo is re-encoded as JPEG and scaled to at most `MAX_PHOTO_EDGE` on
 * its long side. That keeps uploads small and turns iOS's HEIC into a type the
 * server accepts. Validation runs on the re-encoded file, since that is what
 * gets uploaded.
 *
 * Nothing is uploaded here; the photo stays on the device until submit.
 */
export function usePhotoPicker() {
  const [isProcessing, setIsProcessing] = useState(false);
  // A ref as well as state: two taps inside one render would both read the
  // stale `false` from state and open two pickers.
  const busy = useRef(false);

  const pick = useCallback(async (source: PhotoSource): Promise<PickResult> => {
    if (busy.current) return { status: "canceled" };
    busy.current = true;
    setIsProcessing(true);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          return { status: "denied", canAskAgain: permission.canAskAgain };
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        // Full quality out of the picker; the one lossy step is ours below,
        // so the photo is not compressed twice.
        quality: 1,
        allowsEditing: false,
        exif: false,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return { status: "canceled" };

      const asset = result.assets[0];
      if (!asset) return { status: "canceled" };

      const context = ImageManipulator.manipulate(asset.uri);
      const resize = resizeFor(asset.width, asset.height);
      if (resize) context.resize(resize);
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: PHOTO_JPEG_QUALITY,
      });

      // The manipulator reports dimensions but not bytes. Reading the file
      // back as a blob is the one size measurement that matches what the
      // upload will send.
      const blob = await (await fetch(saved.uri)).blob();
      const photo: PickedPhoto = {
        uri: saved.uri,
        mimeType: "image/jpeg",
        fileSize: blob.size,
      };

      const validation = validatePhoto(photo);
      if (!validation.ok) return { status: "invalid", error: validation.error };
      return { status: "picked", photo };
    } catch {
      return { status: "failed" };
    } finally {
      busy.current = false;
      setIsProcessing(false);
    }
  }, []);

  return { pick, isProcessing };
}
