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
      setErrorMsg("Failed to check location status.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch {
      setErrorMsg("Failed to get current location.");
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
        await fetchLocation();
      }
    } catch {
      setErrorMsg("Failed to request permission.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { location, status, isLoading, errorMsg, requestPermission };
}
