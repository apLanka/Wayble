import { STRINGS } from "@/constants/strings";

import * as Location from "expo-location";
import { useEffect, useState } from "react";

export function useLocationPermission() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [status, setStatus] = useState<Location.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setStatus(status);
      if (status === "granted") {
        await fetchLocation();
      }
    } catch {
      setErrorMsg(STRINGS.errors.location.checkStatusFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocation = async () => {
    try {
      console.log("Fetching location...");
      const loc = await Location.getCurrentPositionAsync({});
      console.log("Got location:", loc.coords.latitude, loc.coords.longitude);
      setLocation(loc);
      return loc;
    } catch (e) {
      console.log("Fetch location error:", e);
      setErrorMsg(STRINGS.errors.location.getCurrentFailed);
      return null;
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { status: newStatus } =
        await Location.requestForegroundPermissionsAsync();
      setStatus(newStatus);
      if (newStatus === "granted") {
        return await fetchLocation();
      }
      return null;
    } catch {
      setErrorMsg(STRINGS.errors.location.requestFailed);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = async () => {
    try {
      const currentStatus = (await Location.getForegroundPermissionsAsync())
        .status;
      if (currentStatus === "granted") {
        return await fetchLocation();
      }
    } catch {
      // Ignore
    }
    return null;
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    location,
    status,
    isLoading,
    errorMsg,
    requestPermission,
    refreshLocation,
  };
}
