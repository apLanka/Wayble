# Backend Unit Testing Plan & Task Document

Comprehensive plan and task breakdown for implementing full unit testing coverage across all backend modules and Convex components in `packages/backend`.

---

## 1. Overview & Objectives

The backend uses **Convex** with `@convex-dev/auth`, `@convex-dev/geospatial`, and `convex-test` integrated with **Vitest** in an `edge-runtime` environment.

### Primary Objectives:
- Achieve 100% component-level unit test coverage across all Convex backend modules.
- Test all authentication guards (logged-in vs anonymous vs unauthenticated access).
- Test all domain logic, validation constraints, calculations, and data mutations.
- Test edge cases, boundary conditions, error handling, and database indexing/aggregation semantics.
- Provide clear test isolation, idempotent seed helpers, and deterministic execution.

---

## 2. Component Inventory & Coverage Analysis

| Component / Module | Implementation File | Existing Test File | Status & Gaps |
|---|---|---|---|
| **Taxonomy & Vocabulary** | `convex/accessibility.ts` | *None* (Missing) | ❌ Needs new test suite for taxonomy versions, key lists, schema validators |
| **Places Management** | `convex/places.ts` | `convex/places.test.ts` | ⚠️ Missing tests for `getPlace` aggregation (last-write-wins), `seedMockPlaces`, auth checks, invalid IDs, and updates |
| **Users & Preferences** | `convex/users.ts` | `convex/users.test.ts` | ⚠️ Missing tests for `currentUser`, `roundCoordinate` precision edge cases, radius boundary limits (250m - 20km), avatar updates |
| **Push Tokens** | `convex/pushTokens.ts` | `convex/pushTokens.test.ts` | ⚠️ Expand test suite for platform validation, device names, error cases |
| **Notification Engine** | `convex/notifications.ts` | `convex/notifications.test.ts` & `convex/sweep.test.ts` | ⚠️ Missing unit tests for `getDeliveryContext`, `recordResult` failure paths, and batch limits |
| **Notification Policy** | `convex/notificationPolicy.ts` | `convex/notificationPolicy.test.ts` | ✅ Comprehensive (verify edge cases like DST & extreme offsets) |
| **Notification Copy** | `convex/notificationCopy.ts` | `convex/notificationCopy.test.ts` | ✅ Comprehensive (verify 0-day, single/multi-month boundary tests) |
| **Verification Needs** | `convex/verificationNeed.ts` | `convex/verificationNeed.test.ts` | ✅ Comprehensive |
| **Database Schema** | `convex/schema.ts` | `convex/schema.test.ts` | ✅ Comprehensive (table schemas, custom validators, index behaviors) |
| **Health Check** | `convex/health.ts` | `convex/health.test.ts` | ✅ Covers ping and touch |
| **Authentication Setup** | `convex/auth.ts`, `convex/auth.config.ts` | `convex/auth.test.ts` | ⚠️ Expand session handling and provider config tests |
| **Crons & Scheduled Jobs** | `convex/crons.ts` | *None* (Missing) | ❌ Needs new test suite validating cron schedules and target handlers |
| **HTTP Routing** | `convex/http.ts` | *None* (Missing) | ❌ Needs new test suite validating HTTP router initialization |

---

## 3. Detailed Proposed Test Plans by Component

### Phase 1: Accessibility Taxonomy (`convex/accessibility.test.ts`) [NEW]
- [ ] Test taxonomy version constant equals 1.
- [ ] Test all 19 defined attribute keys in `ACCESSIBILITY_ATTRIBUTE_KEYS` for format (`category.action`), non-emptiness, and uniqueness.
- [ ] Test validator acceptance of valid values (`yes`, `no`, `partial`, `unknown`, `not_applicable`).
- [ ] Test validator rejection of invalid values (e.g. `maybe`, `true`, numbers).
- [ ] Test optional `note` field in `accessibilityAttributeValidator`.

### Phase 2: Places API & Aggregations (`convex/places.test.ts`) [ENHANCE]
- [ ] **`getPlace` Query**:
  - Return `null` when place does not exist.
  - Return place with empty attributes array when no reports exist (`reportCount: 0`, `lastReportedAt: null`).
  - Correctly aggregate active reports using **last-write-wins** per attribute key (most recent `observedAt` wins).
  - Exclude `superseded` and `removed` reports from aggregated attributes and counts.
  - Calculate `lastReportedAt` timestamp matching the newest active report.
- [ ] **`create` Mutation**:
  - Rejection with error when caller is unauthenticated.
  - Insertion into `places` table and sync with `geospatial` index.
- [ ] **`seedMockPlaces` Mutation**:
  - Rejection when unauthenticated.
  - Successfully seed new mock places with default `"other"` category.
  - Skip existing places when matching names are already present (deduplication).
- [ ] **`update` Mutation**:
  - Rejection with `"Place not found"` when given invalid ID.
  - Update `name`, `address`, `category`, and `location`.
  - Trigger `geo.insert` when `location` or `category` changes; skip geo update when neither changed.
- [ ] **`remove` Mutation**:
  - Delete from `places` table and remove key from `geospatial` index.
- [ ] **`nearest` Query**:
  - Gracefully handle stale or corrupted index entries where the DB record no longer exists.

### Phase 3: Users & Preferences (`convex/users.test.ts`) [ENHANCE]
- [ ] **`currentUser` Query**:
  - Return `null` for unauthenticated requests.
  - Return the authenticated user's record with all fields when logged in.
- [ ] **`roundCoordinate` Utility**:
  - Verify rounding to 3 decimal places (approx. 110m resolution) for positive, negative, and fractional inputs.
- [ ] **`updateProfile` Mutation**:
  - Update `avatarUrl` and `displayName` independently or together.
  - Reject duplicate accessibility need keys.
  - Clear needs when passed empty array `[]`.
- [ ] **`updateNotificationPrefs` Mutation**:
  - Validate minimum radius boundary (`250m` allowed, `< 250m` throws error).
  - Validate maximum radius boundary (`20000m` allowed, `> 20000m` throws error).
  - Default radius to `2000m` on initial opt-in if no radius previously set.
  - Preserve custom radius when disabling and re-enabling notifications.
- [ ] **`updateLastKnownLocation` Mutation**:
  - Coarsify latitude/longitude before persisting.
  - Update `timeZoneOffsetMinutes` and `updatedAt` timestamps.

### Phase 4: Internal Notifications & Delivery (`convex/notifications.test.ts`) [ENHANCE]
- [ ] **`getDeliveryContext` Internal Query**:
  - Return `null` when `logId` does not exist.
  - Fall back to `"A nearby place"` if associated place is deleted.
  - Exclude disabled push tokens (`disabledAt !== undefined`).
- [ ] **`recordResult` Internal Mutation**:
  - Update log status to `"sent"` and set `sentAt` timestamp.
  - Update log status to `"failed"` and set `errorCode`.
  - Set `disabledAt` on tokens specified in `disableTokenIds`.
- [ ] **`sweep` Internal Mutation**:
  - Skip users with `lastKnownLocation` older than 7 days (`LOCATION_MAX_AGE_MS`).
  - Skip users missing `lastKnownLocation`.
  - Respect batch limit argument (`limit`).
- [ ] **`retryStalledDeliveries` Internal Mutation**:
  - Reschedule pending claims older than 10 minutes (`STALLED_AFTER_MS`).
  - Mark claims older than 24 hours as failed with `errorCode: "DeliveryStalled"`.

### Phase 5: Crons & HTTP Configuration (`convex/crons.test.ts` & `convex/http.test.ts`) [NEW]
- [ ] **Crons**:
  - Verify `verify-nearby-sweep` is registered on hourly schedule.
  - Verify `verify-nearby-retry-stalled` is registered at 10-minute intervals.
- [ ] **HTTP Router**:
  - Verify `httpRouter` exports correctly and registers auth endpoints.

---

## 4. Verification & Testing Commands

Automated testing execution via Vitest:
```bash
# Run all backend unit tests in one shot
npx vitest run

# Run with test coverage reporting
npx vitest run --coverage
```

## 5. Implementation Phasing & Task Checklist

1. [ ] **Phase 1**: Add unit tests for accessibility taxonomy (`convex/accessibility.test.ts`).
2. [ ] **Phase 2**: Expand `places.test.ts` to test `getPlace` aggregation, report sorting/filtering, `seedMockPlaces`, update syncing, and authentication.
3. [ ] **Phase 3**: Expand `users.test.ts` to test `currentUser`, radius boundaries (250m - 20,000m), coordinate rounding precision, and avatar updates.
4. [ ] **Phase 4**: Expand `notifications.test.ts` and `sweep.test.ts` for delivery context, result recording, location age filtering, and stalled retries.
5. [ ] **Phase 5**: Add `crons.test.ts` and `http.test.ts` for infrastructure coverage.
6. [ ] **Phase 6**: Execute full test suite and verify all test suites pass with 100% success.
