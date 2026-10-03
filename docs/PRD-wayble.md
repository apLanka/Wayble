# PRD — Wayble

### Inclusive Public Space Accessibility Mapper

**Version 2.0** · supersedes v1.0 · reconciled against `SE3080-A1-task-breakdown-v2-convex` (v2, 10 Aug 2026) and the SE3050 assignment brief + marking scheme.

|             |                                                |
| ----------- | ---------------------------------------------- |
| **Product** | Wayble                                         |
| **Team**    | M1–M4 (4 members)                              |
| **Stack**   | Expo (React Native, TypeScript) + Convex       |
| **Board**   | ClickUp · **Repo** GitHub (`develop` → `main`) |

---

## 0. Read This First — Two Assignments, One Product

The task breakdown is an **SE3080 Assignment 1** artefact (sprints, story points, burndowns, ADRs, retrospectives). This PRD serves **SE3050 Assignment 1** (UX process, EDI, prototype, testing, branding, VIVA). Same codebase, two rubrics.

- **SE3080 owns:** process evidence — velocity, burndown, ceremonies, risk register, ADRs.
- **SE3050 owns:** UX evidence — research artefacts, hi-fi prototype, EDI checklist, usability testing rounds, branding, individual reflection + AI-use declaration.
- **Shared:** the app itself, the schema, the DoD, the tooling.

**Sprint naming is a trap.** The plan calls them Sprint 0 / 1 / 2. ClickUp names the same lists Sprint 1 / 2 / 3. Pick one convention for the reports and say which you used, or a panel comparing your two submissions will find a contradiction.

| Plan name  | ClickUp list | Dates           | Theme                                 | Points |
| ---------- | ------------ | --------------- | ------------------------------------- | ------ |
| Sprint 0   | Sprint 1     | 6–17 Jul        | Inception & skeleton                  | 24     |
| Sprint 1   | Sprint 2     | 20–31 Jul       | Discovery                             | 26     |
| Sprint 2   | Sprint 3     | 3–14 Aug        | Contribute & verify (**demo sprint**) | 28     |
| —          | —            | 17–24 Aug       | Report writing & rehearsal            | —      |
| —          | —            | **25 Aug**      | **SE3080 A1 submission**              | —      |
| Sprint 3–4 | provisional  | 24 Aug – 20 Sep | Assignment 2 backlog                  | —      |

**There is no Sprint 3 in this assignment.** Verification, confidence, flagging and the live feed are **Sprint 2** work, not deferred work.

---

## 1. Product Definition

### 1.1 Problem

People with mobility, visual, or cognitive impairments cannot find out whether a public space in Sri Lanka is actually usable before travelling to it. No official dataset exists, general map apps carry sparse and unverified accessibility attributes, and a wrong guess costs a wasted trip, money, and dignity.

### 1.2 How Might We

- HMW let a wheelchair user confirm a place is enterable _before_ leaving home?
- HMW make crowd-sourced accessibility data trustworthy enough to act on?
- HMW keep the app fully usable for someone relying entirely on a screen reader?
- HMW show each user the places that match _their_ specific needs, not a generic list?

### 1.3 Users

| Segment                                                                      | Why                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Wheelchair / mobility-aid users** _(primary, underserved segment for EDI)_ | Highest cost of bad information                        |
| **Blind & low-vision users** _(primary)_                                     | Drives the screen-reader-first requirement (E8, US-07) |
| **Caregivers & pram users** _(secondary)_                                    | Same physical barriers, high contribution volume       |
| **Community mappers / volunteers** _(supply side)_                           | Populate and verify the data (E4, E5)                  |

### 1.4 Personas (M1 deliverable — 4 required)

| #   | Persona                                     | Snapshot                                   | Primary need                                           | Maps to                    |
| --- | ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ | -------------------------- |
| P1  | Nimali, 28, manual wheelchair user, Colombo | Plans routes the night before              | Ramp + accessible WC confirmed, not guessed            | US-03, US-05, US-11        |
| P2  | Ruwan, 42, blind, TalkBack user             | Navigates by audio; a map alone is useless | Every control announced; non-map path to the same data | US-07, US-03 list fallback |
| P3  | Shanika, 34, pram user, budget data plan    | Opportunistic trips, low patience          | Fast answer, tolerant of weak signal                   | US-04, US-16               |
| P4  | Tharindu, 22, volunteer mapper              | Motivated by impact                        | Fast reporting flow, sees his contribution land        | US-08, US-09, US-10        |

### 1.5 Positioning (feeds M5)

For people with accessibility needs in Sri Lankan cities, **Wayble** is a community-verified accessibility map that ranks places by _your_ access needs — unlike general map apps, every attribute carries a confidence level built from independent verifications and a last-verified date.

### 1.6 Non-goals

Turn-by-turn navigation · indoor mapping · transit routing · web app · payments · social graph. Deferred to the Assignment-2 backlog: moderator queue (US-14), duplicate merge (US-15), **offline caching (US-17)**, reputation badges (US-18), step-free routing (US-19), coverage dashboard (US-20), push (US-21), **Sinhala/Tamil localisation (US-22)**.

---

## 2. Architecture Baseline (built in Sprint 0 — do not renegotiate)

```
Expo / React Native (TypeScript)
  app/_layout.tsx → ConvexProvider + ConvexAuthProvider(storage: expo-secure-store)
  EXPO_PUBLIC_CONVEX_URL   ·   react-native-maps   ·   expo-image-picker

Convex (dev + prod deployments)
  convex/schema.ts   users · places · reports · verifications · flags
  convex/auth.ts     @convex-dev/auth password provider, authTables
  getAuthUserId(ctx) on every protected mutation
  @convex-dev/geospatial (beta)  →  queryNearest, filterKeys
  ctx.storage        generateUploadUrl → storageId → getUrl
  convex-test        unit tests for queries & mutations
```

### 2.1 Tables & indexes

| Table           | Indexes                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `users`         | authTables base + `accessibilityNeeds[]`                                           |
| `places`        | `by_place`; `.searchIndex()` on `name`; geospatial index (separate from the table) |
| `reports`       | `by_place`, `by_author`                                                            |
| `verifications` | `by_report`, `by_report_and_user`                                                  |
| `flags`         | `by_report`                                                                        |

**Standing invariant:** `places` rows and geospatial index entries are written and deleted by **one mutation** that owns both. `npx convex import` fills the table but **not** the index — the backfill mutation must run after any import. Symptom of forgetting: an empty map over a full database. A `convex-test` assertion covers this.

**Documented fallback (ADR-001/002):** if the beta geospatial component fails, fetch all ~150 places and filter by Haversine client-side. Acceptable at this scale. Already written into the ADR — do not re-derive it under pressure.

### 2.2 Attribute taxonomy (canonical — 9 values, do not extend)

`ramp` · `step-free entrance` · `accessible WC` · `lift` · `tactile paving` · `accessible parking` · `wide doorway` · `audio signal` · `braille signage`

Every attribute renders as **icon + text label, never icon-only**.

### 2.3 Confidence model (`computeConfidence()`)

Pure function, own file, own unit tests. `agree/dispute ratio × distinct verifiers, decayed by age` → badge **Unverified / Low / Medium / High**, shown as **colour _and_ text**. Place detail also shows "last verified N days ago" with a **stale warning past 180 days**.

> Keep it pure and isolated. It is the most testable logic in the codebase and the thing a VIVA examiner is most likely to ask you to walk through line by line.

---

## 3. Backlog in Scope (frozen)

Owners follow the specialism split: **M1** Convex data layer · **M2** Expo app/screens · **M3** maps, geospatial, UI/UX · **M4** QA/DevOps.

### Sprint 0 — Inception (24 pts) · complete

S0-1 repo & PR workflow (M4) · S0-2 CI: ESLint, Prettier, `tsc --noEmit`, `convex-test`, Sonar gate, EAS (M4/M2) · S0-3 Convex project + client wiring (M1/M2) · S0-4 Expo shell with accessible theme (M2) · S0-5 schema + taxonomy + indexes + ER diagram (M1/M3) · S0-6 map SDK & geospatial spike + ADR-001/002 (M3/M1) · S0-7 client discovery, personas, charter (M1) · S0-8 board, backlog, DoR/DoD (M4)

### Sprint 1 — Discovery (26 pts)

| ID    | Story                                                           | Epic  | Pts | Owner |
| ----- | --------------------------------------------------------------- | ----- | --- | ----- |
| US-01 | Sign up and log in                                              | E2    | 3   | M1    |
| US-02 | Set my accessibility needs in my profile                        | E2/E6 | 2   | M1    |
| US-03 | See public spaces near me on a map                              | E3    | 8   | M3    |
| US-04 | Search and filter by accessibility attribute _(pulled forward)_ | E3/E6 | 5   | M2    |
| US-05 | View a place's recorded attributes                              | E3    | 3   | M2    |
| US-06 | Seed the database with real public spaces                       | E3    | 2   | M1    |
| US-07 | Screen-reader pass over all Sprint 1 screens                    | E8    | 3   | M2    |

### Sprint 2 — Contribute & Verify (28 pts) · **the demo sprint**

| ID    | Story                                                            | Epic  | Pts | Owner |
| ----- | ---------------------------------------------------------------- | ----- | --- | ----- |
| US-08 | Submit an accessibility report                                   | E4    | 5   | M1    |
| US-09 | Attach a photo as evidence                                       | E4    | 3   | M2    |
| US-10 | Confirm or dispute an existing report                            | E5    | 5   | M1    |
| US-11 | Confidence level and last-verified date                          | E5    | 5   | M3    |
| US-13 | Flag an inaccurate or abusive entry                              | E5/E7 | 2   | M2    |
| US-16 | Rank results by match to my access needs _(pulled from backlog)_ | E6    | 5   | M2    |
| US-23 | Live activity feed of nearby verifications _(new)_               | E5    | 3   | M3    |

---

## 4. Acceptance Criteria

Written as the test cases for `convex-test` and for the M3/M4 usability sessions. One block per story.

**US-01 Auth** — session survives app restart (secure-store, not AsyncStorage) · unauthenticated call to any protected mutation is rejected by `getAuthUserId(ctx)` · sign-up/login has inline validation · `convex-test` covers authed vs unauthed.

**US-02 Profile** — `accessibilityNeeds` multi-select (mobility, vision, hearing, cognitive) · `updateProfile` mutation tested · needs are private and never returned by a public query.

**US-03 Map** — location permission with a **graceful denial fallback** · `nearbyPlaces` via `geospatial.queryNearest` with `maxDistance` · marker clustering at low zoom · loading / empty / error states · **non-map list view exposing identical results** (screen readers cannot use a map) · every marker labelled with place name + confidence.

**US-04 Search & filter** — `.searchIndex()` on `places.name` · attribute filtering via the geospatial index's `filterKeys`, **applied before documents load, not in JS afterwards** · multi-select filter sheet with active-filter chips · "Matches my profile" quick filter driven by US-02.

**US-05 Place detail** — `getPlace` joins reports and returns aggregated per-attribute state · detail shows name, category, address, attribute list · icons always paired with text · **"No data yet" state that prompts a contribution**.

**US-06 Seed** — ~150 places for the target area from OSM Overpass · `npx convex import --table places` **plus** the backfill mutation for the geospatial index · test asserts table count matches index count.

**US-07 Accessibility pass** — `accessibilityLabel` / `accessibilityRole` on all interactive elements · manual TalkBack **and** VoiceOver walkthrough with findings logged · WCAG 2.1 AA contrast audit with fixes applied.

**US-08 Submit report** — `submitReport` with validators, author from `getAuthUserId` (never client-supplied) · **duplicate guard: same user + same place within 24h rejected in the mutation** · multi-step form: category → attributes → notes → confirm · optimistic update via `useMutation().withOptimisticUpdate` with rollback + announced error on failure · test covers the duplicate rejection.

**US-09 Photo evidence** — `generateUploadUrl` → `storageId` stored on the report · `expo-image-picker` capture/select with compression · thumbnail via `ctx.storage.getUrl()` with **required alt text** · size and type validation · flow completes without a photo (optional).

**US-10 Confirm / dispute** — `by_report_and_user` enforces one vote per user, **changeable** · **self-verification of your own report is rejected server-side** · confirm/dispute control on the report card · test covers the self-verification rejection.

**US-11 Confidence & freshness** — pure `computeConfidence()` in a shared module · per-attribute confidence returned by `getPlace` · badge Unverified/Low/Medium/High in colour **and** text · "last verified N days ago", stale past 180 days · unit tests over the scoring function.

**US-13 Flagging** — `flagReport` with a reason **union validator** · flag in the report overflow menu with confirmation · flagging never hard-deletes the record.

**US-16 Needs-based ranking** — match score of a place's _verified_ attributes against the user's needs · nearby results sorted by match score, **distance as tiebreak** · **"why this ranked here" explanation on each result row** · tests over the match scorer.

**US-23 Live activity feed** — `recentVerifications` scoped to the current map region · feed subscribes via `useQuery`, updates with no refresh · new items announced with `AccessibilityInfo.announceForAccessibility`.

> US-23 is your demo. Two phones, submit a verification on one, watch it appear on the other with nothing refreshed. Three points for the strongest 30 seconds of the panel presentation.

---

## 5. Definition of Done (from the breakdown — unchanged)

Merged to `develop` via reviewed PR · `convex-test` coverage for new queries and mutations · `tsc --noEmit` clean · CI green **including the Sonar gate** · **every new mutation checks auth via `getAuthUserId`** · screen-reader labels present on new UI · demoed to the PO · board card moved to Done.

The auth clause matters: **Convex functions are public endpoints by default.** A mutation without an auth check is callable by anyone holding your deployment URL. Say exactly this at the VIVA.

---

## 6. EDI Requirements (SE3050 Milestone 2 — 11 marks, largest group line item)

Acceptance criteria, not aspirations. Each row is filled with evidence in the EDI compliance checklist.

| Area                | Requirement                                                                                                                                                                              | Evidence                 | Source       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------ |
| Contrast            | Text ≥4.5:1, large ≥3:1 (WCAG 1.4.3)                                                                                                                                                     | Contrast audit output    | US-07        |
| Colour independence | Confidence badge = colour **+** text; attributes = icon **+** label                                                                                                                      | Screens                  | US-11, US-05 |
| Text scaling        | Survives 200% font scale, no clipping (1.4.4)                                                                                                                                            | Screenshot at 200%       | US-07        |
| Touch targets       | ≥44×44 dp (2.5.8)                                                                                                                                                                        | Design system spec       | US-04, US-07 |
| Screen reader       | Labels + roles on all interactive elements; **map has a list equivalent**                                                                                                                | TalkBack + VoiceOver log | US-03, US-07 |
| Announcements       | Async state changes announced                                                                                                                                                            | Code ref                 | US-23        |
| Motor               | No drag-only or long-press-only action; everything reachable by single tap                                                                                                               | Flow audit               | US-07        |
| Cognitive           | One task per step (US-08 multi-step form), plain language, no time limits, reversible votes                                                                                              | Copy deck                | US-08, US-10 |
| Equity of need      | Results ranked to the individual's needs, with the reason shown                                                                                                                          | Result row               | **US-16**    |
| Localisation        | **Documented in the EDI checklist and prototype; implementation deferred to US-22 (Assignment 2).** Keep all strings in one module and bake no text into images so the claim is credible | `strings.ts` + Figma     | US-22        |
| Socioeconomic       | Optimistic writes and compressed thumbnails for weak connections; Android 8+ APK. **Do not claim offline support — US-17 is backlog and got harder under Convex**                        | Perf note                | US-09, US-17 |

> Two honesty traps: do not write "multilingual" or "works offline" into the prototype or the pitch deck. Both are backlog. Claiming them and failing a VIVA probe costs more than not claiming them.

---

## 7. Secure Design (SE3050 Milestone 3 criterion — 3 marks)

Rubric wants controls **implemented and documented**. Cite the file path for each row.

| Control               | Implementation                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Authentication        | `@convex-dev/auth` password provider in `convex/auth.ts`; no custom crypto                                      |
| Token storage         | `ConvexAuthProvider` `storage` prop → `expo-secure-store` (Keychain/Keystore)                                   |
| Authorization         | `getAuthUserId(ctx)` on every protected mutation — a **DoD line**, not a convention                             |
| Input validation      | Convex validators on every argument; reason **union validator** on `flagReport`; note length capped server-side |
| Upload validation     | Size and type checks on photo upload; signed `generateUploadUrl`, no public bucket                              |
| Abuse — duplicates    | Same user + place within 24h rejected in `submitReport`                                                         |
| Abuse — vote stuffing | `by_report_and_user` = one vote per user per report                                                             |
| Abuse — self-dealing  | Self-verification of your own report rejected server-side                                                       |
| Content               | `flagReport` suppresses rather than deletes; moderator queue (US-14) named as backlog                           |
| Privacy               | No user location persisted — only place coordinates; `accessibilityNeeds` never exposed publicly                |
| Secrets               | Only `EXPO_PUBLIC_CONVEX_URL` client-side; nothing secret in the repo; Sonar gate on every PR                   |

---

## 8. User Testing (SE3050 Milestone 4 criterion — 7 marks)

Top band requires **two rounds, ≥5 users each** — one on the hi-fi prototype, one on the implemented app. This is a scheduling problem and the calendar is tight (§11).

|              | Round 1 — prototype                                                                                     | Round 2 — app build                                              |
| ------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Participants | 5–6, incl. ≥1 screen-reader user, ≥1 mobility-aid user                                                  | 5–6, ≥3 returning                                                |
| Tasks        | T1 find a nearby place with an accessible WC · T2 check whether a place has a ramp · T3 submit a report | T1–T3 + T4 confirm someone else's report · T5 read the live feed |
| Methods      | Moderated, think-aloud, SUS                                                                             | Same + on-device task timing                                     |
| Metrics      | Completion rate, time-on-task, errors, SUS                                                              | Same, compared against R1                                        |
| Output       | Prioritised pain points                                                                                 | Before/after summary table                                       |

Recruit through the same channel as the SE3080 **client/stakeholder** — a disability advocacy org or university disability services. One relationship, two rubrics.

---

## 9. Traceability Matrix (SE3050 Milestone 3/4 deliverable)

Keep at `docs/traceability.md`; paste the final version into the report.

| Story | Feature           | Convex function                       | Screen                | Test                        | Owner |
| ----- | ----------------- | ------------------------------------- | --------------------- | --------------------------- | ----- |
| US-01 | Auth              | `auth.ts`, `getAuthUserId`            | Sign-up / Login       | authed vs unauthed          | M1    |
| US-02 | Needs profile     | `updateProfile`                       | Profile               | mutation test               | M1    |
| US-03 | Nearby map + list | `nearbyPlaces`                        | Map / List            | nearby query test           | M3    |
| US-04 | Search & filter   | `places.searchIndex`, `filterKeys`    | Search / Filter sheet | filter test                 | M2    |
| US-05 | Place detail      | `getPlace`                            | Place detail          | getPlace test               | M2    |
| US-06 | Seed              | `convex import` + backfill mutation   | —                     | table/index parity          | M1    |
| US-07 | A11y pass         | —                                     | all Sprint 1 screens  | TalkBack + VoiceOver log    | M2    |
| US-08 | Submit report     | `submitReport`                        | Report form           | duplicate-guard rejection   | M1    |
| US-09 | Photo evidence    | `generateUploadUrl`, `storage.getUrl` | Report form           | size/type validation        | M2    |
| US-10 | Confirm / dispute | `verifyReport`                        | Report card           | self-verification rejection | M1    |
| US-11 | Confidence        | `computeConfidence`, `getPlace`       | Place detail          | scoring unit tests          | M3    |
| US-13 | Flagging          | `flagReport`                          | Report overflow       | reason validator            | M2    |
| US-16 | Needs ranking     | match scorer                          | Results list          | match scorer tests          | M2    |
| US-23 | Live feed         | `recentVerifications`                 | Feed                  | manual two-device demo      | M3    |

---

## 10. SE3050 Rubric Map (100 marks)

⚠️ **The milestone plan and the marking scheme number the milestones differently.** The plan calls testing M3 and implementation M4; the rubric puts tech stack / implementation / secure design under _Milestone 3_ and user testing under _Milestone 4_. **Use the rubric's headings in the report** and add one line noting the mapping.

| Rubric criterion                                                    | Marks | Evidence                                                                            | Lead  |
| ------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------- | ----- |
| User Research & Analysis                                            | 7     | Personas, empathy maps, affinity mapping, journey maps, stakeholder analysis (S0-7) | M1    |
| Ideation & Wireframing                                              | 7     | Crazy 8s / SCAMPER, sitemap, user flows, wireframe set + rationale                  | M3    |
| Hi-Fi Prototype + EDI                                               | 11    | Figma prototype + §6 checklist                                                      | M3    |
| Tech Stack Justification & Novel Tech                               | 3     | §12 + ADR-001/002                                                                   | M1    |
| Mobile App Implementation                                           | 9     | Sprints 0–2 (§3, §4), APK, repo link                                                | M2    |
| Secure Design                                                       | 3     | §7 with file paths                                                                  | M1/M4 |
| User Testing & Iteration                                            | 7     | §8 — **two rounds**                                                                 | M4    |
| Branding & Promotion                                                | 6     | Logo, tagline, A3 poster, 2× 1–2 min MP4                                            | M3    |
| Report & Documentation                                              | 7     | This PRD + traceability + risk register                                             | M4    |
| Teamwork _(individual)_                                             | 10    | §13                                                                                 | each  |
| Presentation & VIVA _(individual)_                                  | 15    | §13                                                                                 | each  |
| Contribution log, reflection, **AI-use declaration** _(individual)_ | 15    | §13                                                                                 | each  |

**40 of 100 marks are assessed per member.** The group artefacts cannot earn them.

---

## 11. Status & Calendar Reality

| Sprint                        | Window     | State                            |
| ----------------------------- | ---------- | -------------------------------- |
| Sprint 0 (ClickUp "Sprint 1") | 6–17 Jul   | Complete                         |
| Sprint 1 (ClickUp "Sprint 2") | 20–31 Jul  | Complete / closing               |
| Sprint 2 (ClickUp "Sprint 3") | 3–14 Aug   | **In progress, past its window** |
| Report writing & rehearsal    | 17–24 Aug  | Should have started              |
| SE3080 A1 submission          | **25 Aug** | 5 days out                       |

**Both burndowns still show only Day 0 actuals.** Whether that means the tracking was never filled in or the sprints never burned down, the report needs a real actual line — a flat burndown chart is worse evidence than an honest one showing a mid-sprint recovery. Reconstruct from ClickUp card close dates today.

**Triage call, in this order:** (1) US-08 → US-10 → US-11 → US-23 are the demo spine — without them there is no Sprint 2 demo and no SE3050 implementation marks; (2) US-16 and US-13 are the drop candidates if time runs out — drop them **explicitly in the retrospective**, do not let them rot half-built; (3) protect the two testing rounds (7 marks) and the branding/video block (6 marks) — neither can be produced the night before, and together they outweigh US-16 and US-13.

---

## 12. Tech Stack Justification (3 marks)

Use the real decision history — you already have ADR-002, which is stronger evidence than a hypothetical comparison.

| Criterion         | **Convex + Expo** _(chosen, ADR-002)_                                                                           | NestJS + MongoDB + Docker _(v1 plan, rejected 10 Aug)_ | Flutter + Firebase         |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------- |
| Effort            | ~15–20% less total effort: no API server, no DTOs, no auth guards, no Docker, no Atlas, no separate deploy      | Full backend service to build and operate              | Middle                     |
| Language          | One TypeScript codebase, client + server                                                                        | TS both sides but two runtimes and a network contract  | Dart + JS                  |
| Real-time         | `useQuery` reactivity is native — US-23 exists **only** because of it                                           | Sockets to build and maintain                          | Firestore listeners        |
| Geospatial        | `@convex-dev/geospatial` `queryNearest` + `filterKeys` — filtering before documents load                        | Mongo geo queries, mature                              | GeoFlutterFire (community) |
| File storage      | Built in — no bucket, no signed-URL plumbing, no third-party account                                            | Cloudinary or GridFS decision required                 | Firebase Storage           |
| Accessibility     | RN a11y props map to TalkBack/VoiceOver; `AccessibilityInfo` API                                                | n/a (client-independent)                               | Good semantics API         |
| **Risk accepted** | **Geospatial component is beta** — timeboxed spike (S0-6) with a documented Haversine fallback over ~150 places | Mature but slower                                      | Fewest team skills         |

**Novel technology claim:** Convex's reactive query model plus its beta geospatial component. Name the beta risk and the fallback in the same breath — the rubric's top band rewards reasoning about maintainability and risk, not enthusiasm.

**Say the stack change out loud.** Record it as ADR-002 with a rationale in the Sprint 0 retrospective. A panel that reads "we re-evaluated our architecture in Sprint 0 and adjusted the backlog" sees a competent team. A panel that finds NestJS in the charter and Convex in the repo sees a careless one.

---

## 13. Individual Accountability (40 marks — read this section personally)

1. **Contribution log** per member per milestone with evidence: commit SHAs, PR links, Figma frames, ClickUp cards, meeting notes, test session recordings. Reconstructing it at the end reads as fabricated and lands in the "limited evidence" band.
2. **One-page signed self-reflection**, handed directly to the panel — contributions, challenges, skills learned, what you'd do differently. Not part of the group report.
3. **AI-use declaration** — required by the marking scheme, **absent from the milestone plan's deliverable list**. Every member declares tools used, for what, and what they personally verified. It sits inside a 15-mark criterion. This PRD was AI-assisted; declare it.
4. **VIVA:** every member must explain _any_ part of the project, including sections they did not build. Book two whole-team walkthroughs where each person presents **someone else's** section. Highest-probability questions: walk through `computeConfidence()` line by line · why is `getAuthUserId` in the DoD · why Convex over NestJS · how do the `places` table and the geospatial index stay in sync.
5. **Screenshot cadence:** ClickUp board, Sonar dashboard, and the Convex function-log dashboard at the end of each sprint. Convex's dashboard doubles as deployment evidence.

---

## 14. Open Items

Carried from the breakdown, still open:

1. **Client / stakeholder** — who, confirmed for review dates. Highest priority, and the same contact should supply testing participants (§8).
2. Real names and registration numbers for M1–M4 + group ID (the marking sheet has four registration columns).
3. Target geographic area for the ~150-place seed.
4. Auth provider confirmation — Convex Auth password provider vs Clerk.
5. **24 ClickUp tasks still describe NestJS and MongoDB.** Fix before any screenshot goes into either report.

New: 6. **SE3050 submission date** — "end of week 10" needs a calendar date, and it decides whether the branding block runs before or after 25 Aug. 7. Tagline and logo direction for Wayble (blocks the A3 poster and both videos). 8. Confirm "Wayble" is clear of an existing app or trademark before the logo work starts. 9. Which sprint-naming convention (plan vs ClickUp) both reports will use.
