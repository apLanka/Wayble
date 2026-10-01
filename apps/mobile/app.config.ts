import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "mobile",
  slug: config.slug ?? "mobile",
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-location",
      {
        // Duplicated from STRINGS.permissions.os.locationWhenInUse on purpose.
        // Expo transpiles this file to app.config.js and requires it with
        // Node's CommonJS resolver, which cannot follow a relative import into
        // a .ts sibling — importing it makes `expo start` fail outright, and
        // no test or type check would catch it.
        //
        // `strings-guard.test.ts` reads this file and asserts the two agree,
        // which is the same bargain packages/backend/convex/notificationCopy.ts
        // makes with its own coverage test. Change one, change both, or the
        // suite goes red.
        locationWhenInUsePermission:
          "Wayble needs your location to show accessible places near you.",
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/android-icon-monochrome.png",
        color: "#0B6B3A",
      },
    ],
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
