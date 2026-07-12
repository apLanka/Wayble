import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "mobile",
  slug: config.slug ?? "mobile",
  plugins: [
    ...(config.plugins ?? []),
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken:
          process.env.RNMAPBOX_DOWNLOAD_TOKEN ?? "sk.placeholder",
      },
    ],
  ],
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey:
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ??
        "placeholder-ios-key",
    },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ??
          "placeholder-android-key",
      },
    },
  },
  extra: {
    ...config.extra,
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "pk.placeholder",
  },
});
