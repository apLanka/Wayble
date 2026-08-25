import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

type PermissionState = "loading" | "granted" | "denied" | "undetermined";

/** Android needs a channel before any notification will display. */
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("verify-nearby", {
    name: "Nearby verification requests",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** The EAS project id, which Expo requires to mint a push token. */
function easProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

/**
 * Requests notification permission, fetches this device's Expo push token and
 * registers it against the signed-in user.
 *
 * Never requests permission on mount — only `requestAndRegister` prompts, so
 * the user sees the OS dialog as a result of tapping the settings toggle.
 */
export function usePushRegistration() {
  const [permission, setPermission] = useState<PermissionState>("loading");
  const [token, setToken] = useState<string | null>(null);
  const register = useMutation(api.pushTokens.register);
  const unregisterToken = useMutation(api.pushTokens.unregister);

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then(({ status }) => setPermission(status as PermissionState))
      .catch(() => setPermission("undetermined"));
  }, []);

  const requestAndRegister = useCallback(async () => {
    // A simulator cannot receive push notifications at all.
    if (!Device.isDevice) {
      setPermission("denied");
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPermission(status as PermissionState);
    if (status !== "granted") return false;

    await ensureAndroidChannel();

    const projectId = easProjectId();
    if (!projectId) return false;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    setToken(data);
    await register({
      token: data,
      platform: Platform.OS === "ios" ? "ios" : "android",
      deviceName: Device.deviceName ?? undefined,
    });
    return true;
  }, [register]);

  /**
   * Removes this device's token.
   *
   * Re-reads the token from Expo when it is not already in state, because on
   * a fresh launch nothing has called `requestAndRegister` — without this,
   * signing out would silently leave the token registered and the handset
   * would keep receiving the previous account's notifications.
   */
  const unregister = useCallback(async () => {
    let current = token;
    if (!current) {
      const projectId = easProjectId();
      if (!projectId || !Device.isDevice) return;
      try {
        current = (await Notifications.getExpoPushTokenAsync({ projectId }))
          .data;
      } catch {
        return;
      }
    }
    await unregisterToken({ token: current });
    setToken(null);
  }, [token, unregisterToken]);

  return { permission, token, requestAndRegister, unregister };
}
