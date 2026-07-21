import React, { useState, useEffect } from "react";
import { Marker, MarkerProps } from "react-native-maps";

export default function TrackedMarker(props: MarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return <Marker {...props} tracksViewChanges={tracksViewChanges} />;
}
