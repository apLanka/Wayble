import { Stack } from "expo-router";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

export default function RootLayout() {
  return (
    <ConvexClientProvider>
      <Stack />
    </ConvexClientProvider>
  );
}
