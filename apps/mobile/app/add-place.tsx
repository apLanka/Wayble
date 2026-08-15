import { useRouter } from "expo-router";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

import { AddPlaceForm } from "@/components/place/AddPlaceForm";
import { Screen } from "@/components/ui/screen";
import { spacing } from "@/constants/theme";

/** Add a new place to the map. Reached from the map's "+ Add place" button. */
export default function AddPlaceScreen() {
  const router = useRouter();

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AddPlaceForm
            onAdded={() => {
              AccessibilityInfo.announceForAccessibility("Place added");
              router.back();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.lg,
  },
});
