import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Opens the place a notification refers to.
 *
 * Handles both cases: a tap while the app is running, and a cold start where
 * the tap is what launched the app — `getLastNotificationResponseAsync`
 * covers the second, which a listener alone would miss.
 *
 * The tap currently lands on the place detail screen because US-10's
 * confirm/dispute control does not exist yet. When it does, only this
 * destination changes; the `data.placeId` payload contract stays the same.
 */
export function useNotificationRouter() {
  const router = useRouter();

  useEffect(() => {
    const openFromResponse = (
      response: Notifications.NotificationResponse | null,
    ) => {
      const placeId = response?.notification.request.content.data?.placeId;
      if (typeof placeId === "string") {
        router.push(`/place/${placeId}`);
      }
    };

    void Notifications.getLastNotificationResponseAsync().then(
      openFromResponse,
    );

    const subscription =
      Notifications.addNotificationResponseReceivedListener(openFromResponse);
    return () => subscription.remove();
  }, [router]);
}
