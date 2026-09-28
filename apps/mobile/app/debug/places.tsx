import { Stack } from "expo-router";

import { DebugPlacesList } from "@/components/debug/DebugPlacesList";
import { Screen } from "@/components/ui/screen";

/**
 * Debug route listing every place as a card.
 *
 * Reached from `/debug`. Exists because the nearby list and map are both
 * gated on a location fix, so on a simulator with no simulated location they
 * show nothing even when the table is full — this view is how you tell "the
 * seed did not run" apart from "the app cannot see my location".
 */
export default function DebugPlacesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "All places" }} />
      <Screen>
        <DebugPlacesList />
      </Screen>
    </>
  );
}
