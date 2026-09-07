# S3-7 Tasks: Live Activity Feed of Nearby Verifications (US-23)

## 1. Backend — Convex

- [x] `packages/backend/convex/verifications.ts` — Create `recentVerifications` query (with placeId/placeIds/limit) and `submitVerification`/`submitPlaceVerification` mutations
- [x] `packages/backend/convex/testing/verifications.test.ts` — Comprehensive unit tests for `recentVerifications` filtering and submission

## 2. Frontend — Hooks & Accessibility

- [x] `apps/mobile/hooks/use-live-activity-feed.ts` — Reactive Convex subscription with `AccessibilityInfo.announceForAccessibility` for real-time announcements

## 3. Frontend — Feed Components

- [x] `apps/mobile/components/feed/ConfidenceBadge.tsx` — Confidence pill badge component
- [x] `apps/mobile/components/feed/FeedCard.tsx` — Verification card component with verifier, attribute, verdict, timestamp, and confidence badge
- [x] `apps/mobile/components/feed/SubmitVerificationModal.tsx` — Interactive verification submit modal for instant two-device demo testing

## 4. Frontend — Screen & Navigation

- [x] `apps/mobile/app/feed.tsx` — `FeedScreen` with live status indicator, region scoping, and real-time updates
- [x] `apps/mobile/app/_layout.tsx` — Register `feed` stack route
- [x] `apps/mobile/app/(tabs)/home/index.tsx` — Link to live activity feed from Home

## 5. Verification & Testing

- [x] Backend test execution via `vitest run verifications.test.ts` (124/124 passed)
- [x] Full workspace type check (`bun run check-types` clean ✓)
- [x] Manual two-device demo test protocol validation
