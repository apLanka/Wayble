import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";

interface LocateButtonProps {
  onPress: () => void;
  bottomOffset?: number;
}

export function LocateButton({
  onPress,
  bottomOffset = 30,
}: LocateButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { bottom: bottomOffset }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>Locate me 📍</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    zIndex: 10, // Ensure it's on top and clickable
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});
