# S4-5: `strings.ts` Localisation Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every user-facing string in the mobile app into one importable module, so the EDI localisation claim ("all strings are extractable") is literally true and stays true.

**Architecture:** A single new file, `apps/mobile/constants/strings.ts`, exports one `STRINGS` object nested by feature namespace. Interpolated strings (plurals, counts, template sentences) become functions _inside_ `STRINGS`, so every user-facing string — literal or templated — is reachable from that one file. Consumers import `{ STRINGS }` and read `STRINGS.<namespace>.<key>`. Existing formatters and error classifiers stay in their current files but read their text from `STRINGS`, so their tests keep passing unchanged. A Vitest guard test scans the source tree and fails when an unlisted inline literal appears, making the claim a ratchet rather than a one-time cleanup.

**Tech Stack:** Expo SDK 57 / React Native 0.86 / expo-router 7, TypeScript 6, Vitest 4.

**Spec:** Design approved in session on 2026-09-28. Authoritative sources: `docs/PRD-wayble.md` §6 (EDI requirements, the Localisation row) and `docs/sprint_tasks_and_subtasks.md` S4-5 (`z8v0kmrg2d`, subtasks `z8v0kmrj4x`, `z8v0kmrj55`, `z8v0kmrj5d`, `z8v0kmrj5q`). This document _is_ the spec-of-record for the interface; no separate design doc exists (bounded-scope change).

---

## Global Constraints

1. **`constants/strings.ts` must have zero runtime imports.** It is imported by `app.config.ts`, which Expo evaluates in Node at build time, where the `@/` path alias is unavailable and React Native modules cannot load. No `import` of anything except `import type` (erased at compile time). This rules out reading `MAX_SUMMARY_LENGTH` or `REPORT_STEPS` as values inside it.
2. **Copy is moved verbatim.** This is a refactor. No string is reworded, re-cased, re-punctuated, or re-ordered, even where the existing copy is inconsistent or wrong. Copy fixes are separate, separately reviewed changes — see "Findings to report, not fix".
3. **Never `git add -A`, `git add .`, or `git commit -a`.** Stage by explicit path. `apps/mobile/app/(tabs)/mapbox/index.tsx`, `bun.lock` and `docs/traceability.md` carry uncommitted work from before this task and must stay uncommitted.
4. **Test-pinned strings do not change.** `utils/format-relative-time.test.ts` and `components/place/verification-tally.test.ts` assert exact output. Those formatters keep their current return values, byte for byte.
5. **Verification gates.** Run from the repo root. All five are currently green on this branch — recorded baselines:
   - `bun run --filter mobile test` → **73 tests, 5 files** (vitest 4)
   - `bun run --filter @packages/backend test` → **162 tests, 17 files**
   - `bun run check-types` → clean
   - `bun run --filter mobile lint` → clean
   - `bun run format:check` → clean

   Note the backend's script is `vitest`, not `vitest run` (see `packages/backend/package.json`). It still terminates in this non-TTY environment; if it ever hangs in watch mode, re-run with `bunx vitest run` inside `packages/backend`.

6. **Namespace key style:** camelCase, matching the exported symbol it replaces. No abbreviations, no index signatures.

---

## What Deliberately Does Not Move

Extracting these would break contracts, not improve the claim. Do not touch them.

| Stays put                                                                                                                                                                                         | Where                                                                           | Why                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ATTRIBUTE_METADATA` labels, `VALUE_LABELS`, `PLACE_CATEGORY_LABELS`, `CATEGORY_DISPLAY_ORDER`                                                                                                    | `constants/accessibility-metadata.ts`                                           | Already-centralised tables keyed off the backend enum in `@packages/backend/convex/accessibility`. Moving them duplicates the key list and breaks the documented "icon is always paired with a text label" contract. The EDI checklist names this file as the other half of the string surface. |
| `accessibilityRole` values (`"button"`, `"header"`, `"search"`, `"progressbar"`, …)                                                                                                               | everywhere                                                                      | React Native platform tokens, not copy.                                                                                                                                                                                                                                                         |
| SF Symbol / Material Design identifiers, `HOME_SYMBOLS`, `CATEGORY_SYMBOLS`                                                                                                                       | `components/ui/app-symbol.tsx` and importers                                    | Platform identifiers, not copy.                                                                                                                                                                                                                                                                 |
| `"Duplicate report:"`, `"Unauthenticated:"`, `"Summary too long:"`, `"Note too long:"`, `"Unknown report:"`, `"Cannot verify your own report"`, `"Observation time is outside the allowed range"` | `components/report/report-errors.ts`, `components/place/verification-errors.ts` | Wire protocol matched by `classifyReportError` / `classifyVerificationError` and pinned by `packages/backend/convex/testing/reports.test.ts` and `verifications.test.ts`. Developer-facing, never rendered.                                                                                     |
| `MAX_SUMMARY_LENGTH`, `MAX_NOTE_LENGTH`, `MIN_PASSWORD_LENGTH`                                                                                                                                    | `@packages/backend/convex/reportLimits`                                         | Numbers, not copy. Interpolation reads them at the call site.                                                                                                                                                                                                                                   |
| `"verify-nearby"` (channel **id**)                                                                                                                                                                | `hooks/use-push-registration.ts`                                                | Machine identifier. The channel **name** next to it does move.                                                                                                                                                                                                                                  |
| Emoji tables (`CATEGORY_EMOJIS`, `ATTRIBUTE_ICON_EMOJI`, `"🔍"`, `"✕"`, `"✓"`, `"📍"`, `"🗺️"`)                                                                                                    | as-is                                                                           | Iconography, always rendered alongside a text label. Localising an emoji is meaningless.                                                                                                                                                                                                        |
| `console.log` / `console.warn` text                                                                                                                                                               | as-is                                                                           | Developer diagnostics.                                                                                                                                                                                                                                                                          |
| Route param keys, `ONBOARDING_STORAGE_KEY`, `"signIn"` / `"signUp"` flow names, `"true"`                                                                                                          | as-is                                                                           | Machine values.                                                                                                                                                                                                                                                                                 |
| `hooks/use-screen-reader.ts`                                                                                                                                                                      | not touched                                                                     | Contains no user-facing copy (verified: zero literals). Returns a boolean.                                                                                                                                                                                                                      |
| `app/debug/places.tsx`, `app/debug/index.tsx`, `components/debug/*`                                                                                                                               | not touched                                                                     | Dev-only screens, excluded by scope decision.                                                                                                                                                                                                                                                   |

> **Correction on the four map components.** An earlier draft of this plan listed `DetailSheet.tsx`, `LocateButton.tsx`, `ViewModeToggle.tsx` and `AccessibilityPin.tsx` as orphaned and out of scope. That is only true of the _uncommitted_ working tree. On `origin/main` (`e6379fc`) — the actual baseline of this branch — `app/(tabs)/mapbox/index.tsx` imports all three of the first, and they are live production components. They are therefore **in scope** (Task 5). Leaving them out would make "no inline string literals" false the moment the map is restored, and the map going missing is an open question, not a decision. `use-screen-reader.ts` really does contain no copy and stays out.

## Findings to Report, Not Fix

Surface these to Pasindu; do not silently change behaviour. They are what a VIVA probe finds.

1. **`components/map/LocationPermissionBanner.tsx:47,48`** says the fallback location is "(Bangalore)". Seeded data is Colombo (`components/debug/LoadAllPlacesButton.tsx:64`, `packages/backend/convex/seed/placesSeedData.ts`). The user-visible string is wrong. Move it verbatim; fix separately.
2. **`components/map/CategoryFilter.tsx:83`** renders `{cat === "all" ? "All places" : cat}` — the raw enum key. Users see "wheelchair", "elevator", "bathroom", "multi" in the filter pills while the `accessibilityLabel` says "Wheelchair Accessible". Move the `"All places"` branch verbatim; the enum-key fallback is not user-facing copy and must NOT go in `STRINGS`. Fix separately.
3. **`app/(tabs)/profile/_layout.tsx:9`** title is `"Accessibility Needs"` (title case) while `app/(tabs)/settings/index.tsx:122` body text is `"Accessibility needs"` (sentence case). Move both verbatim under distinct keys; unify separately.
4. **`hooks/use-location-permission.ts`** builds three `errorMsg` strings that no screen renders. `errorMsg` is returned but never read. Move the strings into `STRINGS.errors.location`; leave the dead wiring alone.

## Review Focus

The spec is "put all the strings in one file". Its silence on the following is not permission to break them. Each line has a test pinned in the task that owns the code.

1. **A plural that goes wrong at 1 or 0.** Sinhala and Tamil do not use English's one/many rule, but the numbers are already visible in the English build. `STRINGS.common.countLabel(0)` and `(1)` and `(2)` must read naturally, and `STRINGS.profile.needsCountLabel` must match the util it replaces. → Tasks 1, 8
2. **A screen reader reading a template that lost its punctuation.** 14 composed a11y labels are built from data; a mechanical extraction that drops the comma or the "away" turns a place row into gibberish for the app's primary audience. Each has an exact-output test. → Tasks 5, 6, 7, 8
3. **`format-relative-time` and `verification-tally` output drifting by one character** because a template was reworded while being moved. Their suites assert exact strings and must pass without edits. → Task 10
4. **`app.config.ts` failing to load at build time** if `strings.ts` gains a value import, because the location permission prompt reads from it. Symptom is a build-time crash, not a test failure. → Task 1, Task 10
5. **The guard test's allowlist rotting** into a blanket that permits any string in a file it has seen. Keyed by file + literal value, not by line number, so edits do not silently re-permit. → Task 1

---

## File Structure

**Create:**

- `apps/mobile/constants/strings.ts` — the whole user-facing string surface. Zero runtime imports.
- `apps/mobile/constants/strings-guard.test.ts` — Vitest ratchet over the source tree.
- `docs/EDI-compliance-checklist.md` — the 11 PRD §6 rows (z8v0kmrj5d).

**Modify** — roughly 50 files, all read-then-edit. **The per-task file lists are the authority; the counts below are orientation and will drift as you read the files.** Four listed files (`AttributeGroup.tsx`, `report-draft.ts`, `QuickActionCard.tsx`, `SectionHeader.tsx`) are believed to contain no literals and may need no edit at all.

| Area                   | Files                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell / navigation     | `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/mapbox/_layout.tsx`, `app/(tabs)/profile/_layout.tsx`, `app/(tabs)/settings/_layout.tsx`, `app/(tabs)/mapbox/index.tsx` (7)               |
| Auth / onboarding      | `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `app/onboarding.tsx` (3)                                                                                                                                        |
| Home                   | `app/(tabs)/home/index.tsx`, `components/home/{HomeHeader,SearchEntry,QuickActionCard,SectionHeader,CategoryShortcuts,HomeNearbySection}.tsx` (7)                                                                   |
| Map                    | `components/map/{CategoryFilter,SearchBar,PlaceListItem,LocationPermissionBanner,DetailSheet,LocateButton,ViewModeToggle,AccessibilityPin}.tsx`, `app/(tabs)/mapbox/place/[id].tsx` (9)                             |
| Place / verification   | `app/place/[id]/index.tsx`, `app/place/[id]/reports.tsx`, `components/place/{AttributeGroup,AttributeRow,CategoryBadge,NoDataPrompt,ReportCard,VerifyControl,verification-errors,verification-tally}.ts(x)` (9)     |
| Report wizard          | `app/report/[placeId].tsx`, `components/report/{StepIndicator,CategoryStep,AttributesStep,NotesStep,ConfirmStep,report-errors,report-draft}.ts(x)` (8)                                                              |
| Profile                | `app/(tabs)/profile/index.tsx`, `app/(tabs)/profile/accessibility-needs.tsx`, `components/profile/{ProfileHeader,ProfileNavRow,ProfileAvatar,GuestProfilePrompt,EditDisplayNameModal,NeedsCategorySection}.tsx` (8) |
| Settings               | `app/(tabs)/settings/index.tsx`, `app/(tabs)/settings/notifications.tsx` (2)                                                                                                                                        |
| Hooks / utils / config | `hooks/{use-push-registration,use-location-permission}.ts`, `utils/{get-time-greeting,get-accessibility-needs-summary,format-relative-time,format-distance}.ts`, `app.config.ts` (7)                                |

`components/ui/{app-text,screen,touch-target,checkbox-row,app-symbol}.tsx` and `components/providers/*` are listed for awareness, not for editing: `checkbox-row.tsx` contains only `"✓"` and pass-through props. Read them to confirm, then skip.

**Unchanged by design:** `constants/theme.ts`, `constants/accessibility-metadata.ts`, `packages/backend/convex/notificationCopy.ts`.

> `notificationCopy.ts` holds 19 server-side push label strings that deliberately duplicate `accessibility-metadata.ts`, with a comment at lines 6–17 saying US-22 will replace the map with a locale lookup, and a test holding it honest. The backend cannot import from `apps/mobile`, so this duplication is correct. Do not attempt to merge it, and do not let the guard test reach `packages/backend`.

---

## The `STRINGS` Interface

Pinned here once. Every task implements a slice of this; later tasks read it.

```ts
// apps/mobile/constants/strings.ts — zero runtime imports (Global Constraint 1)
export const STRINGS: {
  common: CommonStrings;
  navigation: NavigationStrings;
  permissions: PermissionStrings;
  announcements: AnnouncementStrings;
  auth: AuthStrings;
  onboarding: OnboardingStrings;
  home: HomeStrings;
  map: MapStrings;
  place: PlaceStrings;
  report: ReportStrings;
  profile: ProfileStrings;
  settings: SettingsStrings;
  errors: ErrorStrings;
};

/** English one/many selection. Locale rules are deferred to US-22 (see note below). */
export function plural(count: number, one: string, other: string): string;
```

**Shape rules, applied to every namespace:**

1. Flat leaves. A leaf is either a `string` literal or a `(…args) => string` function. No leaf is an object, an array, or a `Record` of other strings.
2. **Interpolated strings are functions inside `STRINGS`, not templates at the call site.** `STRINGS.settings.needCount(3)`, not `` `${n} ${plural(n,"need","needs")} selected` `` at the call site. Both the words and the grammar live in `strings.ts`, which is what the claim requires.
3. `a11y` is a nested object **inside** the owning feature namespace, not a top-level one. `STRINGS.home.a11y.openMapLabel`, not `STRINGS.a11y.home.openMap`. Screen-reader copy is the primary audience and belongs beside the screen it is announced from.
4. A function leaf is `(…args) => string` with named, positionally-typed parameters. It is written inline in the object literal; it is never hoisted to a module-level `function`.
5. `plural` is a helper used _inside_ `STRINGS` function leaves only. It is never imported by a component. A component never composes grammar.

**Signatures for the composed screen-reader labels and the 4 wizard templates.** These are function _leaves_, so they are reached through `STRINGS`, never imported bare. The namespace each one lives in is pinned here, because that is the decision an implementer cannot make from the file alone:

| Accessed as                          | Signature                                                                                   | Owning task |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ----------- |
| `STRINGS.home.profileGreeting`       | `(greeting: string, displayName: string) => string`                                         | 4           |
| `STRINGS.map.placeRowLabel`          | `(name: string, category: string, distance: string \| null) => string`                      | 5           |
| `STRINGS.map.searchResultLabel`      | `(name: string, distanceText: string \| null, features: string \| null) => string`          | 5           |
| `STRINGS.map.categoryLabel`          | `(label: string) => string`                                                                 | 5           |
| `STRINGS.map.categoryAnnounce`       | `(label: string, accessible: boolean) => string`                                            | 5           |
| `STRINGS.place.attributeRowLabel`    | `(label: string, valueLabel: string, note: string \| null) => string`                       | 6           |
| `STRINGS.place.reportCardLabel`      | `(label: string, valueLabel: string, note: string \| null) => string`                       | 6           |
| `STRINGS.place.ownReportNote`        | `(tallySummary: string) => string`                                                          | 6           |
| `STRINGS.report.stepOf`              | `(position: number, total: number) => string` — `"Step 2 of 4"`                             | 7           |
| `STRINGS.report.stepOfWithTitle`     | `(position: number, total: number, title: string) => string` — `"Step 2 of 4 — Attributes"` | 7           |
| `STRINGS.report.continueToLabel`     | `(title: string) => string` — `"Continue to Attributes"`                                    | 7           |
| `STRINGS.report.stepTitles`          | `{ category: string; attributes: string; notes: string; confirm: string }`                  | 7           |
| `STRINGS.profile.navRowLabel`        | `(title: string, subtitle: string \| null) => string`                                       | 8           |
| `STRINGS.profile.profilePhotoLabel`  | `(displayName: string \| null) => string`                                                   | 8           |
| `STRINGS.profile.needsCategoryLabel` | `(categoryName: string, count: number, selected: boolean) => string`                        | 8           |

A `null` argument means "this piece of the sentence is absent", and the function must return the sentence **without** the joining comma or separator — not with a dangling one. That is the whole class of bug these exist to prevent.

Each of these gets an exact-output test in `apps/mobile/constants/strings.test.ts`, added by the task that creates it.

`stepTitles` is the only non-function/scalar group. `StepIndicator.tsx` re-annotates it as `Record<ReportStep, string>`, which preserves the _missing-key_ `tsc` error the file's comment at lines 10–16 relies on. It does **not** preserve the excess-key check (the assignment site is not a fresh literal). That is the accepted trade; note it in the file's comment.

**`plural` and US-22.** Sinhala and Tamil are not one/many languages. This helper hardcodes the English rule, and its doc comment must say so and point at US-22, so nobody reads this file as a claim that pluralisation is solved. The honest framing for the EDI checklist is: _string location is solved; pluralisation and date formatting are US-22._

---

## Task 1: `strings.ts` core namespaces and the guard test

**Files:**

- Create: `apps/mobile/constants/strings.ts`
- Create: `apps/mobile/constants/strings.test.ts`
- Create: `apps/mobile/constants/strings-guard.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `STRINGS.common`, `STRINGS.navigation`, `STRINGS.permissions`, `STRINGS.announcements`, `plural()`, and the namespace _type names_ the later tasks extend. Every later task imports `{ STRINGS }` from `@/constants/strings`. `strings.test.ts` is extended by Tasks 5, 6, 7 and 8, one `describe` block per composed label they add.

- [ ] **Step 1: Write the failing guard test**

Create `apps/mobile/constants/strings-guard.test.ts`. It is a ratchet, so it must **pass on creation** — the allowlist it ships with covers the current tree exactly. Its value is that it fails on task N+1's _new_ code.

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const MOBILE_ROOT = join(__dirname, "..");
const SCAN_ROOTS = ["app", "components", "hooks", "utils"];

/** Deliberate non-copy, per "What Deliberately Does Not Move". These are
 *  dev-only paths or files with no user-facing copy. Everything else in
 *  apps/mobile is scanned — including the map components, which are live on
 *  origin/main. */
const EXCLUDED = new Set([
  "components/debug",
  "app/debug",
  "data/mock-data.ts",
  "hooks/use-screen-reader.ts",
]);

/** Props whose values are copy a user or a screen reader receives. */
const COPY_PROPS = [
  "accessibilityLabel",
  "accessibilityHint",
  "placeholder",
  "errorMessage",
  "actionLabel",
];

/** `file -> literals allowed to stay inline there`. Keyed by value, never by
 *  line number, so editing a file does not silently re-permit a string. */
const ALLOWED: Record<string, string[]> = {/* fill from Step 2 */};

// tests:
//  "flags no unlisted inline copy literal" — for each covered file, every
//    literal found in a COPY_PROP is either absent (a STRINGS reference) or
//    listed in ALLOWED[file].
//  "ALLOWED has no entry for a file that no longer needs it" — fails if
//    ALLOWED names a file with zero actual violations, so the allowlist
//    cannot quietly grow into a blanket.
//  "strings.ts has no runtime imports" — reads constants/strings.ts, asserts
//    no line matches /^import (?!type)/ . (Global Constraint 1)
```

- [ ] **Step 2: Run the test to verify the mechanism works**

Run: `bun run --filter mobile test`
Expected: PASS (5 existing files) or FAIL listing every file whose allowlist is still empty. Either outcome confirms the walker runs. If it passes with an empty `ALLOWED`, the walker is not detecting anything — fix it before continuing.

- [ ] **Step 3: Write the failing test for `plural` and `countLabel`**

In `apps/mobile/constants/strings.test.ts`, add a `describe("plural")` block. This is Review Focus line 1, so the exact values are pinned:

```ts
describe("plural", () => {
  it("picks the singular for exactly 1", () => {
    expect(plural(1, "need", "needs")).toBe("need");
  });
  it("picks the plural for 0 — English treats zero as plural", () => {
    expect(plural(0, "need", "needs")).toBe("needs");
  });
  it("picks the plural for 2 and above", () => {
    expect(plural(2, "need", "needs")).toBe("needs");
    expect(plural(7, "need", "needs")).toBe("needs");
  });
});

describe("STRINGS.common.countLabel", () => {
  it("reads '1 need'", () => {
    expect(STRINGS.common.countLabel(1, "need")).toBe("1 need");
  });
  it("reads '0 needs' and '3 needs'", () => {
    expect(STRINGS.common.countLabel(0, "need")).toBe("0 needs");
    expect(STRINGS.common.countLabel(3, "need")).toBe("3 needs");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `bun run --filter mobile test`
Expected: FAIL — `strings.ts` does not exist yet, so the import fails.

- [ ] **Step 5: Create `constants/strings.ts` with `common`, `navigation`, `permissions`, `announcements`**

Header comment, then the four namespaces. Pin these exact values:

```ts
/** English one/many only. Sinhala and Tamil do not use this rule; US-22
 *  replaces this with a locale lookup. Not a pluralisation solution. */
export function plural(count: number, one: string, other: string) {
  return count === 1 ? one : other;
}
```

- `common`: `appName: "Wayble"`, `tagline: "Find a better way to get there."`, `back: "Back"`, `cancel: "Cancel"`, `save: "Save"`, `next: "Next"`, `close: "Close"`, `retry: "Retry"`, `signIn: "Sign In"`, `signUp: "Sign Up"`, `createAccount: "Create account"`, `guest: "Guest"`, `user: "User"`, `loading: "Loading"`, `loadingEllipsis: "Loading…"`, `none: "None"`, `other: "Other"`, `chevron: "›"`.
- `common.countLabel(count: number, noun: string): string` → `` `${count} ${plural(count, noun, `${noun}s`)}` ``. Used by `3 confirmed`, `1 report`, `2 attributes`.
- `navigation`: `tabs: { home: "Home", map: "Map", profile: "Profile", settings: "Settings" }`; `titles: { debug: "Debug", placeDetails: "Place Details", reportAccessibility: "Report accessibility", allPlaces: "All places", reports: "Reports", notifications: "Notifications", accessibilityNeeds: "Accessibility Needs", notFound: "Not Found" }`; `back: "Back"`.
- `permissions`: `location: { title: "Location Access", granted: "Granted", denied: "Denied", undetermined: "Undetermined", openSettings: "Open Settings", enable: "Enable", enableLocation: "Enable Location", openSettingsForLocation: "Open settings for location" }`; `notification: { channelName: "Nearby verification requests" }`; `os: { locationWhenInUse: "Wayble needs your location to show accessible places near you." }` (`os.locationWhenInUse` is read by `app.config.ts` in Task 10).
- `announcements`: the `AccessibilityInfo.announceForAccessibility` payloads, keyed by call site — `welcome: "Welcome to Wayble…"`, `reportSubmitted: "Report submitted. Thank you."`, `reportConfirmed: "Report confirmed."`, `reportDisputed: "Report disputed."`, `stepOf(position, total, title)` (same shape as `report.stepOfWithTitle`), `needsCleared: "All accessibility needs cleared."`.

**`navigation.titles.accessibilityNeeds` is `"Accessibility Needs"` (title case), matching the existing `_layout.tsx` string, not the body text. Global Constraint 2 — move it verbatim. Finding 3 records the inconsistency.**

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun run --filter mobile test`
Expected: PASS, with the `plural` and `countLabel` cases green.

- [ ] **Step 7: Verify the module is importable and the gates are green**

Run: `bun run check-types && bun run --filter mobile test && bun run format:check`
Expected: `tsc` clean (it proves zero-import holds and nothing else broke), all tests pass, prettier clean.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/constants/strings.ts apps/mobile/constants/strings.test.ts apps/mobile/constants/strings-guard.test.ts
git commit -m "feat(i18n): add constants/strings.ts with core namespaces and a guard test"
```

---

## Task 2: Shell and navigation

**Files:**

- Modify: `apps/mobile/app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/mapbox/_layout.tsx`, `app/(tabs)/profile/_layout.tsx`, `app/(tabs)/settings/_layout.tsx`, `app/(tabs)/mapbox/index.tsx`

**Interfaces:**

- Consumes: `STRINGS.navigation`, `STRINGS.common`, `STRINGS.permissions`, `STRINGS.announcements`, `plural`, `STRINGS.common.countLabel`.
- Produces: nothing new. `app/(tabs)/_layout.tsx` gains `import { STRINGS } from "@/constants/strings"`.

- [ ] **Step 1: Replace the four tab labels**

In `app/(tabs)/_layout.tsx`, each `<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>` becomes `<NativeTabs.Trigger.Label>{STRINGS.navigation.tabs.home}</NativeTabs.Trigger.Label>`, and likewise `map`, `profile`, `settings`.

- [ ] **Step 2: Replace the route and stack titles**

- `app/_layout.tsx`: `title: "Debug"` → `STRINGS.navigation.titles.debug`; `"Place Details"` → `.placeDetails`; `"Report accessibility"` → `.reportAccessibility`.
- `app/(tabs)/mapbox/_layout.tsx`: `.placeDetails`, and `headerBackTitle: "Back"` → `STRINGS.navigation.back`.
- `app/(tabs)/profile/_layout.tsx`: `title: "Accessibility Needs"` → `.accessibilityNeeds`.
- `app/(tabs)/settings/_layout.tsx`: `title: "Notifications"` → `.notifications`.

`"Place Details"` currently appears in `app/_layout.tsx` and `app/(tabs)/mapbox/_layout.tsx`, and `"Report accessibility"` in `app/_layout.tsx` and `app/report/[placeId].tsx`. One key each, all four sites.

- [ ] **Step 3: Replace the two copy literals in `app/index.tsx` and `app/(tabs)/mapbox/index.tsx`**

`accessibilityLabel="Loading, please wait"` → `STRINGS.common.loadingWait` (add `loadingWait: "Loading, please wait"` to `common` in this step). `placeholder="Search accessible places…"` and `"No places found nearby."` → `STRINGS.map.searchPlaceholder` and `STRINGS.map.emptyNearby`.

- [ ] **Step 4: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/_layout.tsx" "apps/mobile/app/index.tsx" "apps/mobile/app/(tabs)/_layout.tsx" "apps/mobile/app/(tabs)/mapbox/_layout.tsx" "apps/mobile/app/(tabs)/profile/_layout.tsx" "apps/mobile/app/(tabs)/settings/_layout.tsx" "apps/mobile/app/(tabs)/mapbox/index.tsx" apps/mobile/constants/strings.ts
git commit -m "refactor(mobile): read navigation titles and tab labels from constants/strings"
```

**Note:** `app/(tabs)/mapbox/index.tsx` is in this commit _and_ carries the user's pre-existing uncommitted WIP (it removed the Mapbox view). `git add` on that path stages the WIP too. **Stop and ask Pasindu before running this command** — the safe alternative is to leave the file out of this task's commit and do it in a follow-up, or to have him confirm staging it.

---

## Task 3: Auth and onboarding

**Files:**

- Modify: `apps/mobile/app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `app/onboarding.tsx`

**Interfaces:**

- Consumes: `STRINGS.auth`, `STRINGS.common`, `STRINGS.announcements`.
- Produces: `STRINGS.auth.signIn.*`, `STRINGS.auth.signUp.*`, `STRINGS.onboarding.*`, `STRINGS.errors.auth.*`.

- [ ] **Step 1: Add the `auth` and `onboarding` namespaces**

`signIn` keeps its four validation messages, both `error.message` match literals, `placeholder`s, heading, subtitle, button, and footer pair. `signUp` adds the password rules; the min-length message is a function:

```ts
passwordTooShort: (min: number) =>
  `Password must be at least ${min} characters.`;
```

The two server-message matchers in these files (`"Invalid email or password..."`-style `includes()` checks) classify backend errors. Confirm per file whether the matched literal is a backend throw or a local comparison before moving it; if it is a backend throw, it stays put per "What Deliberately Does Not Move" and the classification switches on a new `STRINGS.errors.auth` key instead. Read the file, do not assume.

- [ ] **Step 2: Refactor `sign-in.tsx` and `sign-up.tsx`**

Every literal becomes its `STRINGS.auth.*` reference. `AppText` body, `placeholder`, `accessibilityLabel`, `accessibilityHint` all move. Keep the surrounding logic and every `error.message` branch identical.

- [ ] **Step 3: Refactor `onboarding.tsx`**

15 literals including the tagline, the three benefit lines, `"Get Started"`, `"Explore map as guest →"`, `"I already have an account. Sign in"`, and the `announceForAccessibility` welcome payload. The three benefit lines become three named scalar leaves — `STRINGS.onboarding.benefitRoutes`, `.benefitGuides`, `.benefitReports` — because leaf rule 1 forbids an array leaf. If the component currently renders those three as a mapped array, keep the array local to the component and map over `[STRINGS.onboarding.benefitRoutes, STRINGS.onboarding.benefitGuides, STRINGS.onboarding.benefitReports]`. If it renders three separate `<AppText>` elements, leave the structure alone.

- [ ] **Step 4: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(auth)/sign-in.tsx" "apps/mobile/app/(auth)/sign-up.tsx" "apps/mobile/app/onboarding.tsx" apps/mobile/constants/strings.ts
git commit -m "refactor(mobile): read auth and onboarding copy from constants/strings"
```

---

## Task 4: Home

**Files:**

- Modify: `app/(tabs)/home/index.tsx`, `components/home/{HomeHeader,SearchEntry,QuickActionCard,SectionHeader,CategoryShortcuts,HomeNearbySection}.tsx`

**Interfaces:**

- Consumes: `STRINGS.home`, `STRINGS.common`, `STRINGS.common.countLabel`, `STRINGS.permissions`.
- Produces: `STRINGS.home.*` including `STRINGS.home.a11y.*` and the two composed labels `profileGreeting(greeting, displayName)` and `needsCategoryLabel(...)` is _not_ here (that is profile — Task 8).

- [ ] **Step 1: Add the `home` namespace**

`STRINGS.home` carries the three section titles, the two quick-action labels plus their a11y label/hint pairs, `"See all"`, the `"Wayble home"` scroll label, `searchPlaceholder`, and the six `HomeNearbySection` states (`locationNeededTitle`, `enableLocationBody`, `findingNearby`, `emptyNearby`, `openMapLabel`, `openMapButton`).

- [ ] **Step 2: Move `profileGreeting` into `STRINGS.home`**

`HomeHeader.tsx:22-25` builds `` `${getTimeGreeting()}, ${displayName}` `` or falls back to `"Welcome to Wayble"`. It becomes `STRINGS.home.profileGreeting(greeting, displayName)` and `STRINGS.home.greetingFallback`. `"Wayble logo"` and `"Find a better way to get there."` become `STRINGS.home.a11y.logo` and `STRINGS.common.tagline` (the tagline already exists from Task 1 — reuse it, do not add a second).

- [ ] **Step 3: Refactor the six components and the screen**

`QuickActionCard` and `SectionHeader` are fully prop-driven and take no literals; read them to confirm, and skip the edit if so. `CategoryShortcuts` takes `"Opens map filtered by this category"` → `STRINGS.home.a11y.categoryShortcutHint`; it keeps importing `CATEGORY_LABELS`/`CATEGORY_COLORS` from `CategoryFilter` until Task 5 moves the labels.

- [ ] **Step 4: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(tabs)/home/index.tsx" apps/mobile/components/home apps/mobile/constants/strings.ts
git commit -m "refactor(mobile): read home screen copy from constants/strings"
```

---

## Task 5: Map

**Files:**

- Modify: `components/map/CategoryFilter.tsx`, `SearchBar.tsx`, `PlaceListItem.tsx`, `LocationPermissionBanner.tsx`, `DetailSheet.tsx`, `LocateButton.tsx`, `ViewModeToggle.tsx`, `AccessibilityPin.tsx`, `app/(tabs)/mapbox/place/[id].tsx`

**Interfaces:**

- Consumes: `STRINGS.map`, `STRINGS.permissions`, `STRINGS.common`.
- Extends: `apps/mobile/constants/strings.test.ts` with a `describe("STRINGS.map")` block.
- Produces: `STRINGS.map.categoryLabels` (the 5 `"All places" | "Wheelchair Accessible" | "Elevator" | "Accessible Bathroom" | "Multiple Features"` labels, moved out of `CategoryFilter.tsx`). `CATEGORY_COLORS` and `CATEGORY_EMOJIS` stay in `CategoryFilter.tsx` — they are colour and iconography.

- [ ] **Step 1: Move `CATEGORY_LABELS` to `STRINGS.map.categoryLabels` and repoint its five importers**

Export `categoryLabels` from `strings.ts`. Update the importers found by:

```
grep -rn "CATEGORY_LABELS" apps/mobile --include=*.tsx --include=*.ts
```

Expected importers: `components/map/CategoryFilter.tsx`, `components/map/AccessibilityPin.tsx`, `components/map/DetailSheet.tsx`, `app/(tabs)/mapbox/place/[id].tsx`, `components/home/CategoryShortcuts.tsx`. All five get edited in this task, so update each import to read `STRINGS.map.categoryLabels` directly and delete the `CATEGORY_LABELS` export from `CategoryFilter.tsx` entirely. Do **not** leave a re-export: five call sites in one task is a smaller change than a shim plus five call sites, and a shim would be one more name the "one module" claim has to explain. `CATEGORY_COLORS` and `CATEGORY_EMOJIS` stay in `CategoryFilter.tsx`.

- [ ] **Step 2: Write the failing tests for the composed labels**

Add a `describe("STRINGS.map")` block to `apps/mobile/constants/strings.test.ts`. This is Review Focus line 2 — the exact output is the test, so a lost comma or a lost "away" fails here:

```ts
describe("STRINGS.map", () => {
  it("placeRowLabel keeps the comma and the word 'away'", () => {
    expect(STRINGS.map.placeRowLabel("Cafe", "food_and_drink", "450m")).toBe(
      "Cafe, food_and_drink, 450m away",
    );
  });
  it("placeRowLabel drops the distance clause when there is none", () => {
    expect(STRINGS.map.placeRowLabel("Cafe", "food_and_drink", null)).toBe(
      "Cafe, food_and_drink",
    );
  });
  it("searchResultLabel omits absent clauses without a dangling comma", () => {
    expect(STRINGS.map.searchResultLabel("Cafe", "450m", null)).toBe(
      "Cafe, 450m",
    );
    expect(STRINGS.map.searchResultLabel("Cafe", null, "ramp, lift")).toBe(
      "Cafe, features: ramp, lift",
    );
    expect(STRINGS.map.searchResultLabel("Cafe", null, null)).toBe("Cafe");
  });
  it("categoryLabel prefixes the category", () => {
    expect(STRINGS.map.categoryLabel("Retail")).toBe("Category: Retail");
  });
  it("categoryAnnounce reads the accessible/not-accessible form", () => {
    expect(STRINGS.map.categoryAnnounce("Retail", true)).toBe(
      "Retail accessible",
    );
    expect(STRINGS.map.categoryAnnounce("Retail", false)).toBe("Retail");
  });
});
```

- [ ] **Step 3: Add the composed labels to `STRINGS.map`**

- `placeRowLabel(name, category, distance)` — reproduces `PlaceListItem.tsx:31` exactly: `` `${name}, ${category}${distance ? `, ${distance} away` : ""}` ``. `distance` is `null` when absent.
- `searchResultLabel(name, distanceText, features)` — reproduces `SearchBar.tsx:101-108` exactly: `` `${name}${distanceText ? `, ${distanceText}` : ""}${features ? `, features: ${features}` : ""}` ``.
- `categoryLabel(label)` — reproduces `CategoryBadge` / `mapbox/place/[id].tsx:107` `` `Category: ${label}` ``.
- `categoryAnnounce(label, accessible)` — reproduces `` `${cat} accessible` `` with `accessible: false` returning `label` alone. Confirm the current `false` branch by reading the file; the test above encodes what you find, and if it differs, fix the test to match the file (Global Constraint 2) and note it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run --filter mobile test`
Expected: PASS, including the new `STRINGS.map` cases.

- [ ] **Step 5: Refactor the four components and the map place screen**

`SearchBar`'s `placeholder = "Search places..."` default prop → `STRINGS.map.searchPlaceholderShort` (note: this default differs from the home entry's `"Search accessible places…"` — two keys, do not merge). `LocationPermissionBanner`'s two body sentences including the wrong "(Bangalore)" — **verbatim, Finding 1**. `mapbox/place/[id].tsx`'s 10 literals.

- [ ] **Step 6: Refactor the four live-but-map-bound components**

`DetailSheet.tsx` 9, `ViewModeToggle.tsx` 3, `LocateButton.tsx` 3, `AccessibilityPin.tsx` 2. These are live on `origin/main` (see the correction note) even though the uncommitted WIP has orphaned them. They also duplicate the emoji table that `CategoryFilter` owns — `CATEGORY_EMOJIS`-style local tables. Consolidate them onto `CategoryFilter`'s existing emoji map and `STRINGS.map.categoryLabels`; do not create a fourth copy.

`DetailSheet` imports `type AccessibleLocation` from `../../data/mock-data`. That import stays. If `mock-data.ts` turns out to be a large fixture, say so in the commit body rather than deleting it — removing it is out of scope.

- [ ] **Step 7: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean. `tsc` is the check that every `CATEGORY_LABELS` importer was repointed — a missed one fails here, not at runtime.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/components/map "apps/mobile/app/(tabs)/mapbox/place/[id].tsx" apps/mobile/constants/strings.ts apps/mobile/constants/strings.test.ts
git commit -m "refactor(mobile): read map copy from constants/strings and centralise category labels"
```

`git add apps/mobile/components/map` is a directory. Confirm it contains only the eight map files and no fixtures before committing: `git status --short apps/mobile/components/map`.

---

## Task 6: Place detail and verification

**Files:**

- Modify: `app/place/[id]/index.tsx`, `app/place/[id]/reports.tsx`, `components/place/{AttributeGroup,AttributeRow,CategoryBadge,NoDataPrompt,ReportCard,VerifyControl,verification-errors,verification-tally}.ts(x)`

**Interfaces:**

- Consumes: `STRINGS.place`, `STRINGS.common`, `STRINGS.common.countLabel`, `STRINGS.announcements`.
- Extends: `apps/mobile/constants/strings.test.ts` with a `describe("STRINGS.place")` block.
- Produces: `STRINGS.place.detail.*`, `STRINGS.place.reports.*`, `STRINGS.errors.verification.*`. **`verification-tally.ts` and `verification-errors.ts` keep their existing exports unchanged** — `tallySummary`, `applyVerdictChange`, `isOwnReport`, `classifyVerificationError`, `verificationErrorMessage` keep their exact signatures and return values.

- [ ] **Step 1: Move the two formatters' text into `STRINGS` without changing their output**

`verification-tally.ts:37,40` currently returns `"No verifications yet"`, `` `${confirmCount} confirmed` ``, `` `${disputeCount} disputed` `` joined by `" · "`. Change the bodies to read from `STRINGS.place.verification.*`; keep the `" · "` separator as a local `const TALLY_SEPARATOR` or as `STRINGS.place.verification.tallySeparator`. **`components/place/verification-tally.test.ts` asserts these strings verbatim and must pass with no edit to it.** This is Review Focus line 3.

`verification-errors.ts`'s `verificationErrorMessage` switch: the four fixed messages and the `noteTooLong` template become `STRINGS.errors.verification.*`, with `noteTooLong: (max: number) => \`Keep your note to ${max} characters or fewer.\``keeping its current wording.`classifyVerificationError` is **not** touched — its matched literals are backend wire protocol.

- [ ] **Step 2: Write the failing tests for the composed labels**

Add a `describe("STRINGS.place")` block to `apps/mobile/constants/strings.test.ts`. Read `AttributeRow.tsx:39` and `ReportCard.tsx:94,133,181` first and encode their **current** output exactly — Global Constraint 2 means the test documents what the app says today, and a later copy change updates the test deliberately rather than silently.

```ts
describe("STRINGS.place", () => {
  it("attributeRowLabel omits the note clause when there is no note", () => {
    expect(STRINGS.place.attributeRowLabel("Ramp", "Available", null)).toBe(
      "Ramp: Available",
    );
  });
  it("attributeRowLabel appends the note after a full stop", () => {
    expect(
      STRINGS.place.attributeRowLabel("Ramp", "Partial", "Slight lip"),
    ).toBe("Ramp: Partial. Note: Slight lip");
  });
  it("ownReportNote names the tally after the restriction", () => {
    expect(STRINGS.place.ownReportNote("2 confirmed")).toBe(
      "You can't verify your own report · 2 confirmed",
    );
  });
});
```

- [ ] **Step 3: Add the three composed labels to `STRINGS.place`**

- `attributeRowLabel(label, valueLabel, note)` — reproduces `AttributeRow.tsx:39` exactly.
- `reportCardLabel(label, valueLabel, note)` — reproduces `ReportCard.tsx:94,133` exactly. It has the same shape as `attributeRowLabel`; if reading the file shows the two produce identical strings, keep one function and have both call sites use it. Note it in the commit body.
- `ownReportNote(tallySummary)` — reproduces `` `You can't verify your own report · ${tallySummary}` ``, taking the already-formatted `tallySummary()` string so it does not re-derive the counts.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run --filter mobile test`
Expected: PASS, including the new `STRINGS.place` cases and the two **unmodified** formatter suites.

- [ ] **Step 5: Refactor the screens and components**

`app/place/[id]/index.tsx` 15 literals, `app/place/[id]/reports.tsx` 10 literals (including the `"report"`/`"reports"` plural pair and `"Sign in to verify a report"`), plus `NoDataPrompt` (7), `ReportCard` (5), `VerifyControl` (4: `"Confirmed"`, `"Disputed"`, and their two action labels), `CategoryBadge` (1), `AttributeRow` (1), `AttributeGroup` (0 — read and confirm). `PLACE_CATEGORY_LABELS` keeps its import from `constants/accessibility-metadata`.

- [ ] **Step 6: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean, **and `components/place/verification-tally.test.ts` and `components/place/verification-errors.test.ts` unmodified** — `git status` shows them untouched.

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/app/place/[id]/index.tsx" "apps/mobile/app/place/[id]/reports.tsx" apps/mobile/components/place apps/mobile/constants/strings.ts
git commit -m "refactor(mobile): read place detail and verification copy from constants/strings"
```

---

## Task 7: Report wizard

**Files:**

- Modify: `app/report/[placeId].tsx`, `components/report/{StepIndicator,CategoryStep,AttributesStep,NotesStep,ConfirmStep,report-errors,report-draft}.ts(x)`

**Interfaces:**

- Consumes: `STRINGS.report`, `STRINGS.common`, `STRINGS.common.countLabel`, `STRINGS.announcements`.
- Extends: `apps/mobile/constants/strings.test.ts` with a `describe("STRINGS.report")` block.
- Produces: `STRINGS.report.*`; `STRINGS.errors.report.*`. **`stepTitle(step, fallback?)` keeps its exact signature and stays exported from `StepIndicator.tsx`**, because `app/report/[placeId].tsx` imports it at line 26 and its out-of-range fallback is load-bearing (documented at `StepIndicator.tsx:25-33`).

- [ ] **Step 1: Move `STEP_TITLES` and re-annotate it**

In `StepIndicator.tsx`, replace the literal with:

```ts
const STEP_TITLES: Record<ReportStep, string> = STRINGS.report.stepTitles;
```

and keep `stepTitle` reading `STEP_TITLES`. Update the comment at lines 10–16 to state the actual guarantee: a **missing** key is a `tsc` error; an extra key is not, because the assignment site is not a fresh literal. `REPORT_STEPS.length` stays in `StepIndicator` — do not move it (Global Constraint 1 and the file's own reasoning).

- [ ] **Step 2: Write the failing tests for the wizard templates**

Add a `describe("STRINGS.report")` block to `apps/mobile/constants/strings.test.ts`. Note the em dash in `stepOfWithTitle` — it is a real character in the current output, and swapping it for a hyphen is the kind of silent change this task must not make:

```ts
describe("STRINGS.report", () => {
  it("stepOf states the position and the total", () => {
    expect(STRINGS.report.stepOf(2, 4)).toBe("Step 2 of 4");
  });
  it("stepOfWithTitle joins with an em dash, not a hyphen", () => {
    expect(STRINGS.report.stepOfWithTitle(2, 4, "Attributes")).toBe(
      "Step 2 of 4 — Attributes",
    );
  });
  it("continueToLabel names the step it advances to", () => {
    expect(STRINGS.report.continueToLabel("Attributes")).toBe(
      "Continue to Attributes",
    );
  });
  it("stepTitles covers every ReportStep", () => {
    expect(Object.keys(STRINGS.report.stepTitles).sort()).toEqual([
      "attributes",
      "category",
      "confirm",
      "notes",
    ]);
  });
});
```

- [ ] **Step 3: Add the four wizard templates and the two limit functions**

`stepOf(position, total)`, `stepOfWithTitle(position, total, title)`, `continueToLabel(title)`, `stepTitles`. Plus `summaryLimit: (max) => \`Optional. Up to ${max} characters.\``, `charactersLeft: (remaining, max) => \`${remaining} of ${max} characters left\``, `noteRequiredFor: (count, categories) => …`(reproduces`AttributesStep.tsx:115`'s long `describeOutstanding`template verbatim),`outstandingNoteFor: (count, category, pronoun) => …`.

`stepTitles` has exactly four keys matching the `ReportStep` union — `category`, `attributes`, `notes`, `confirm` — and the test above pins the key set so a renamed step id fails here as well as at the `Record<ReportStep, string>` annotation.

- [ ] **Step 4: Move `report-errors.ts`'s text without changing its classification**

The five `reportErrorMessage` returns become `STRINGS.errors.report.*`, with `summaryTooLong: (max: number) => \`Keep your summary to ${max} characters or fewer.\``. `classifyReportError`is **not** touched.`report-draft.ts` has no copy and needs no edit — read it to confirm.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bun run --filter mobile test`
Expected: PASS, including the new `STRINGS.report` cases and the **unmodified** `components/report/report-errors.test.ts`.

- [ ] **Step 6: Refactor the five components and the wizard route**

`app/report/[placeId].tsx` 14 literals including the three duplicate `"Report accessibility"` titles and the `Continue to …` a11y label at line 381. `CategoryStep` 6, `AttributesStep` 12 (the densest file — the `describeOutstanding` template and the `clear this value` / `set this value` ternary pair are the risk), `NotesStep` 7, `ConfirmStep` 8.

- [ ] **Step 7: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean, and `components/report/report-errors.test.ts` unmodified.

- [ ] **Step 8: Commit**

```bash
git add "apps/mobile/app/report/[placeId].tsx" apps/mobile/components/report apps/mobile/constants/strings.ts apps/mobile/constants/strings.test.ts
git commit -m "refactor(mobile): read report wizard copy from constants/strings"
```

---

## Task 8: Profile

**Files:**

- Modify: `app/(tabs)/profile/index.tsx`, `app/(tabs)/profile/accessibility-needs.tsx`, `components/profile/{ProfileHeader,ProfileNavRow,ProfileAvatar,GuestProfilePrompt,EditDisplayNameModal,NeedsCategorySection}.tsx`

**Interfaces:**

- Consumes: `STRINGS.profile`, `STRINGS.common`, `STRINGS.common.countLabel`, `STRINGS.errors`.
- Extends: `apps/mobile/constants/strings.test.ts` with a `describe("STRINGS.profile")` block.
- Produces: `STRINGS.profile.*`, `STRINGS.common.needsSummary*` where shared with `utils/get-accessibility-needs-summary.ts` (Task 10 — Task 8 defines the keys, Task 10 points the util at them).

- [ ] **Step 1: Write the failing tests for the composed labels**

Add a `describe("STRINGS.profile")` block to `apps/mobile/constants/strings.test.ts`:

```ts
describe("STRINGS.profile", () => {
  it("navRowLabel joins title and subtitle with a full stop", () => {
    expect(
      STRINGS.profile.navRowLabel("Reports", "For places you follow"),
    ).toBe("Reports. For places you follow");
  });
  it("navRowLabel returns the title alone when there is no subtitle", () => {
    expect(STRINGS.profile.navRowLabel("Sign Out", null)).toBe("Sign Out");
  });
  it("profilePhotoLabel names the person, or the default avatar", () => {
    expect(STRINGS.profile.profilePhotoLabel("Nimal")).toBe(
      "Profile photo for Nimal",
    );
    expect(STRINGS.profile.profilePhotoLabel(null)).toBe(
      "Default profile avatar",
    );
  });
  it("needsCountLabel matches the util it replaces", () => {
    expect(STRINGS.profile.needsCountLabel(0)).toBe("0 needs selected");
    expect(STRINGS.profile.needsCountLabel(1)).toBe("1 need selected");
    expect(STRINGS.profile.needsCountLabel(4)).toBe("4 needs selected");
  });
});
```

The `profilePhotoLabel(null)` and `navRowLabel(title, null)` cases are the ones a mechanical extraction gets wrong — they are the "clause is absent" paths, and they must not emit a dangling separator.

- [ ] **Step 2: Add the composed labels**

- `navRowLabel(title, subtitle)` — `ProfileNavRow.tsx:26` `` `${title}. ${subtitle}` ``, and `subtitle: null` returns `title` alone.
- `profilePhotoLabel(displayName)` — `ProfileAvatar.tsx:27` `` `Profile photo for ${displayName}` ``, with `displayName: null` → `STRINGS.profile.a11y.defaultAvatar`.
- `needsCategoryLabel(categoryName, count, selected)` — `NeedsCategorySection.tsx:80` `` `${categoryName} need. Double tap to ${selected ? "remove from" : "add to"} your accessibility needs.` `` plus the count suffix `` ` · ${count} selected` ``. Note the file's existing capitalisation differs from `getAccessibilityNeedsSummary`'s `"${count} need${s} selected"` — two distinct keys, both verbatim.

- [ ] **Step 3: Add the `profile` namespace**

Two duplicates get shared keys here and are reused in Task 10: `needsNotSet: "Not set yet"`, `signInToSetNeeds: "Sign in to set your needs"`, `needsCountLabel(count)` (matching `get-accessibility-needs-summary.ts:13`). `accessibilityNeedsTitle: "Accessibility needs"` (sentence case — the body text, distinct from `navigation.titles.accessibilityNeeds` in Task 1).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run --filter mobile test`
Expected: PASS, including the new `STRINGS.profile` cases.

- [ ] **Step 5: Refactor the two screens and six components**

`accessibility-needs.tsx` 11 literals including the two save-failure messages, which are **duplicated** in `settings/notifications.tsx` — use one shared key under `STRINGS.errors.saveFailed`, reused in Task 9. `EditDisplayNameModal` 9. `GuestProfilePrompt` 6 (note the deliberate a11y-label-vs-button case difference: `"Sign in"` as a label, `"Sign In"` as a button — two keys).

- [ ] **Step 6: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/app/(tabs)/profile/index.tsx" "apps/mobile/app/(tabs)/profile/accessibility-needs.tsx" apps/mobile/components/profile apps/mobile/constants/strings.ts apps/mobile/constants/strings.test.ts
git commit -m "refactor(mobile): read profile copy from constants/strings"
```

---

## Task 9: Settings

**Files:**

- Modify: `app/(tabs)/settings/index.tsx`, `app/(tabs)/settings/notifications.tsx`

**Interfaces:**

- Consumes: `STRINGS.settings`, `STRINGS.permissions`, `STRINGS.errors`, `STRINGS.common`, `STRINGS.profile`.
- Produces: `STRINGS.settings.*`. These two files are the densest single screen at 37 literals.

- [ ] **Step 1: Add the `settings` namespace**

Sections `account`, `accessibility`, `theme` (`"Dark"` / `"Light"` / `"Current theme"` / the follows-device sentence), `location` (status words and buttons), `developer`. Reuse `STRINGS.profile.accessibilityNeedsTitle`, `STRINGS.permissions.location.*`, and the shared `STRINGS.errors.saveFailed` from Task 8 rather than re-declaring. The `` `Role: ${…}` `` and `` `Theme: ${mode}` `` templates become functions `roleLabel(role)` and `themeLabel(mode)`.

- [ ] **Step 2: Refactor `settings/index.tsx`**

8 `accessibilityLabel` and 2 `accessibilityHint` sites. Two a11y labels are **identical** to profile's (`"Opens the screen where you choose the accessibility features you need"` at lines 110 and in `profile/index.tsx:112`) — one shared key.

- [ ] **Step 3: Refactor `settings/notifications.tsx`**

16 literals: the three radius labels (`"Within 500 m"` / `"Within 2 km"` / `"Within 5 km"`), the sign-in gate copy, the toggle row, the `"How close"` / `"What we store"` sections, the long privacy paragraph, and the three error messages. Two of the error messages are the `STRINGS.errors.saveFailed` duplicates from Task 8.

- [ ] **Step 4: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(tabs)/settings/index.tsx" "apps/mobile/app/(tabs)/settings/notifications.tsx" apps/mobile/constants/strings.ts
git commit -m "refactor(mobile): read settings copy from constants/strings"
```

---

## Task 10: Hooks, utils, and the Expo config

**Files:**

- Modify: `hooks/use-push-registration.ts`, `hooks/use-location-permission.ts`, `utils/{get-time-greeting,get-accessibility-needs-summary,format-relative-time,format-distance}.ts`, `app.config.ts`

**Interfaces:**

- Consumes: `STRINGS.common`, `STRINGS.errors`, `STRINGS.profile`, `STRINGS.permissions`.
- Produces: nothing new; all four utils keep their **exact current signatures and return values**.

- [ ] **Step 1: Point the four utils at `STRINGS` without changing a byte of output**

| File                                 | Current output                                                                                            | Becomes                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `get-time-greeting.ts`               | `"Good morning"` / `"Good afternoon"` / `"Good evening"`                                                  | `STRINGS.common.greetingMorning` / `…Afternoon` / `…Evening`                    |
| `get-accessibility-needs-summary.ts` | `"Sign in to set your needs"` / `"Not set yet"` / `` `${count} need${count === 1 ? "" : "s"} selected` `` | `STRINGS.profile.signInToSetNeeds` / `.needsNotSet` / `.needsCountLabel(count)` |
| `format-relative-time.ts`            | `"just now"` / `` `${n} min ago` `` / `` `${n} h ago` `` / `` `${n} d ago` `` / `` `${n} w ago` ``        | `STRINGS.common.relativeTime.*` as five `(n) => string` leaves                  |
| `format-distance.ts`                 | `` `${m}m` `` / `` `${km}km` ``                                                                           | `STRINGS.common.distanceMetres(m)` / `.distanceKilometres(km)`                  |

**`utils/format-relative-time.test.ts` asserts all five of those strings verbatim and must pass with no edit to it.** This is Review Focus line 3. `format-distance.ts`'s `m`/`km` suffixes are unit abbreviations, not prose — but they are user-visible and locale-dependent, so they move, with a comment that US-22 owns unit formatting.

- [ ] **Step 2: Move the two hooks' strings and the OS-visible strings**

- `use-push-registration.ts:15`: channel **name** `"Nearby verification requests"` → `STRINGS.permissions.notification.channelName`. The channel **id** `"verify-nearby"` stays. Note in a comment that the name is OS-visible and therefore user-facing; the id is not.
- `use-location-permission.ts`: the three `errorMsg` strings → `STRINGS.errors.location.*` (Finding 4 — the wiring stays dead).
- `app.config.ts:13`: `locationWhenInUsePermission: "Wayble needs your location to show accessible places near you."` → `STRINGS.permissions.os.locationWhenInUse`, via a **relative** import — `import { STRINGS } from "./constants/strings";` — not `@/`, because the Expo config evaluator has no path alias. Add a comment saying so. This is Review Focus line 4: if `strings.ts` ever gains a value import, this is what breaks, at build time.

- [ ] **Step 3: Verify the build path actually still loads**

`tsc` will not catch a broken `app.config.ts`. Run:

```bash
cd apps/mobile && bunx expo config --type introspect > /dev/null && echo "app.config.ts OK"
```

Expected: `app.config.ts OK`. If it throws, `strings.ts` has a runtime import — return to Task 1 Step 3.

- [ ] **Step 4: Run the gates**

Run: `bun run check-types && bun run --filter mobile test && bun run --filter mobile lint && bun run format:check`
Expected: all clean, and `utils/format-relative-time.test.ts` unmodified.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/hooks/use-push-registration.ts apps/mobile/hooks/use-location-permission.ts apps/mobile/utils apps/mobile/app.config.ts apps/mobile/constants/strings.ts
git commit -m "refactor(mobile): read hook, util and OS prompt copy from constants/strings"
```

`git add apps/mobile/utils` is a directory, but it contains only the four utils — no test files and no fixtures — so it is safe. Confirm with `git status --short apps/mobile/utils` before committing.

---

## Task 11: Close the loop — full verification

**Files:**

- Modify: `apps/mobile/constants/strings-guard.test.ts` (allowlist entries only), `apps/mobile/constants/strings.ts` (doc comment only)

**Interfaces:**

- Consumes: everything Tasks 1–10 produced.
- Produces: the `docs/EDI-compliance-checklist.md` input facts for Task 12.

- [ ] **Step 1: Re-run the full suite and record the counts**

```bash
bun run --filter mobile test
bun run check-types
bun run --filter mobile lint
bun run format:check
bun run --filter @packages/backend test
```

Expected: the 73 pre-existing mobile tests still pass, plus the new `strings.test.ts` cases and the two guard cases. Backend still 162 tests across 17 files. All type/lint/format checks clean. Write the actual mobile test count down — Task 12 puts a number in the checklist and it must be real.

- [ ] **Step 2: Confirm no test file was modified**

```bash
git diff --name-only origin/main -- '*.test.ts'
```

Expected: empty **except** the new `apps/mobile/constants/strings-guard.test.ts`. Any other test file in this list is a Global Constraint 4 violation — revert it and fix the source instead.

- [ ] **Step 3: Confirm the pre-existing WIP is still uncommitted**

```bash
git status --short
```

Expected: `apps/mobile/app/(tabs)/mapbox/index.tsx`, `bun.lock` and `docs/traceability.md` still showing as modified-or-untracked, and **not** in any commit on this branch:

```bash
git log --oneline origin/main..HEAD -- bun.lock docs/traceability.md
```

Expected: empty.

- [ ] **Step 4: Prune the guard allowlist**

Delete every `ALLOWED` entry whose file no longer has a violation. The second guard test ("`ALLOWED` has no entry for a file that no longer needs it") should now pass on its own. Leave the deliberate exceptions listed in the step's `EXCLUDED` and the emoji/symbol/console entries.

- [ ] **Step 5: Add the module's doc comment**

At the top of `strings.ts`, state: what the module is for, that it has zero runtime imports _and why_ (readable from `app.config.ts` in Node), that `plural` is English-only and US-22 owns pluralisation and date/number formatting, and which files are intentionally **not** here (`constants/accessibility-metadata.ts`, `packages/backend/convex/notificationCopy.ts`, the debug screens, the four dead map components) with a one-line reason each. This comment is what a marker reads.

- [ ] **Step 6: Run the gates and commit**

```bash
bun run --filter mobile test && bun run check-types && bun run format:check
git add apps/mobile/constants/strings-guard.test.ts apps/mobile/constants/strings.ts
git commit -m "test(i18n): prune the strings guard allowlist and document the module boundary"
```

---

## Task 12: EDI checklist and asset audit

**Files:**

- Create: `docs/EDI-compliance-checklist.md`

**Interfaces:**

- Consumes: the verification facts from Task 11, the 11 rows of `docs/PRD-wayble.md` §6, the asset listing from Step 1.
- Produces: the EDI evidence artefact required by subtask `z8v0kmrj5d` and `z8v0kmrj5q`.

- [ ] **Step 1: Audit the image assets and record which are live**

```bash
cd apps/mobile && find assets -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.svg' -o -name '*.webp' -o -name '*.gif' \) | sort
```

23 files expected. For each, determine whether it is referenced (`grep -rn "<filename>" app components app.config.ts app.json`) and record it in the checklist's asset table with three columns: path, referenced yes/no, contains rendered text yes/no. Expect these to be **unreferenced Expo/React Native template leftovers** — report them, do not delete them (out of scope, and deleting assets another Sprint may own is not this task's call):

`assets/images/expo-badge.png`, `expo-badge-white.png`, `expo-logo.png`, `react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png`, `tutorial-web.png`.

`assets/images/tabIcons/*` are live. Check each of the 6 for rendered text and record the result — this is the part that actually matters, because tab icons are the one image asset class in the running app.

- [ ] **Step 2: Write the checklist**

`docs/EDI-compliance-checklist.md` reproduces all 11 rows of `docs/PRD-wayble.md` §6 as a table with columns **Area | Requirement | Evidence | Status | Owner task**. Link back to the PRD section as the source. The 11 areas in PRD order: Contrast, Colour independence, Text scaling, Touch targets, Screen reader, Announcements, Motor, Cognitive, Equity of need, **Localisation**, Socioeconomic.

- **Localisation row — the one this task completes.** Evidence cell names all four artefacts and what each proves:

| Evidence                                          | Proves                                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/constants/strings.ts`                | Every user-facing string in the mobile app is in one module: ~350 strings across 13 namespaces. Verified by the `STRINGS` type and by the guard test.         |
| `apps/mobile/constants/strings-guard.test.ts`     | The claim is enforced, not just asserted. The test fails if an unlisted inline literal appears, so "all strings are extractable" cannot quietly become false. |
| Asset audit (Task 12 Step 1)                      | No text is baked into any live image asset.                                                                                                                   |
| `apps/mobile/constants/accessibility-metadata.ts` | Named explicitly as the _other_ half of the string surface, so the claim is precise rather than overstated.                                                   |

Status wording — use this and do not embellish it:

> **Sinhala/Tamil localisation is deferred to US-22.** No translation ships. What is proven here is that the strings are _extractable_: they are in one module, keyed by namespace, with a test that fails if a new inline string is added elsewhere. Interpolated strings are functions rather than templates precisely so a locale lookup can replace them without touching call sites.
>
> **Not proven, and not claimed:** pluralisation rules (English one/many only — Sinhala and Tamil do not use it), date and number formatting (`toLocaleDateString()` is called with no locale argument in `utils/format-relative-time.ts:45`), and right-to-left layout. All three are US-22 work.

That last paragraph is deliberate. The PRD §6 note at line 207 warns that overclaiming costs more than underclaiming at a VIVA. Write down what is _not_ done.

- **The other 10 rows** get their requirement verbatim from the PRD, `Status: Pending`, and the owning task ID from `docs/sprint_tasks_and_subtasks.md` (Contrast / Text scaling / Motor / Touch targets → S4-3 `z8v0kmrj4v`, `z8v0kmrj53`, `z8v0kmrj5b`, `z8v0kmrj5x`; Screen reader → S4-3 `z8v0kmrj5m`; Announcements → S3-7 `z8v0kmrj49`; Colour independence → S4-3; Cognitive → S3-1; Equity of need → S3-5; Socioeconomic → S3-2). Do not fill these in from a quick read — Sprint 3 evidence for several of them has not been verified, and asserting it is exactly the overclaiming the PRD warns about.

- [ ] **Step 3: Verify the doc renders and the numbers are true**

Count the strings in `strings.ts` and put the real number in the table, not an estimate. `grep -c` will not work on a nested object; count the quoted string literals and say how you counted. Then:

```bash
bun run format:check
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add docs/EDI-compliance-checklist.md
git commit -m "docs(edi): add the EDI compliance checklist with localisation evidence"
```

---

## Post-Implementation

- [ ] Report the four findings in "Findings to Report, Not Fix" to Pasindu. Each is a real defect that the refactor made visible, and each deserves its own branch.
- [ ] Do not merge. `origin/main` is `e6379fc`; open a PR for this branch when he has reviewed.
- [ ] S4-6 (`z8v0kmrg2e`) is the follow-on: it owns ADR-001 and ADR-002, which the repo references but has never committed as files. This plan does not touch them.
