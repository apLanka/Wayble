# S3-7 Tasks — Live activity feed of nearby verifications

Plan: [docs/plans/S3-7-live-activity-feed.md](../plans/S3-7-live-activity-feed.md)

## Backend

- [x] `convex/verificationFeed.ts` — `recentVerifications(placeId?, placeIds?, limit?)` query
- [x] `convex/_generated/api.d.ts` — register `verificationFeed` module
- [x] `convex/testing/verificationFeed.test.ts`

## Mobile

- [x] `components/feed/feed-announcements.ts` (+ `.test.ts`)
- [x] `hooks/use-verification-feed.ts` — `useQuery` live subscription, scoped to nearby place ids
- [x] `components/feed/FeedItemRow.tsx` — verifier, attribute, timestamp, confidence badge
- [x] `components/feed/FeedScreen.tsx`
- [x] `app/feed/index.tsx` — route
- [x] Announce new items with `AccessibilityInfo.announceForAccessibility`

## Verification

- [x] Backend tests pass
- [x] Mobile unit tests pass
- [x] Type-check backend and mobile (no new errors)
- [x] Lint new files
- [ ] Manual two-device demo (see plan) — **needs two physical devices; run by the team**
