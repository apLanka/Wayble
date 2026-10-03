# Sprint 3 & Sprint 4 Tasks and Subtasks Breakdown

**Project:** Wayble (SE3080 / SE3050)  
**Member:** Pasindu Lanka (`it23714298@my.sliit.lk`)  
**ClickUp Workspace:** SE3080 - Wayble Project

---

## 📌 Executive Summary for Pasindu Lanka

| Sprint       | Task ID      | Story / Task Name                                                                                 | Priority  | Due Date        | Est. Time | Status |
| :----------- | :----------- | :------------------------------------------------------------------------------------------------ | :-------- | :-------------- | :-------- | :----- |
| **Sprint 3** | `z8v0kmrg21` | [S3-1: Submit an accessibility report (US-08)](https://app.clickup.com/t/z8v0kmrg21)              | 🔴 Urgent | **18 Sep 2026** | **5h**    | To Do  |
| **Sprint 3** | `z8v0kmrg23` | [S3-3: Confirm or dispute an existing report (US-10)](https://app.clickup.com/t/z8v0kmrg23)       | 🔴 Urgent | **18 Sep 2026** | **5h**    | To Do  |
| **Sprint 4** | `z8v0kmrg2d` | [S4-5: strings.ts localisation module (EDI claim evidence)](https://app.clickup.com/t/z8v0kmrg2d) | 🔵 Normal | **02 Oct 2026** | **2h**    | To Do  |
| **Sprint 4** | `z8v0kmrg2e` | [S4-6: Traceability matrix & SE3050 report documentation](https://app.clickup.com/t/z8v0kmrg2e)   | 🔵 Normal | **02 Oct 2026** | **3h**    | To Do  |
| **Total**    |              | **4 Parent Tasks (22 Subtasks)**                                                                  |           |                 | **15h**   |        |

---

## 🚀 Pasindu Lanka — Detailed Tasks & Subtasks

### 1. [S3-1: Submit an accessibility report (US-08)](https://app.clickup.com/t/z8v0kmrg21)

- **Sprint:** Sprint 3 (7/9 - 18/9)
- **Start Date:** 07 Sep 2026 | **Due Date:** 18 Sep 2026 (23:50)
- **Priority:** 🔴 Urgent | **Estimated Time:** 5 Hours (18,000,000 ms)
- **Tags:** `e4`, `backend`, `us-08`
- **Subtasks (6):**
  1. [Create submitReport mutation with getAuthUserId(ctx) auth check](https://app.clickup.com/t/z8v0kmrg2m) (`z8v0kmrg2m`)
  2. [Validate inputs: placeId, attributes[], notes (length-capped), timestamp](https://app.clickup.com/t/z8v0kmrg2x) (`z8v0kmrg2x`)
  3. [Add duplicate guard: reject same userId + placeId within 24h](https://app.clickup.com/t/z8v0kmrg36) (`z8v0kmrg36`)
  4. [Build multi-step ReportForm UI: Step 1 Category > Step 2 Attributes > Step 3 Notes > Step 4 Confirm](https://app.clickup.com/t/z8v0kmrg3f) (`z8v0kmrg3f`)
  5. [Implement optimistic update via useMutation().withOptimisticUpdate with rollback on error](https://app.clickup.com/t/z8v0kmrj4b) (`z8v0kmrj4b`)
  6. [Write convex-test: successful submission, duplicate rejection, unauthenticated rejection](https://app.clickup.com/t/z8v0kmrj4h) (`z8v0kmrj4h`)

---

### 2. [S3-3: Confirm or dispute an existing report (US-10)](https://app.clickup.com/t/z8v0kmrg23)

- **Sprint:** Sprint 3 (7/9 - 18/9)
- **Start Date:** 07 Sep 2026 | **Due Date:** 18 Sep 2026 (23:50)
- **Priority:** 🔴 Urgent | **Estimated Time:** 5 Hours (18,000,000 ms)
- **Tags:** `e5`, `backend`, `us-10`
- **Subtasks (6):**
  1. [Create verifyReport mutation with getAuthUserId(ctx) auth check](https://app.clickup.com/t/z8v0kmrg2p) (`z8v0kmrg2p`)
  2. [Enforce by_report_and_user index: one vote per user, changeable](https://app.clickup.com/t/z8v0kmrg30) (`z8v0kmrg30`)
  3. [Reject self-verification of own report server-side (return error, never silent)](https://app.clickup.com/t/z8v0kmrg38) (`z8v0kmrg38`)
  4. [Build VerifyControl UI component: Agree/Dispute buttons + current vote state](https://app.clickup.com/t/z8v0kmrg3h) (`z8v0kmrg3h`)
  5. [Write convex-test: self-verification rejection, vote change, duplicate vote update](https://app.clickup.com/t/z8v0kmrj4d) (`z8v0kmrj4d`)
  6. [Manual two-device demo test: submit verification on one phone, confirm it appears on the other with no refresh](https://app.clickup.com/t/z8v0kmrj4p) (`z8v0kmrj4p`)

---

### 3. [S4-5: strings.ts localisation module (EDI claim evidence)](https://app.clickup.com/t/z8v0kmrg2d)

- **Sprint:** Sprint 4 (21/9 - 2/10)
- **Start Date:** 21 Sep 2026 | **Due Date:** 02 Oct 2026 (23:50)
- **Priority:** 🔵 Normal | **Estimated Time:** 2 Hours (7,200,000 ms)
- **Tags:** `e8`, `i18n`, `edi`
- **Subtasks (4):**
  1. [Create constants/strings.ts — export all user-facing string constants](https://app.clickup.com/t/z8v0kmrj4x) (`z8v0kmrj4x`)
  2. [Refactor all screen files to import strings from constants/strings.ts (no inline string literals)](https://app.clickup.com/t/z8v0kmrj55) (`z8v0kmrj55`)
  3. [Document in EDI checklist: 'Sinhala/Tamil localisation deferred to US-22 — all strings are extractable'](https://app.clickup.com/t/z8v0kmrj5d) (`z8v0kmrj5d`)
  4. [Confirm no text content is baked into images or assets (supports future localisation claim)](https://app.clickup.com/t/z8v0kmrj5q) (`z8v0kmrj5q`)

---

### 4. [S4-6: Traceability matrix & SE3050 report documentation](https://app.clickup.com/t/z8v0kmrg2e)

- **Sprint:** Sprint 4 (21/9 - 2/10)
- **Start Date:** 21 Sep 2026 | **Due Date:** 02 Oct 2026 (23:50)
- **Priority:** 🔵 Normal | **Estimated Time:** 3 Hours (10,800,000 ms)
- **Tags:** `docs`, `se3080`
- **Subtasks (4):**
  1. [Complete traceability matrix: Story > Feature > Convex function > Screen > Test > Owner for all Sprint 3 stories (US-08, 09, 10, 11, 13, 16, 23)](https://app.clickup.com/t/z8v0kmrj4y) (`z8v0kmrj4y`)
  2. [Update ADR-001 and ADR-002 if any architectural decisions were revisited in Sprint 3](https://app.clickup.com/t/z8v0kmrj56) (`z8v0kmrj56`)
  3. [Write SE3080 Assignment 2 sprint retrospective for Sprint 3 (what went well, to improve, action items)](https://app.clickup.com/t/z8v0kmrj5e) (`z8v0kmrj5e`)
  4. [Compile Sprint 3 burndown actuals from ClickUp card close dates](https://app.clickup.com/t/z8v0kmrj5r) (`z8v0kmrj5r`)

---

## 🗓️ Sprint 3 (07/09/2026 – 18/09/2026) — Complete Task List

### [S3-1: Submit an accessibility report (US-08)](https://app.clickup.com/t/z8v0kmrg21)

- **Assignee:** Pasindu Lanka | **Due Date:** 18 Sep 2026 | **Est. Time:** 5h | **Priority:** 🔴 Urgent
- **Subtasks:**
  - `z8v0kmrg2m`: Create submitReport mutation with getAuthUserId(ctx) auth check
  - `z8v0kmrg2x`: Validate inputs: placeId, attributes[], notes (length-capped), timestamp
  - `z8v0kmrg36`: Add duplicate guard: reject same userId + placeId within 24h
  - `z8v0kmrg3f`: Build multi-step ReportForm UI: Step 1 Category > Step 2 Attributes > Step 3 Notes > Step 4 Confirm
  - `z8v0kmrj4b`: Implement optimistic update via useMutation().withOptimisticUpdate with rollback on error
  - `z8v0kmrj4h`: Write convex-test: successful submission, duplicate rejection, unauthenticated rejection

### [S3-2: Attach a photo as evidence (US-09)](https://app.clickup.com/t/z8v0kmrg22)

- **Assignee:** Pasindu Janith | **Due Date:** 18 Sep 2026 | **Est. Time:** 3h | **Priority:** 🟡 High
- **Subtasks:**
  - `z8v0kmrg2n`: Integrate expo-image-picker (capture + library select) with compression
  - `z8v0kmrg2z`: Call generateUploadUrl, upload file, store storageId on the report
  - `z8v0kmrg37`: Display thumbnail via ctx.storage.getUrl() with required accessibilityLabel (alt text)
  - `z8v0kmrg3g`: Add size (max 5 MB) and MIME-type validation before upload
  - `z8v0kmrj4c`: Make photo optional — form completes without it
  - `z8v0kmrj4j`: Test upload flow on iOS simulator and Android emulator

### [S3-3: Confirm or dispute an existing report (US-10)](https://app.clickup.com/t/z8v0kmrg23)

- **Assignee:** Pasindu Lanka | **Due Date:** 18 Sep 2026 | **Est. Time:** 5h | **Priority:** 🔴 Urgent
- **Subtasks:**
  - `z8v0kmrg2p`: Create verifyReport mutation with getAuthUserId(ctx) auth check
  - `z8v0kmrg30`: Enforce by_report_and_user index: one vote per user, changeable
  - `z8v0kmrg38`: Reject self-verification of own report server-side (return error, never silent)
  - `z8v0kmrg3h`: Build VerifyControl UI component: Agree/Dispute buttons + current vote state
  - `z8v0kmrj4d`: Write convex-test: self-verification rejection, vote change, duplicate vote update
  - `z8v0kmrj4p`: Manual two-device demo test: submit verification on one phone, confirm it appears on the other with no refresh

### [S3-4: Confidence level & last-verified date (US-11)](https://app.clickup.com/t/z8v0kmrg24)

- **Assignee:** Nishara Senadheera | **Due Date:** 18 Sep 2026 | **Est. Time:** 5h | **Priority:** 🔴 Urgent
- **Subtasks:**
  - `z8v0kmrg2q`: Create convex/confidence.ts — pure function, no I/O
  - `z8v0kmrg31`: Implement formula: (agreeCount / totalVotes) x distinctVerifiers x ageDecay
  - `z8v0kmrg39`: Age decay: 1.0 if <30 days, 0.8 if 30-90 days, 0.5 if >90 days
  - `z8v0kmrg3j`: Return badge Unverified/Low/Medium/High using colour AND text (never colour-only)
  - `z8v0kmrj4e`: Add stale warning string if last verification > 180 days ago
  - `z8v0kmrj4k`: Build ConfidenceBadge component, display in place detail screen
  - `z8v0kmrj4r`: Write unit tests over the scoring function covering all badge thresholds (Unverified/Low/Medium/High)

### [S3-5: Rank results by access-needs match (US-16)](https://app.clickup.com/t/z8v0kmrg25)

- **Assignee:** Pasindu Janith | **Due Date:** 18 Sep 2026 | **Est. Time:** 5h | **Priority:** 🔵 Normal
- **Subtasks:**
  - `z8v0kmrg2t`: Create matchScore(placeAttributes, userNeeds) pure function
  - `z8v0kmrg32`: Sort nearby results by match score descending, distance as tiebreak
  - `z8v0kmrg3a`: Show 'why this ranked here' explanation chip on each result row
  - `z8v0kmrg3k`: Wire to 'Matches my profile' quick filter in search/filter sheet (from US-02 profile)
  - `z8v0kmrj4f`: Write unit tests over the match scorer for all access-need combinations

### [S3-6: Flag an inaccurate or abusive entry (US-13)](https://app.clickup.com/t/z8v0kmrg26)

- **Assignee:** Nishara Senadheera | **Due Date:** 18 Sep 2026 | **Est. Time:** 2h | **Priority:** 🔵 Normal
- **Subtasks:**
  - `z8v0kmrg2u`: Create flagReport mutation in convex/flags.ts with auth check
  - `z8v0kmrg33`: Reason as union validator: Inaccurate | Spam | Abusive | Other (never free text)
  - `z8v0kmrg3b`: Prevent duplicate flags from the same user on the same report
  - `z8v0kmrg3m`: Flagging never hard-deletes — sets flagged: true on the report record only
  - `z8v0kmrj4g`: Build FlagAction UI: overflow menu on report card > options sheet > confirmation dialog
  - `z8v0kmrj4m`: Write convex-test: flag submission, duplicate prevention, unauthenticated rejection

### [S3-7: Live activity feed of nearby verifications (US-23)](https://app.clickup.com/t/z8v0kmrg27)

- **Assignee:** Aathika Ilmudeen | **Due Date:** 18 Sep 2026 | **Est. Time:** 3h | **Priority:** 🔴 Urgent
- **Subtasks:**
  - `z8v0kmrg2v`: Create recentVerifications(placeId, limit) query in convex/verifications.ts
  - `z8v0kmrg34`: Subscribe via useQuery — live updates with no manual refresh
  - `z8v0kmrg3c`: Scope feed to current map region (filter by nearby place IDs)
  - `z8v0kmrj49`: Announce new feed items with AccessibilityInfo.announceForAccessibility
  - `z8v0kmrj4n`: Build FeedScreen: shows verifier, attribute, timestamp, and confidence badge

### [S3-8: Sprint 3 regression testing & CI green](https://app.clickup.com/t/z8v0kmrg28)

- **Assignee:** Aathika Ilmudeen | **Due Date:** 18 Sep 2026 | **Est. Time:** 3h | **Priority:** 🟡 High
- **Subtasks:**
  - `z8v0kmrg2w`: Run tsc --noEmit — resolve all type errors
  - `z8v0kmrg35`: Run convex-test full suite — all tests green
  - `z8v0kmrg3d`: Manual E2E test: sign up > submit report > attach photo > verify > see confidence update > see live feed update
  - `z8v0kmrj4a`: Test auth gates on submit, verify, and flag on both iOS and Android simulators
  - `z8v0kmrj4q`: Update ClickUp board: close Sprint 3 list, move any carry-overs to Sprint 4 backlog

---

## 🗓️ Sprint 4 (21/09/2026 – 02/10/2026) — Complete Task List

### [S4-1: User testing round 1 — hi-fi prototype (SE3050 M4)](https://app.clickup.com/t/z8v0kmrg29)

- **Assignee:** Nishara Senadheera | **Due Date:** 02 Oct 2026 | **Est. Time:** 5h | **Priority:** 🔴 Urgent
- **Subtasks:**
  - `z8v0kmrj4t`: Recruit 5-6 participants including >=1 screen-reader user and >=1 mobility-aid user
  - `z8v0kmrj51`: Prepare moderated task scripts: T1 Find a nearby accessible WC, T2 Check if place has a ramp, T3 Submit a report
  - `z8v0kmrj59`: Run moderated think-aloud sessions, collect SUS scores and task completion times
  - `z8v0kmrj5j`: Log prioritised pain points and feed directly into any remaining implementation fixes
  - `z8v0kmrj5w`: Write Round 1 summary with before/after pain points table ready for SE3050 report

### [S4-2: User testing round 2 — on-device app (SE3050 M4)](https://app.clickup.com/t/z8v0kmrg2a)

- **Assignee:** Pasindu Janith | **Due Date:** 02 Oct 2026 | **Est. Time:** 5h | **Priority:** 🔴 Urgent
- **Subtasks:**
  - `z8v0kmrj4u`: Run T1-T3 tasks on the built app + T4 Confirm someone else's report + T5 Read the live feed
  - `z8v0kmrj52`: Record on-device task timing and compare results against Round 1 baseline
  - `z8v0kmrj5a`: Note any regressions or new issues introduced in Sprint 3
  - `z8v0kmrj5k`: Write Round 2 summary and compile before/after comparison table for SE3050 report

### [S4-3: Full WCAG 2.1 AA accessibility audit + fixes](https://app.clickup.com/t/z8v0kmrg2b)

- **Assignee:** Pasindu Janith | **Due Date:** 02 Oct 2026 | **Est. Time:** 3h | **Priority:** 🟡 High
- **Subtasks:**
  - `z8v0kmrj4v`: Run contrast audit on all Sprint 3 screens: text >=4.5:1, large text >=3:1 (WCAG 1.4.3)
  - `z8v0kmrj53`: Verify 200% font scale on all new Sprint 3 screens — no clipping (WCAG 1.4.4)
  - `z8v0kmrj5b`: Confirm all touch targets >= 44x44 dp on all new Sprint 3 screens (WCAG 2.5.8)
  - `z8v0kmrj5m`: Confirm accessibilityLabel, accessibilityRole, and accessibilityHint on all interactive elements in Sprint 3 screens
  - `z8v0kmrj5x`: Confirm no drag-only or long-press-only actions — everything reachable by single tap

### [S4-4: Branding — logo, tagline, A3 poster, 2x promo videos](https://app.clickup.com/t/z8v0kmrg2c)

- **Assignee:** Nishara Senadheera | **Due Date:** 02 Oct 2026 | **Est. Time:** 5h | **Priority:** 🟡 High
- **Subtasks:**
  - `z8v0kmrj4w`: Finalise tagline (e.g. 'Know before you go') and clear with team
  - `z8v0kmrj54`: Design Wayble logo — check name is clear of any existing trademark or app
  - `z8v0kmrj5c`: Create A3 promotional poster in Figma — export as PDF/PNG
  - `z8v0kmrj5p`: Record 2x promo MP4 videos (1-2 min each): one for end-users, one for stakeholders

### [S4-5: strings.ts localisation module (EDI claim evidence)](https://app.clickup.com/t/z8v0kmrg2d)

- **Assignee:** Pasindu Lanka | **Due Date:** 02 Oct 2026 | **Est. Time:** 2h | **Priority:** 🔵 Normal
- **Subtasks:**
  - `z8v0kmrj4x`: Create constants/strings.ts — export all user-facing string constants
  - `z8v0kmrj55`: Refactor all screen files to import strings from constants/strings.ts (no inline string literals)
  - `z8v0kmrj5d`: Document in EDI checklist: 'Sinhala/Tamil localisation deferred to US-22 — all strings are extractable'
  - `z8v0kmrj5q`: Confirm no text content is baked into images or assets (supports future localisation claim)

### [S4-6: Traceability matrix & SE3050 report documentation](https://app.clickup.com/t/z8v0kmrg2e)

- **Assignee:** Pasindu Lanka | **Due Date:** 02 Oct 2026 | **Est. Time:** 3h | **Priority:** 🔵 Normal
- **Subtasks:**
  - `z8v0kmrj4y`: Complete traceability matrix: Story > Feature > Convex function > Screen > Test > Owner for all Sprint 3 stories (US-08, 09, 10, 11, 13, 16, 23)
  - `z8v0kmrj56`: Update ADR-001 and ADR-002 if any architectural decisions were revisited in Sprint 3
  - `z8v0kmrj5e`: Write SE3080 Assignment 2 sprint retrospective for Sprint 3 (what went well, to improve, action items)
  - `z8v0kmrj5r`: Compile Sprint 3 burndown actuals from ClickUp card close dates

### [S4-7: Moderator queue screen — review & dismiss flagged reports (US-14 lite)](https://app.clickup.com/t/z8v0kmrg2f)

- **Assignee:** Aathika Ilmudeen | **Due Date:** 02 Oct 2026 | **Est. Time:** 5h | **Priority:** 🟡 High
- **Subtasks:**
  - `z8v0kmrj4z`: Add role field to users table schema: 'user' | 'moderator' with default 'user'
  - `z8v0kmrj57`: Create getFlaggedReports query in convex/flags.ts — gated to role === 'moderator' via getAuthUserId(ctx)
  - `z8v0kmrj5f`: Create dismissFlag mutation — sets flagged: false on the report, requires moderator role
  - `z8v0kmrj5t`: Build ModeratorQueueScreen — flat list showing: place name, report summary, flag reason, flag count

### [S4-8: E2E integration test suite for 5 critical user flows](https://app.clickup.com/t/z8v0kmrg2g)

- **Assignee:** Aathika Ilmudeen | **Due Date:** 02 Oct 2026 | **Est. Time:** 5h | **Priority:** 🟡 High
- **Subtasks:**
  - `z8v0kmrj50`: Flow 1 — Auth: sign up > log in > session survives app restart > unauthenticated mutation rejected
  - `z8v0kmrj58`: Flow 2 — Discovery: nearbyPlaces returns results > map markers render > list view shows same data
  - `z8v0kmrj5g`: Flow 3 — Contribution: submit report > duplicate guard fires on second submission within 24h > photo upload completes
  - `z8v0kmrj5v`: Flow 4 — Verification: confirm a report > vote count updates > self-verification rejected > vote is changeable
