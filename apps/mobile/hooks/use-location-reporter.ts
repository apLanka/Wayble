import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/** At most one report every 15 minutes. */
const THROTTLE_MS = 15 * 60 * 1000;

/**
 * Reports a coarse last-known location whenever the app comes to the
 * foreground, so the nearby-verification sweep has somewhere to search from.
 *
 * Deliberately passive: it never requests location permission, and does
 * nothing unless permission has already been granted elsewhere. The mutation
 * rounds the coordinates server-side, so precise position is never stored.
 */
export function useLocationReporter(enabled: boolean) {
  const updateLocation = useMutation(api.users.updateLastKnownLocation);
  const lastReportedAt = useRef(0);

  const report = useCallback(async () => {
    if (!enabled) return;
    if (Date.now() - lastReportedAt.current < THROTTLE_MS) return;

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      lastReportedAt.current = Date.now();
      await updateLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        // getTimezoneOffset is minutes *behind* UTC, so negate it.
        timeZoneOffsetMinutes: -new Date().getTimezoneOffset(),
      });
    } catch {
      // A failed location report is not worth surfacing to the user; the
      // next foreground transition tries again.
    }
  }, [enabled, updateLocation]);

  useEffect(() => {
    if (!enabled) return;

    void report();

    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") void report();
      },
    );
    return () => subscription.remove();
  }, [enabled, report]);
}
