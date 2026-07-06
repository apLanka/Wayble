import {ConvexProvider, ConvexReactClient} from "convex/react";
import {Stack} from "expo-router";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error(
        "EXPO_PUBLIC_CONVEX_URL is not set. Run `bun run dev` from the repo root, " +
        "or follow the manual fallback in README > Setup.",
    );
}

const convex = new ConvexReactClient(convexUrl, {
    unsavedChangesWarning: false,
});

export default function RootLayout() {
    return (
        <ConvexProvider client={convex}>
            <Stack/>
        </ConvexProvider>
    );
}
