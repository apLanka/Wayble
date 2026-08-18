# S1-US-01 — Sign Up and Log In (Convex Auth)

## Story

- **Sprint:** Sprint 1
- **Epic:** Epic E2 Identity
- **Estimate:** 5 points
- **Owner:** M1
- **Objective:** As a visitor, I can create an account and log in, so my contributions are attributed to me.

## Acceptance Criteria

1. **Email + password registration:** Visitors can register with an email address and password.
2. **Duplicate email rejection:** Attempting to register an existing email is rejected with a clear, user-friendly inline error message.
3. **Session persistence (JWT):** The authentication token/JWT persists across mobile app restarts via `expo-secure-store`.
4. **Resilient error handling:** Invalid credentials during sign-in display an inline error and do not crash or leave the UI in an inconsistent state.

## Current State

- In Sprint 0 (S0-5), `packages/backend/convex/schema.ts` established the initial `users` table with fields `authSubject: v.string()`, `displayName: v.string()`, `avatarUrl: v.optional(v.string())`, `role: userRoleValidator`, and `updatedAt: v.number()`.
- The mobile app (`apps/mobile`) uses a bare `ConvexProvider` in `ConvexClientProvider.tsx` with no authentication provider or token storage wired up.
- The router in `apps/mobile/app/index.tsx` redirects unconditionally to `/home`. No auth routes (`/(auth)/sign-in`, `/(auth)/sign-up`) exist.
- No HTTP routes are configured in the Convex backend (`packages/backend/convex/http.ts` does not exist).
- Protected queries/mutations have no standard helper to resolve the caller's user identity.

## Technical Decisions & Architecture Baseline

1. **Authentication Engine:** Use `@convex-dev/auth` with the built-in `Password` provider (`@convex-dev/auth/providers/Password`).
2. **Schema Integration:**
   - Import `authTables` from `@convex-dev/auth/server` and spread `...authTables` into `defineSchema()`.
   - Extend the `users` table definition (`authTables.users`) to include custom application fields (`displayName`, `avatarUrl`, `role`, `updatedAt`).
   - Deprecate/remove `authSubject` and index `by_auth_subject` since Convex Auth maintains account linkages in `authAccounts`.
3. **Backend HTTP & Routing:**
   - Implement `convex/auth.ts` configuring the Password provider with `convexAuth({ providers: [Password] })`.
   - Implement `convex/http.ts` registering auth endpoints via `auth.addHttpRoutes(http)`.
4. **Identity & Authorization Helpers:**
   - Standardize `getAuthUserId(ctx)` helper for all protected queries and mutations.
   - Provide a `currentUser` query in `convex/users.ts` returning the authenticated user document.
5. **Mobile Token Persistence & Client Provider:**
   - Install `expo-secure-store` and `@convex-dev/auth` in `apps/mobile`.
   - In `ConvexClientProvider.tsx`, wrap the client with `ConvexAuthProvider` passing a secure storage adapter backed by `expo-secure-store` (`getItemAsync`, `setItemAsync`, `deleteItemAsync`).
6. **Mobile Auth UX & Flow:**
   - Create auth screen group `apps/mobile/app/(auth)/` with stack navigation containing `sign-in.tsx` and `sign-up.tsx`.
   - Implement inline client-side validation (email format regex, password length constraints, password confirmation matching).
   - Catch Convex Auth authentication errors (such as duplicate email / invalid credentials) and map them to clean inline alerts.
   - Update root layout `app/_layout.tsx` and entry redirect `app/index.tsx` to conditionally route based on `useConvexAuth()`.

---

## Scope

### In Scope

- Install `@convex-dev/auth` and `@auth/core` in `packages/backend`.
- Spread `authTables` into `packages/backend/convex/schema.ts` and merge custom user fields.
- Create `packages/backend/convex/auth.config.ts`, `auth.ts`, and `http.ts`.
- Provide `getAuthUserId(ctx)` helper and `currentUser` query in `convex/users.ts`.
- Install `@convex-dev/auth` and `expo-secure-store` in `apps/mobile`.
- Update `ConvexClientProvider.tsx` with `ConvexAuthProvider` and `expo-secure-store` storage adapter.
- Create `apps/mobile/app/(auth)/_layout.tsx`, `sign-in.tsx`, and `sign-up.tsx` with inline error validation.
- Update `apps/mobile/app/_layout.tsx` and `app/index.tsx` for auth-state redirection.
- Add unit and integration tests using `convex-test` for authed vs unauthed access.
- Update existing test helpers (`seedGraph`) in `schema.test.ts` to align with the new schema.

### Out of Scope

- OAuth providers (Google, Apple, GitHub) — planned for subsequent stories.
- Password reset via transactional email / magic links.
- Multi-factor authentication (MFA / OTP).
- Role-based admin management dashboard.

---

## Detailed Design & Implementation Breakdown

### 1. Backend Schema & Tables (`packages/backend/convex/schema.ts`)

```ts
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  health: defineTable({
    count: v.number(),
  }),

  users: defineTable({
    ...authTables.users.fields,
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("member"), v.literal("moderator"), v.literal("admin")),
    ),
    updatedAt: v.optional(v.number()),
  }),

  // places, reports, verifications, flags...
});
```

### 2. Convex Auth Configuration (`packages/backend/convex/`)

- **`convex/auth.config.ts`**:
  ```ts
  export default {
    providers: [],
  };
  ```
- **`convex/auth.ts`**:
  ```ts
  import { convexAuth } from "@convex-dev/auth/server";
  import { Password } from "@convex-dev/auth/providers/Password";

  export const { auth, signIn, signOut, store } = convexAuth({
    providers: [Password],
  });
  ```
- **`convex/http.ts`**:
  ```ts
  import { httpRouter } from "convex/server";
  import { auth } from "./auth";

  const http = httpRouter();
  auth.addHttpRoutes(http);

  export default http;
  ```

### 3. User Resolution & Protected Mutation Helpers (`convex/users.ts`)

```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export { getAuthUserId };

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});
```

### 4. Mobile Auth Provider & Storage Adapter (`apps/mobile/components/providers/ConvexClientProvider.tsx`)

```tsx
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL is not set.");
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      {children}
    </ConvexAuthProvider>
  );
}
```

### 5. Mobile Auth Screens & Navigation

- **`(auth)/_layout.tsx`**: Clean stack without tabs or headers.
- **`(auth)/sign-in.tsx`**:
  - Inputs for email & password.
  - Calls `signIn("password", { email, password, flow: "signIn" })`.
  - Handles invalid credentials with clear inline error message.
  - Navigation button to `/sign-up`.
- **`(auth)/sign-up.tsx`**:
  - Inputs for email, password, confirm password.
  - Calls `signIn("password", { email, password, flow: "signUp" })`.
  - Inline validation for password matching and minimum length.
  - Handles duplicate email rejection with friendly inline feedback.
  - Navigation button to `/sign-in`.
- **`app/_layout.tsx` & `app/index.tsx`**:
  - Check auth state using `useConvexAuth()`.
  - Show activity indicator while loading.
  - Route to `/sign-in` when unauthenticated and `/home` when authenticated.

---

## Verification Plan

### Automated Tests

- `packages/backend/convex/auth.test.ts`:
  - Verify unauthenticated caller receives `null` from `currentUser`.
  - Verify `t.withIdentity({ ... })` receives full user profile.
  - Verify protected mutation throws `Unauthenticated` / returns authorization error without valid session.
- `packages/backend/convex/schema.test.ts`:
  - Run all schema validation tests against the updated `users` table and `authTables`.
- Run test suites:
  ```bash
  cd packages/backend && bun run test
  bun run check-types
  bun run lint
  ```

### Manual Verification

1. Launch Expo dev server: `bun run dev`.
2. Open on iOS/Android simulator or device.
3. Verify initial launch loads the `Sign In` screen when unauthenticated.
4. Tap "Create Account" -> Register with a new email and password.
5. Confirm successful registration redirects to `Home` tab.
6. Verify duplicate registration with the same email displays "Account already exists" inline error.
7. Verify invalid sign-in password displays inline error message and does not crash.
8. Restart app / reload Expo bundle -> Verify user session is restored from SecureStore without requiring re-login.
