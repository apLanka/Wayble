import {
  SymbolView,
  type AndroidSymbol,
  type SFSymbol,
  type SymbolViewProps,
} from "expo-symbols";

export type PlatformSymbol = {
  ios: SFSymbol;
  android: AndroidSymbol;
};

type AppSymbolProps = Omit<SymbolViewProps, "name"> & {
  name: PlatformSymbol | SFSymbol;
};

export function AppSymbol({
  name,
  size = 24,
  tintColor,
  ...props
}: AppSymbolProps) {
  const symbolName =
    typeof name === "string"
      ? name
      : {
          ios: name.ios,
          android: name.android,
          web: name.android,
        };

  return (
    <SymbolView
      {...props}
      name={symbolName}
      size={size}
      tintColor={tintColor}
      resizeMode="scaleAspectFit"
    />
  );
}

export const HOME_SYMBOLS = {
  profile: { ios: "person.circle", android: "person" },
  search: { ios: "magnifyingglass", android: "search" },
  openMap: { ios: "map", android: "map" },
  nearMe: { ios: "location.fill", android: "near_me" },
  wheelchair: { ios: "figure.roll", android: "accessible" },
  elevator: { ios: "arrow.up.arrow.down", android: "elevator" },
  bathroom: { ios: "toilet", android: "wc" },
  multi: { ios: "sparkles", android: "star" },
  edit: { ios: "pencil", android: "edit" },
  feed: { ios: "antenna.radiowaves.left.and.right", android: "rss_feed" },
} as const satisfies Record<string, PlatformSymbol>;
