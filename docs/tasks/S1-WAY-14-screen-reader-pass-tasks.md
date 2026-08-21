# S1-WAY-14 — Screen-reader Pass Task List

**Related plan:** [`docs/plans/S1-WAY-14-screen-reader-pass.md`](../plans/S1-WAY-14-screen-reader-pass.md)

## Task Summary

- **Sprint:** Sprint 1
- **Epic:** Epic E4 Accessibility
- **Story points:** 3
- **Owner:** M1
- **Objective:** Ensure every Sprint 1 screen is fully navigable by TalkBack (Android) and VoiceOver (iOS) screen readers, with correct labels, roles, and WCAG 2.1 AA contrast.

## Dependencies and Suggested Order

```text
T1 DetailSheet accessibility + theming fixes
 ├── T2 LocateButton accessibility + theming
 ├── T3 AccessibilityPin accessibility
 ├── T4 SearchBar dropdown accessibility
 └── T5 ViewModeToggle theming fix
T6 Map tab screen fixes (markers, empty state, theme)
T7 Map → Place Detail screen fixes (dots, tiles, disclaimer)
T8 Place Detail stack screen fix (emoji hiding)
T9 Root index redirect fix (loading spinner)
T10 Walkthrough log template creation
T11 Type-check and lint validation
T12 TalkBack walkthrough (Android)
T13 VoiceOver walkthrough (iOS)
```

---

## Work Items

### T1 — DetailSheet Accessibility & Theming Fixes

**Files:** `apps/mobile/components/map/DetailSheet.tsx`

- [x] Add `accessibilityRole="button"` and `accessibilityLabel="Close place details"` to the close (`✕`) `TouchableOpacity`.
- [x] Add `accessibilityRole="header"` to the place name `Text`.
- [x] Add `accessibilityRole="button"` and `accessibilityLabel="Show walking directions"` to the "Show the direction" `TouchableOpacity`.
- [x] Add `accessible` and `accessibilityLabel` to each accessibility category tile (e.g., `"Wheelchair accessible"`).
- [x] Import `useAppTheme` and replace all hardcoded colors (`#666`, `#f3f4f6`, `#4b5563`) with theme tokens (`colors.text`, `colors.textMuted`, `colors.surface`).
- [x] Replace raw `Text` imports with `AppText` for consistent typography and font scaling.

**Done when:** Every interactive element in the bottom sheet announces its label and role. Dark mode renders correctly with themed colors.

---

### T2 — LocateButton Accessibility & Theming

**Files:** `apps/mobile/components/map/LocateButton.tsx`

- [x] Add `accessibilityRole="button"`, `accessibilityLabel="Locate me"`, and `accessibilityHint="Centers the map on your current location"`.
- [x] Replace `TouchableOpacity` with `TouchTarget` for consistent 44 pt minimum hit area.
- [x] Replace hardcoded `color: "#333"` and `backgroundColor: "#ffffff"` with `appTheme.colors.text` and `appTheme.colors.surface`.

**Done when:** Button is properly announced by screen readers and renders correctly in dark mode.

---

### T3 — AccessibilityPin Accessibility

**Files:** `apps/mobile/components/map/AccessibilityPin.tsx`

- [x] Add `accessibilityRole="button"` and `accessibilityLabel` derived from category label (e.g., "Wheelchair accessible place").
- [x] Replace `TouchableOpacity` with `TouchTarget` for minimum touch target compliance.

**Done when:** Map pins are announced with their category when focused by screen reader.

---

### T4 — SearchBar Dropdown Accessibility

**Files:** `apps/mobile/components/map/SearchBar.tsx`

- [x] Add `accessibilityRole="button"` and `accessibilityLabel` to each dropdown result `TouchableOpacity` (e.g., `"City Library, 0.5 km away"`).

**Done when:** Each search result item is individually focusable and announced with its name and distance.

---

### T5 — ViewModeToggle Theming Fix

**Files:** `apps/mobile/components/map/ViewModeToggle.tsx`

- [x] Replace hardcoded `borderBottomColor: "rgba(0,0,0,0.1)"` with `appTheme.colors.border`.

**Done when:** Border is visible and correct in both light and dark modes.

---

### T6 — Map Tab Screen Fixes

**Files:** `apps/mobile/app/(tabs)/mapbox/index.tsx`

- [ ] User location marker: Add `accessible` and `accessibilityLabel="Your current location"` to the container View; hide emoji with `importantForAccessibility="no-hide-descendants"`.
- [ ] Empty state: Add `accessibilityRole="text"` to the "No places found" text.
- [ ] Replace hardcoded `backgroundColor: "#fff"` with `appTheme.colors.background` in styles.
- [ ] Replace hardcoded `color: "#6b7280"` with `appTheme.colors.textMuted` in empty state text.

**Done when:** Marker is announced, empty state is accessible, and dark mode renders correctly.

---

### T7 — Map → Place Detail Screen Fixes

**Files:** `apps/mobile/app/(tabs)/mapbox/place/[id].tsx`

- [ ] Add `importantForAccessibility="no"` to the decorative category dot `View`.
- [ ] Add `accessible` and `accessibilityLabel` to each accessibility category tile (e.g., `"Wheelchair accessible"`).
- [ ] Add `accessibilityRole="note"` to the disclaimer box container.

**Done when:** Decorative elements are hidden, tiles are labelled, and disclaimer is properly announced.

---

### T8 — Place Detail Stack Screen Fix

**Files:** `apps/mobile/app/place/[id].tsx`

- [ ] Hide the address pin emoji (📍) from screen reader using `importantForAccessibility="no-hide-descendants"` on the emoji `AppText`, or wrap in a View with `accessibilityElementsHidden`.

**Done when:** Screen reader does not read "pin" emoji, only reads the address text.

---

### T9 — Root Index Redirect Fix

**Files:** `apps/mobile/app/index.tsx`

- [ ] Add `accessibilityLabel="Loading, please wait"` to the `ActivityIndicator`.

**Done when:** Loading spinner announces its purpose to screen readers.

---

### T10 — Walkthrough Log Template Creation

**Files:** `docs/tasks/WAY-14-screen-reader-walkthrough-log.md`

- [ ] Create a structured walkthrough log document with per-screen entry template containing: screen name, platform, tester, focus order, labels, roles, alerts, issues found, pass/fail.

**Done when:** Template document exists and is ready for team members to fill in.

---

### T11 — Type-check & Lint Validation

**Files:** N/A (runs across workspace)

- [ ] Run `bun run check-types` — all files compile with no errors.
- [ ] Run `bun run lint` — no new lint violations introduced.

**Done when:** CI-equivalent checks pass locally.

---

### T12 — TalkBack Walkthrough (Android)

**Files:** `docs/tasks/WAY-14-screen-reader-walkthrough-log.md` (update)

- [ ] Enable TalkBack on an Android emulator or device.
- [ ] Navigate all 9 Sprint 1 screens: Sign In → Sign Up → Home → Map (list mode) → Map (map mode) → Map Place Detail → Settings → Place Detail → Debug.
- [ ] Verify every interactive element is focusable, announced correctly, and actionable.
- [ ] Log results in the walkthrough document.

**Done when:** All screens pass TalkBack navigation and results are logged.

---

### T13 — VoiceOver Walkthrough (iOS)

**Files:** `docs/tasks/WAY-14-screen-reader-walkthrough-log.md` (update)

- [ ] Enable VoiceOver on an iOS simulator or device.
- [ ] Navigate all 9 Sprint 1 screens.
- [ ] Verify every interactive element is focusable, announced correctly, and actionable.
- [ ] Log results in the walkthrough document.

**Done when:** All screens pass VoiceOver navigation and results are logged.
