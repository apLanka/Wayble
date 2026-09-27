# Backend Unit Testing Walkthrough

Comprehensive unit testing has been implemented and verified across all Convex backend components, schemas, queries, mutations, actions, crons, and helper utilities.

---

## 1. Summary of Changes

### New Test Suites Created (under `convex/testing/`)

- [convex/testing/accessibility.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/accessibility.test.ts): Tests taxonomy version, format, categories, and uniqueness of all 19 accessibility attribute keys, along with attribute validators.
- [convex/testing/crons.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/crons.test.ts): Validates default export and structure of scheduled cron jobs (`verify-nearby-sweep` and `verify-nearby-retry-stalled`).
- [convex/testing/http.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/http.test.ts): Validates HTTP router initialization and auth route registration.

### Enhanced Test Suites (under `convex/testing/`)

- [convex/testing/places.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/places.test.ts):
  - **`getPlace`**: Tests aggregation of active reports with **last-write-wins** resolution per attribute key, exclusion of superseded/removed reports, `reportCount` accuracy, `lastReportedAt` computation, and non-existent place handling.
  - **`seedMockPlaces`**: Tests deduplication (skipping places already present), seeding new places with default `"other"` category, and authentication guards.
  - **`create` / `update` / `remove`**: Tests authentication checks, place not found errors, geospatial index synchronization on coordinate or category update, and graceful handling of corrupted/stale index entries.
- [convex/testing/users.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/users.test.ts):
  - **`currentUser`**: Tests unauthenticated (`null`) vs authenticated user profile resolution.
  - **`roundCoordinate`**: Tests 3-decimal rounding precision (~110m) on positive and negative coordinates.
  - **`updateProfile`**: Tests updating `avatarUrl`, `displayName`, and `accessibilityNeeds`, asserting error on duplicate needs.
  - **`updateNotificationPrefs`**: Tests radius boundary limits (minimum $250\text{m}$, maximum $20{,}000\text{m}$, error on out-of-bounds), default $2{,}000\text{m}$ auto-assignment, and toggle state persistence.
- [convex/testing/notifications.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/notifications.test.ts):
  - **`getDeliveryContext`**: Tests missing log ID resolution (`null`), fallback place name (`"A nearby place"`), and filtering out disabled push tokens.
  - **`recordResult`**: Tests status updates to `"sent"` (with timestamp) or `"failed"` (with `errorCode`), and disabling dead tokens via `disableTokenIds`.
- [convex/testing/notificationPolicy.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/notificationPolicy.test.ts)
- [convex/testing/notificationCopy.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/notificationCopy.test.ts)
- [convex/testing/verificationNeed.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/verificationNeed.test.ts)
- [convex/testing/pushTokens.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/pushTokens.test.ts)
- [convex/testing/schema.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/schema.test.ts)
- [convex/testing/sweep.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/sweep.test.ts)
- [convex/testing/auth.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/auth.test.ts)
- [convex/testing/health.test.ts](file:///c:/Users/aaththika_i/Documents/Wayble/packages/backend/convex/testing/health.test.ts)

---

## 2. Test Execution & Verification

### Test Results

Command executed:

```bash
npx vitest run
```

Output:

```text
 ✓ convex/testing/notificationPolicy.test.ts (9 tests)
 ✓ convex/testing/verificationNeed.test.ts (9 tests)
 ✓ convex/testing/notificationCopy.test.ts (7 tests)
 ✓ convex/testing/accessibility.test.ts (5 tests)
 ✓ convex/testing/schema.test.ts (9 tests)
 ✓ convex/testing/notifications.test.ts (12 tests)
 ✓ convex/testing/pushTokens.test.ts (9 tests)
 ✓ convex/testing/auth.test.ts (4 tests)
 ✓ convex/testing/users.test.ts (20 tests)
 ✓ convex/testing/crons.test.ts (2 tests)
 ✓ convex/testing/sweep.test.ts (15 tests)
 ✓ convex/testing/health.test.ts (2 tests)
 ✓ convex/testing/places.test.ts (11 tests)
 ✓ convex/testing/http.test.ts (2 tests)

 Test Files  14 passed (14)
      Tests  116 passed (116)
   Duration  4.60s
```

### Type Checking Results

Command executed:

```bash
npm run check-types
```

Result: 0 errors. All TypeScript types and schemas align.

---

## 3. Testing Commands & Usage Guide

### A. Run All Backend Unit Tests (Single Run)

```bash
# Inside packages/backend
npm test -- --run

# Or directly with vitest
npx vitest run

# On Windows PowerShell (if script execution policy blocks ps1)
npm.cmd test -- --run
# Or: npx.cmd vitest run
```

### B. Run Tests in Interactive / Watch Mode

Automatically re-runs tests whenever changes are detected:

```bash
# Inside packages/backend
npm test

# Or directly with vitest
npx vitest
```

### C. Run Specific Test Files

```bash
# Inside packages/backend

# Test places component & aggregations
npx vitest run convex/testing/places.test.ts

# Test users & preferences
npx vitest run convex/testing/users.test.ts

# Test notifications & scheduled sweep
npx vitest run convex/testing/notifications.test.ts
npx vitest run convex/testing/sweep.test.ts

# Test accessibility taxonomy
npx vitest run convex/testing/accessibility.test.ts

# Test push token registration
npx vitest run convex/testing/pushTokens.test.ts

# Test auth & identity
npx vitest run convex/testing/auth.test.ts

# Test schema validators & DB indexes
npx vitest run convex/testing/schema.test.ts
```

### D. Run TypeScript Type Checking

Verify all schema types, query/mutation signatures, and validators without emitting files:

```bash
# Inside packages/backend
npm run check-types
```

### E. Run All Workspace Tests from Root

```bash
# From workspace root
npm test
```
