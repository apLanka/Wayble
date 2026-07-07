import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is not set. Run `bun run dev` from the repo root, " +
      "or follow the manual fallback in README > Setup.",
  );
}

// `unsavedChangesWarning` defaults to true and calls a browser-only API, which
// does not exist in React Native. It must be disabled here.
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

interface ConvexClientProviderProps {
  children: ReactNode;
}

// No auth provider yet. When US-01 lands, this is where ClerkProvider +
// ConvexProviderWithClerk (or Convex Auth) wraps the client — see the team's
// wandrlust repo for the Clerk variant, including the expo-secure-store
// tokenCache the session needs to survive an app restart.
export default function ConvexClientProvider({
  children,
}: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
