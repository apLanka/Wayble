import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

export function useScreenReader() {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    // Initial check
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderEnabled(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        setIsScreenReaderEnabled(enabled);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return { isScreenReaderEnabled };
}
