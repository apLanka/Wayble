# S3-7 — Live activity feed of nearby verifications (US-23)

**Sprint:** 3 (S3-7) · **Related:** US-10 (`verifications.verifyReport`), US-11 (confidence), US-05 (nearby places)

---

## Problem

Verifications are only visible inside a single report card. Users have no sense of community activity
around them. US-23 asks for a feed of recent verifications near the user that updates live, without a
manual refresh, and is announced to screen-reader users.

## Non-goals

- Pagination / infinite scroll (capped feed, `limit` ≤ 50).
- Push notifications for feed items (US-21 covers notifications).
- Wiring an entry point into Home/Profile/Tabs — instruction for this task was not to modify existing
  files, so the screen is reachable at `/feed`; adding a row is a one-line follow-up.

## Reconciling the ticket with the codebase

| Ticket wording                                              | What the code actually has                                                     | Decision                                                                                                                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recentVerifications(placeId, limit)` in `verifications.ts` | `verifications.ts` exists (US-10); instruction is not to modify existing files | New file **`convex/verificationFeed.ts`** (precedent: S4-7 `moderation.ts`). Args: `placeId?`, `placeIds?`, `limit?` — `placeId` is the ticket's single-place form, `placeIds` is the region form. |
| "Scope feed to current map region (nearby IDs)"             | `places.nearest` returns nearby places with `_id`                              | Client calls `places.nearest` (same args as the map ⇒ shared subscription), passes the ids as `placeIds`.                                                                                          |
| "Verifier, attribute, timestamp, confidence"                | A verification points at a _report_ (many attributes); confidence is per place | Row shows the report's attributes (first + "+N more"), verdict, `updatedAt`, and the place's `computeConfidence` tier — same maths as `places.getPlace`.                                           |
| `verifications` has no time index                           | Only `by_report`, `by_author`, `by_report_and_author`                          | No schema change. Read is bounded by scope: place ids → active reports (`by_place`) → verifications (`by_report`), sort by `updatedAt` desc, take `limit`. No scope ⇒ `[]`.                        |

## Backend — `packages/backend/convex/verificationFeed.ts` (new)

`recentVerifications` (query): args `{ placeId?, placeIds?, limit? }`.

1. Scope = `placeId` ∪ `placeIds` (deduped, capped at 100). Empty ⇒ `[]`.
2. For each place: load it (skip if gone), its `active` reports, each report's verifications.
3. Per place compute confidence (`agreeCount/totalVotes/distinctVerifiers`, age of newest report) via
   `computeConfidence`.
4. Build items, sort by `updatedAt` desc, `slice(0, clamp(limit, 1..50))` (default 20).
5. Item: `{ _id, reportId, placeId, placeName, verifierId, verifierName, verdict, attributes[{key,value}], updatedAt, confidence{tier,isStale} }`.
   Verifier name uses the same fallback as `reports.listForPlace`; email is never returned.

Reactive by construction: Convex re-runs the query when any read document changes, so a new vote on
another device pushes a new result to every subscriber.

`_generated/api.d.ts` gets the one-line `verificationFeed` module entry (what `convex codegen` emits).

## Mobile

| File                                                   | Purpose                                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `components/feed/feed-announcements.ts` (+ `.test.ts`) | Pure: `feedItemKey`, `findNewItems`, `describeFeedItem`, `announcementFor`.                        |
| `hooks/use-verification-feed.ts`                       | Location → `places.nearest` → `recentVerifications` via `useQuery`; announces genuinely new items. |
| `components/feed/FeedItemRow.tsx`                      | Verifier, verdict + attribute, relative time, `ConfidenceBadge`. One accessible node.              |
| `components/feed/FeedScreen.tsx`                       | States: locating / no permission / loading / empty / list.                                         |
| `app/feed/index.tsx`                                   | Route `/feed`.                                                                                     |

### Announcement rules

- The first result after (re)subscribing seeds the "seen" set and is **not** announced.
- Afterwards, any item whose key (`<id>:<updatedAt>` — a changed vote counts as new activity) was not
  seen is announced via `AccessibilityInfo.announceForAccessibility`. Several at once collapse to one
  message ("3 new verifications nearby. Latest: …").
- Changing the scope (nearby place ids change materially) re-seeds, so moving does not spam.
- The user's own votes are not announced.

## Verification

- Backend vitest: `testing/verificationFeed.test.ts` (scope, ordering, limit, removed reports, confidence, privacy).
- Mobile vitest: `feed-announcements.test.ts`.
- Type-check + lint of new files.
- Manual two-device demo (below).

### Manual two-device demo

1. Phone A and B signed in as **different** users, both with location near seeded places; both open `/feed`.
2. Phone A: open a place → Reports → confirm someone else's report.
3. Phone B (no touch): row appears at top within ~1 s; screen reader (TalkBack/VoiceOver) speaks
   "New verification nearby: …".
4. Phone A: change vote to dispute → Phone B shows it as new activity again.
5. Phone A: vote on a place far from B → nothing appears on B.
