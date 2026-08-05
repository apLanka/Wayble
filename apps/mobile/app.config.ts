import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "mobile",
  slug: config.slug ?? "mobile",
  plugins: [
    ...(config.plugins ?? []),
    // Download token is no longer passed via plugin config — set the
    // RNMAPBOX_MAPS_DOWNLOAD_TOKEN env var before running expo/eas build
    // instead (the old RNMapboxMapsDownloadToken plugin prop is deprecated).
    "@rnmapbox/maps",
  ],
  extra: {
    ...config.extra,
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "pk.placeholder",
  },
});
