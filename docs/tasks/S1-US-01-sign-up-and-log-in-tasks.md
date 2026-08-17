# S1-US-01 — Sign Up and Log In Task List

**Related plan:** [`docs/plans/S1-US-01-sign-up-and-log-in.md`](../plans/S1-US-01-sign-up-and-log-in.md)

## Task Summary

- **Sprint:** Sprint 1
- **Epic:** Epic E2 Identity
- **Story points:** 5
- **Owner:** M1
- **Objective:** Enable visitor account creation and login via Convex Auth Password provider with session persistence across mobile app restarts.

## Dependencies and Suggested Order

```text
T1 Backend Dependency & Schema Setup
 ├── T2 Configure Convex Auth & HTTP routes
 │    └── T3 Implement user identity helpers & protected query
 │         └── T4 Backend tests (authed vs unauthed mutations)
 └── T5 Mobile Dependency & ConvexAuthProvider Setup
      └── T6 Mobile Sign-Up & Sign-In UI with inline validation
           └── T7 Navigation auth-gating & session persistence verification
```

---

## Work Items

### T1 — Backend Dependency & Schema Setup

**Files:** `packages/backend/package.json`, `packages/backend/convex/schema.ts`, `packages/backend/convex/schema.test.ts`

- [x] Install `@convex-dev/auth` and `@auth/core` in `packages/backend`.
- [x] Import `authTables` in `packages/backend/convex/schema.ts` and spread `...authTables`.
- [x] Merge custom user fields (`displayName`, `avatarUrl`, `role`, `updatedAt`) onto `users`.
- [x] Remove `authSubject` field and `by_auth_subject` index.
- [x] Update `seedGraph` in `packages/backend/convex/schema.test.ts` to remove deprecated `authSubject` field.

**Done when:** Backend compiles, schema contains `authTables`, and `schema.test.ts` passes.

---

### T2 — Configure Convex Auth & HTTP Routes

**Files:** `packages/backend/convex/auth.config.ts`, `packages/backend/convex/auth.ts`, `packages/backend/convex/http.ts`

- [x] Create `convex/auth.config.ts` with empty provider array export.
- [x] Create `convex/auth.ts` configuring `@convex-dev/auth/providers/Password`.
- [x] Export `{ auth, signIn, signOut, store }` from `convexAuth()`.
- [x] Create `convex/http.ts` and attach auth HTTP routes via `auth.addHttpRoutes(http)`.

**Done when:** Convex Auth backend endpoints and HTTP router are exported and typed properly.

---

### T3 — Implement User Identity Helpers & Protected Query

**Files:** `packages/backend/convex/users.ts`

- [x] Export `getAuthUserId(ctx)` helper.
- [x] Implement `currentUser` query returning the authenticated user document.
- [x] Ensure helper throws or returns null safely when unauthenticated.

**Done when:** Protected queries and mutations can reliably resolve caller's user record.

---

### T4 — Backend Unit & Integration Tests (`convex-test`)

**Files:** `packages/backend/convex/auth.test.ts`

- [x] Add test for `currentUser` returning `null` when unauthenticated.
- [x] Add test for `currentUser` returning user record with `t.withIdentity()`.
- [x] Add test demonstrating a protected mutation rejecting unauthenticated requests.
- [x] Verify test suite passes with `bun run test`.

**Done when:** `convex-test` validates authenticated and unauthenticated scenarios.

---

### T5 — Mobile Dependency & ConvexAuthProvider Setup

**Files:** `apps/mobile/package.json`, `apps/mobile/components/providers/ConvexClientProvider.tsx`

- [x] Install `@convex-dev/auth` and `expo-secure-store` in `apps/mobile`.
- [x] Configure `expo-secure-store` storage adapter (`getItemAsync`, `setItemAsync`, `deleteItemAsync`).
- [x] Wrap React client with `ConvexAuthProvider` in `ConvexClientProvider.tsx`.

**Done when:** Mobile app mounts `ConvexAuthProvider` with secure storage without runtime crashes.

---

### T6 — Mobile Sign-Up & Sign-In UI with Inline Validation

**Files:** `apps/mobile/app/(auth)/_layout.tsx`, `apps/mobile/app/(auth)/sign-in.tsx`, `apps/mobile/app/(auth)/sign-up.tsx`

- [x] Create `(auth)` group stack layout.
- [x] Implement `sign-in.tsx` with email and password fields and error state.
- [x] Implement `sign-up.tsx` with email, password, confirm password, and error state.
- [x] Implement inline validation for email format and password strength/matching.
- [x] Handle duplicate email registration and invalid credentials with user-friendly inline messages.

**Done when:** Clean, responsive sign-in and sign-up forms handle user input and inline errors gracefully.

---

### T7 — Navigation Auth-Gating & Verification

**Files:** `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`

- [x] Add auth-state checking with `useConvexAuth()` in root layout and entry index.
- [x] Route unauthenticated users to `/sign-in` and authenticated users to `/home`.
- [x] Test session persistence across app reloads via SecureStore.
- [x] Run full project validation: `bun run check-types` and `bun run lint`.

**Done when:** Full registration, login, logout, and token persistence cycle works smoothly.
