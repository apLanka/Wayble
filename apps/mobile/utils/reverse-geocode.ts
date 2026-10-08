export interface GeocodedPlace {
  /** POI name, when the point is on a named place. */
  name?: string;
  address?: string;
}

interface MapboxFeature {
  text: string;
  place_name: string;
  place_type: string[];
}

async function fetchFeature(
  latitude: number,
  longitude: number,
  token: string,
  types: string | null,
  signal?: AbortSignal,
): Promise<MapboxFeature | undefined> {
  const typesParam = types ? `types=${types}&` : "";
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${typesParam}limit=1&access_token=${token}`,
    { signal },
  );
  if (!response.ok) return undefined;
  const data = (await response.json()) as { features?: MapboxFeature[] };
  return data.features?.[0];
}

/**
 * Reverse-geocodes a point with the Mapbox Geocoding API. Prefers a POI or
 * street address, falling back to the nearest locality/region when the point
 * has neither. Null on any failure.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<GeocodedPlace | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const feature =
      (await fetchFeature(latitude, longitude, token, "poi,address", signal)) ??
      (await fetchFeature(latitude, longitude, token, null, signal));
    if (!feature) return null;

    if (feature.place_type.includes("poi")) {
      // A POI's place_name is "<name>, <address>".
      const prefix = `${feature.text}, `;
      return {
        name: feature.text,
        address: feature.place_name.startsWith(prefix)
          ? feature.place_name.slice(prefix.length)
          : feature.place_name,
      };
    }
    return { address: feature.place_name };
  } catch {
    return null;
  }
}
