# EDI Compliance Checklist — Wayble

**Source:** `docs/PRD-wayble.md` §6, reproduced row for row. The PRD makes these
acceptance criteria, not aspirations: "Each row is filled with evidence in the EDI
compliance checklist." This file is that checklist.

**Owner:** Pasindu Lanka · **Task:** S4-5 `z8v0kmrg2d` (Sprint 4, due 02 Oct 2026)

**Status vocabulary**

| Status       | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| ✅ Evidenced | Requirement met, evidence recorded below, test or artefact named. |
| 🟡 Partial   | Some of the requirement met. What is missing is stated.           |
| ⬜ Pending   | Not yet done. Owning task named so it is not lost.                |

**Two honesty traps, from the PRD itself.** Do not write "multilingual" or "works
offline" into the prototype or the pitch deck. Both are backlog. Claiming them and
failing a VIVA probe costs more than not claiming them. Nothing in this document
claims either.

---

## 1. Summary

| #   | Area                | Status           | Owning task                     |
| --- | ------------------- | ---------------- | ------------------------------- |
| 1   | Contrast            | ⬜ Pending       | S4-3 `z8v0kmrj4v`               |
| 2   | Colour independence | ⬜ Pending       | S4-3 `z8v0kmrj5m`               |
| 3   | Text scaling        | ⬜ Pending       | S4-3 `z8v0kmrj53`               |
| 4   | Touch targets       | ⬜ Pending       | S4-3 `z8v0kmrj5b`               |
| 5   | Screen reader       | ⬜ Pending       | S4-3 `z8v0kmrj5m`, `z8v0kmrj5x` |
| 6   | Announcements       | 🟡 Partial       | S3-7 `z8v0kmrj49`               |
| 7   | Motor               | ⬜ Pending       | S4-3 `z8v0kmrj5x`               |
| 8   | Cognitive           | ✅ Evidenced     | S3-1, S3-3                      |
| 9   | Equity of need      | ⬜ Pending       | S3-5 `z8v0kmrj4f`               |
| 10  | **Localisation**    | **✅ Evidenced** | **S4-5 `z8v0kmrg2d`**           |
| 11  | Socioeconomic       | ⬜ Pending       | S3-2 `z8v0kmrj4c`               |

Two of the eleven carry a ✅ — Localisation and Cognitive. Announcements is 🟡,
with its gap stated in the row. The other eight are named, not guessed at.

---

## 2. Requirements

### 1. Contrast — ⬜ Pending

> Text ≥4.5:1, large ≥3:1 (WCAG 1.4.3)

**Evidence required:** contrast audit output. **Source:** US-07. **Owner:** S4-3 `z8v0kmrj4v`.

Not audited in this task. The tokens exist in `apps/mobile/constants/theme.ts`
with measured ratios recorded in comments at several call sites — for example
`VerifyControl.tsx` records 5.98:1 light and 6.40:1 dark for `focus` on
`surfaceElevated`, and 6.61:1 / 9.98:1 for `onPrimary` on `primary` — but a
per-screen audit has not been run and no output artefact exists. Do not cite
those comments as a pass.

### 2. Colour independence — ⬜ Pending

> Confidence badge = colour **+** text; attributes = icon **+** label

**Evidence required:** screens. **Source:** US-11, US-05. **Owner:** S4-3 `z8v0kmrj5m`.

Partially built, not audited. The codebase enforces icon-plus-label by
construction: `constants/accessibility-metadata.ts` gives every attribute key a
`label` and an `icon` in one record, and `AttributeRow` renders both, so a
colour-free attribute row is not expressible. The US-11 confidence badge is a
separate Sprint 3 task and is not on this branch.

### 3. Text scaling — ⬜ Pending

> Survives 200% font scale, no clipping (1.4.4)

**Evidence required:** screenshot at 200%. **Source:** US-07. **Owner:** S4-3 `z8v0kmrj53`.

No screenshots taken in this task. A refactor is not a substitute: moving a
string cannot change a layout, and cannot be used as evidence that a layout holds.

### 4. Touch targets — ⬜ Pending

> ≥44×44 dp (2.5.8)

**Evidence required:** design system spec. **Source:** US-04, US-07. **Owner:** S4-3 `z8v0kmrj5b`.

`components/ui/touch-target.tsx` exists and is used by the interactive elements
touched in S4-5, but no measured audit exists. Not verified here.

### 5. Screen reader — ⬜ Pending

> Labels + roles on all interactive elements; **map has a list equivalent**

**Evidence required:** TalkBack + VoiceOver log. **Source:** US-03, US-07. **Owner:** S4-3 `z8v0kmrj5m`, `z8v0kmrj5x`.

A screen-reader walkthrough log exists at
`docs/tasks/WAY-14-screen-reader-walkthrough-log.md` and a plan at
`docs/plans/S1-WAY-14-screen-reader-pass.md`, both from Sprint 1. Whether they
cover the Sprint 3 screens is not established by this task, so they are not cited
as evidence for a Sprint 4 claim.

### 6. Announcements — 🟡 Partial

> Async state changes announced

**Evidence:** code reference. **Source:** US-23.

Announcements are gathered in a first-class namespace — `STRINGS.announcements` in
`apps/mobile/constants/strings.ts`, with a doc comment stating why: it is "copy
for the ear, not for the page … written to be understood without a visual
referent, in one breath, and never seen."

**Partial, and the gap is real: 6 of the app's 9 `announceForAccessibility` call
sites read from it, and 3 do not.**

| Site                                         | Reads `STRINGS.announcements`                              |
| -------------------------------------------- | ---------------------------------------------------------- |
| `app/onboarding.tsx`                         | ✅ `welcome`                                               |
| `app/place/[id]/reports.tsx`                 | ✅ `reportConfirmed` / `reportDisputed`                    |
| `app/place/[id]/reports.tsx`                 | ✅ the classified error message, inline beside the control |
| `app/report/[placeId].tsx`                   | ✅ `stepOf`, on both forward and hardware-back             |
| `app/report/[placeId].tsx`                   | ✅ `reportSubmitted`                                       |
| `app/(tabs)/profile/accessibility-needs.tsx` | ✅ `needsCleared`                                          |
| `app/(tabs)/profile/accessibility-needs.tsx` | ❌ interpolates a needs summary                            |
| `app/place/[id]/index.tsx`                   | ❌ interpolates a report count                             |
| `app/(tabs)/settings/notifications.tsx`      | ❌ interpolates a toggle result                            |

The three that remain interpolate live state — a summary, a count, a toggle
result — so each is a _sentence shape_ rather than a fixed string, which is
harder to key and is why the refactor left them. They are copy a screen-reader
user hears, so US-22 must come back to them.

`STRINGS.announcements.stepOf` is deliberately **not** the same function as
`STRINGS.report.stepOfWithTitle`. The visible step label joins position and title
with an em dash; these announcements have always used a colon, and a screen-reader
user hears one dozens of times per form. Both forms are pinned in
`strings.test.ts`.

`app/place/[id]/reports.tsx` carries a comment worth quoting, because it is the
reason the row is evidenced at all: the announcement happens **after** the
`await`, not before, since the optimistic patch is already visible and the tally
text is what changed.

### 7. Motor — ⬜ Pending

> No drag-only or long-press-only action; everything reachable by single tap

**Evidence required:** flow audit. **Source:** US-07. **Owner:** S4-3 `z8v0kmrj5x`.

Not audited in this task.

### 8. Cognitive — ✅ Evidenced

> One task per step (US-08 multi-step form), plain language, no time limits, reversible votes

**Evidence:** the wizard and the vote control, in code.

- **One task per step.** The report form is four fixed steps —
  `category`, `attributes`, `notes`, `confirm` — declared as machine ids in
  `components/report/report-draft.ts` and titled in `STRINGS.report.stepTitles`.
  `StepIndicator.tsx` renders position, total and title as one `progressbar`
  element so a screen reader hears "step 2 of 4" once rather than four
  disconnected segments, and the file documents why the label and the value are
  split: without that split iOS would speak the position twice in two different
  punctuations.
- **Plain language.** Copy is gathered in one module and reads as short
  sentences — "Be the first to contribute! Share what you know about this
  place's accessibility features to help others." rather than jargon. There are
  no time limits anywhere in the form; nothing in the code starts a timer.
- **Reversible votes.** `applyVerdictChange` in
  `components/place/verification-tally.ts` is a pure function over the caller's
  own row, and a second vote patches the existing row rather than inserting a
  new one — the tally moves in either direction. The control's `disabled` state
  is a different thing: it blocks self-verification, which the server enforces
  separately and rejects with an error rather than silently.

### 9. Equity of need — ⬜ Pending

> Results ranked to the individual's needs, with the reason shown

**Evidence required:** result row. **Source:** US-16.

US-16 is a Sprint 3 task owned by another member and is not on this branch. The
`a11y/accessibility-needs.tsx` profile screen exists and holds the user's needs,
but ranking is not evidenced.

### 10. Localisation — ✅ Evidenced

> **Documented in the EDI checklist and prototype; implementation deferred to
> US-22 (Assignment 2).** Keep all strings in one module and bake no text into
> images so the claim is credible

**Evidence required:** `strings.ts` + Figma. **Source:** US-22.
**Owner:** S4-5 `z8v0kmrg2d` — subtasks `z8v0kmrj4x`, `z8v0kmrj55`, `z8v0kmrj5d`,
`z8v0kmrj5q`.

#### What is proven

**The strings are in one module.** `apps/mobile/constants/strings.ts` — 13
namespaces, **287 plain string leaves and 48 composed functions, 335
user-facing strings**, counted by walking the exported object at runtime rather
than by reading the file:

| Namespace       | Strings | Functions |     | Namespace    | Strings | Functions |
| --------------- | ------- | --------- | --- | ------------ | ------- | --------- |
| `common`        | 26      | 7         |     | `map`        | 32      | 7         |
| `navigation`    | 13      | 0         |     | `place`      | 25      | 9         |
| `permissions`   | 10      | 0         |     | `report`     | 34      | 13        |
| `announcements` | 5       | 0         |     | `profile`    | 35      | 6         |
| `auth`          | 13      | 0         |     | `settings`   | 31      | 2         |
| `errors`        | 23      | 3         |     | `onboarding` | 13      | 0         |
| `home`          | 27      | 1         |     |              |         |           |

Interpolated sentences are **functions inside the module**, not templates at the
call site, so that a locale lookup can replace them without touching a single
screen. `placeRowLabel` is the clearest case: it reads
`"Cafe, food_and_drink, 450m away"`, and the absent-distance branch returns
`"Cafe, food_and_drink"` rather than a dangling comma. `strings.test.ts` pins
that output exactly, because a comma lost in a refactor still type-checks and
still renders — it only fails when a screen reader reads it aloud.

**The claim is enforced on the surface the guard covers — and that surface has
edges.** `apps/mobile/constants/strings-guard.test.ts` walks 88 source files
across `app/`, `components/`, `hooks/` and `utils/`, detects inline copy in
accessibility props, placeholders, route titles and plain-text `AppText` bodies,
and fails if the count rises above a committed ceiling. That ceiling is a
countdown, and the diff is the record:

|       |                                                                                              |
| ----- | -------------------------------------------------------------------------------------------- |
| 311   | guard written (Task 1)                                                                       |
| 299   | navigation titles, tab labels (Task 2)                                                       |
| 237   | sign-in, sign-up, onboarding (Task 3)                                                        |
| 204   | home screen (Task 4)                                                                         |
| 173   | map tab (Task 5)                                                                             |
| 141   | place detail, verification (Task 6)                                                          |
| 103   | report wizard (Task 7)                                                                       |
| 58    | profile (Task 8)                                                                             |
| 9     | settings (Task 9)                                                                            |
| 12    | final, map tab deferred                                                                      |
| **6** | **map tab finished; moderator queue, feed and report menu from `main` moved into `STRINGS`** |

The unit is **pattern hits, not distinct strings** — a JSX prop written
`label="x"` matches two patterns and counts twice, while an `AppText` body
counts once. The 6 hits that remain are **6 sites holding 5 distinct icon
glyphs** — the close `✕` (detail sheet), the search `🔍` and clear `✕`, the
clipboard `📋`, the checkbox `✓` and the map marker `🧍`. Icons rendered beside a
text label; nothing in them to translate. No prose sentence is left on the
scanned surface.

**What the guard cannot see, stated plainly.** It is a ratchet, not a proof:

- A ternary inside an expression container — `<AppText>{saving ? "Saving…" :
"Submit report"}</AppText>` — and copy passed as a call argument —
  `setError("Notifications are blocked.")` — are both invisible to it. Both
  patterns exist in the app today. Interpolated copy was moved by hand and
  pinned in `strings.test.ts` instead.
- `constants/`, `data/`, `app.config.ts` and any new top-level directory are
  outside `SCAN_ROOTS`.
- `app/debug` and `components/debug` are excluded as a **scope** decision, not
  because they never ship — they are real routes, reachable from the Developer
  card in settings, and they do render copy. Not user-facing product, so out of
  scope, but the exclusion is a choice and not a fact about the build.

So: the surface the guard covers cannot regress, and the residue is enumerated
and owned. It is **not** true that no inline copy remains anywhere in the app.

**No text is baked into any live image.** Audited all 23 image files in
`apps/mobile/assets/`. Five are referenced by the shipped app, and all five were
opened and looked at:

| Asset                                 | Referenced by                                  | Contains text                          |
| ------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `images/app-icon/wayble-app-icon.png` | `app.json`, `onboarding.tsx`, `HomeHeader.tsx` | No — two overlapping green leaf shapes |
| `images/splash-icon.png`              | `app.json`                                     | No — a white chevron mark              |
| `images/favicon.png`                  | `app.json`                                     | No — a blue chevron mark               |
| `images/android-icon-monochrome.png`  | `app.config.ts`, `app.json`                    | No — a grey chevron mark               |
| `images/android-icon-background.png`  | `app.json`                                     | No — a pale guide grid                 |

The other 18 are unreferenced: nine Expo/React Native template leftovers
(`expo-badge.png`, `expo-badge-white.png`, `expo-logo.png`, `react-logo.png`
and its `@2x`/`@3x`, `tutorial-web.png`, `expo.icon/Assets/grid.png`,
`expo.icon/Assets/expo-symbol 2.svg`), six `tabIcons/` PNGs that the app no
longer uses because the tab bar draws native SF Symbol and Material icons, plus
`images/icon.png`, `logo-glow.png` and `android-icon-foreground.png`. None are in
the shipped build, so none bear on localisation. They are left in place; removing
them is a separate decision and not this task's.

#### What is not proven, and is not claimed

- **No translation ships.** Not one word of Sinhala or Tamil. The claim is that
  the strings are _extractable_, not that the app is localised.
- **Pluralisation is English one/many only.** `plural()` in `strings.ts` is
  `count === 1 ? one : other`, and its doc comment says so and points at US-22.
  Sinhala and Tamil do not use that rule. Its 0/1/2 behaviour is pinned in
  `strings.test.ts` so the English build stays correct, which is all it claims.
- **Dates and numbers are not localised.** `formatRelativeTime` falls back to
  `new Date(timestamp).toLocaleDateString()` with **no locale argument** — a
  real gap, called out in the source and in US-22's scope. Distance and
  relative-time wording is in `strings.ts`, but the number formatting around it
  is not locale-aware.
- **No right-to-left support.** Nothing in the codebase has been tested against
  an RTL locale.
- **Nothing is extracted automatically.** The module is the extraction. There is
  no i18n library, no locale files, no runtime locale switch.

#### The prototype half

The PRD asks for this claim in "the EDI checklist **and prototype**". The
prototype evidence is the Figma deliverable from S4-4, and it is not in this
repository, so it cannot be marked evidenced here. **Owner: S4-4, Nishara
Senadheera.** Until that is attached, this row is evidenced for the app and
unevidenced for the prototype — the status line above should be read that way.

#### One duplication, declared

`apps/mobile/app.config.ts` holds the iOS/Android location permission prompt as
a literal, and `STRINGS.permissions.os.locationWhenInUse` holds the same
sentence. This is not oversight. Expo transpiles `app.config.ts` to CommonJS and
requires it with Node's resolver, which cannot follow a relative import into a
`.ts` sibling — the import was tried, and `expo config` failed with
`Cannot find module './constants/strings'`. A build crash, not a failing test.

`strings-guard.test.ts` reads `app.config.ts` and asserts the two are equal, so
editing one without the other turns the suite red. That is the same bargain
`packages/backend/convex/notificationCopy.ts` already makes with its coverage
test, and the same one the backend must make: it cannot import from
`apps/mobile`, and its 19 push labels duplicate
`accessibility-metadata.ts` deliberately, with a comment saying US-22 turns that
map into a locale lookup.

### 11. Socioeconomic — ⬜ Pending

> Optimistic writes and compressed thumbnails for weak connections; Android 8+
> APK. **Do not claim offline support — US-17 is backlog and got harder under
> Convex**

**Evidence required:** perf note. **Source:** US-09, US-17. **Owner:** S3-2 `z8v0kmrj4c`.

US-09's photo upload and US-17's offline support are Sprint 3 tasks owned by
another member. Offline is explicitly **not** claimed, per the PRD.

---

## 3. For SE3050

The honest summary of where EDI compliance stands today: **two requirements
carry a ✅, one is 🟡 with its gap written down, and eight are named but not
done.** Announcements is the partial one — 6 of 9 call sites read from the
namespace. Localisation is evidenced for the app and not the prototype.

Three of the eleven name capability that does not exist and must not be claimed:
multilingual support (US-22), offline support (US-17), and — for row 10 — any
suggestion that the app is localised today. What exists is the precondition for
all three: the strings are gathered, the gathering is enforced by a test that
cannot silently regress, and no text is trapped inside an image.

Sprint 4 tasks S4-3 (the accessibility audit) and S4-4 (branding and the Figma
prototype) close most of the gap between this table and a full one. Neither is
this task's.

**Where the story-level evidence lives.** This document is the EDI rubric's
table. The story-to-test mapping is a different artefact and lives in
[`traceability.md`](./traceability.md), which since 2026-09-29 also records the
fact that five of the seven Sprint 3 stories never reached `main` — see
[`sprint-3-delivery-facts.md`](./sprint-3-delivery-facts.md). Two of the rows
above, Screen reader and Cognitive, depend on Sprint 3 screens; one of those
screens was never built, so a reader should take those two rows with the
traceability matrix open.
