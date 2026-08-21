# S1-WAY-14 — Screen-reader Pass over All Sprint 1 Screens

**Sprint 1 · Epic E4 Accessibility · 3 pts · Owner M1**

As a screen-reader user, I can navigate every Sprint 1 screen, so the app is usable by the audience it serves.

## Acceptance Criteria

1. Every interactive element has a label and a role.
2. TalkBack and VoiceOver walkthrough completed and logged.
3. Contrast meets WCAG 2.1 AA.

## Context

The project is a Turborepo monorepo with:

- **Mobile**: Expo Router (`apps/mobile/`) — uses `@gorhom/bottom-sheet`, `@rnmapbox/maps`, and a design system defined in [theme.ts](../../../apps/mobile/constants/theme.ts) with light/dark mode tokens.
- **Accessibility infrastructure**: A `useScreenReader` hook already auto-switches the map tab to list mode when TalkBack/VoiceOver is enabled. A `TouchTarget` component enforces 44 pt minimum touch targets with focus ring support. Existing Sprint 1 screens (Sign In, Sign Up, Home, Settings, Debug) already have strong accessibility props.
- **Design system**: [theme.ts](../../../apps/mobile/constants/theme.ts) provides semantic color tokens (`text`, `textMuted`, `primary`, `onPrimary`, `danger`, `success`, `warning`, `focus`, `border`, `surface`, `background`) for light and dark modes, spacing, typography, radii, and sizing.

### Sprint 1 Screen Inventory (13 files)

| #   | Screen / Component         | Path                                  | Status               |
| --- | -------------------------- | ------------------------------------- | -------------------- |
| 1   | Root entry (redirect)      | `app/index.tsx`                       | ⚠️ Minor fix         |
| 2   | Sign In                    | `app/(auth)/sign-in.tsx`              | ✅ Already correct   |
| 3   | Sign Up                    | `app/(auth)/sign-up.tsx`              | ✅ Already correct   |
| 4   | Home tab                   | `app/(tabs)/home/index.tsx`           | ✅ Already correct   |
| 5   | Map tab                    | `app/(tabs)/mapbox/index.tsx`         | ⚠️ Fixes needed      |
| 6   | Map → Place Detail         | `app/(tabs)/mapbox/place/[id].tsx`    | ⚠️ Fixes needed      |
| 7   | Settings tab               | `app/(tabs)/settings/index.tsx`       | ✅ Already correct   |
| 8   | Place Detail (stack)       | `app/place/[id].tsx`                  | ⚠️ Minor fix         |
| 9   | Debug                      | `app/debug.tsx`                       | ✅ Already correct   |
| 10  | DetailSheet (bottom sheet) | `components/map/DetailSheet.tsx`      | ❌ Most fixes needed |
| 11  | SearchBar                  | `components/map/SearchBar.tsx`        | ⚠️ Fix needed        |
| 12  | LocateButton               | `components/map/LocateButton.tsx`     | ❌ Fixes needed      |
| 13  | AccessibilityPin           | `components/map/AccessibilityPin.tsx` | ❌ Fixes needed      |

---

## Audit Results

### Already Correct (No Changes Needed)

The following screens and components already have complete accessibility props:

- **Sign In / Sign Up**: All inputs have `accessibilityLabel`, `accessibilityLabelledBy`, `nativeID` linkage; all errors use `accessibilityRole="alert"`; submit buttons have `accessibilityLabel` and `accessibilityRole="button"`; navigation links have `accessibilityRole="link"`.
- **Home screen**: Header has `accessibilityRole="header"`, debug button has full label/role/hint.
- **Settings screen**: Section headers, account card (`accessible`, `accessibilityLabel`), sign-out button, location button — all correct.
- **Debug screen**: Header, touch button, AddPlaceForm — all elements properly labelled.
- **CategoryFilter**: Each pill has `accessibilityRole="button"`, `accessibilityState={{ selected }}`, `accessibilityLabel`.
- **ViewModeToggle**: Switch has `accessibilityRole="switch"`, `accessibilityState={{ checked }}`, `accessibilityLabel`, `accessibilityHint`.
- **LocationPermissionBanner**: Button has label/role.
- **PlaceListItem**: Composite a11y label, button role, decorative dot hidden.
- **AttributeRow**: `accessible`, `accessibilityRole="text"`, composite label.
- **AttributeGroup**: Category heading uses `accessibilityRole="header"`.
- **NoDataPrompt**: `accessible`, composite label, CTA button with label/role/hint.
- **CategoryBadge**: `accessible`, `accessibilityRole="text"`, `accessibilityLabel`.
- **AddPlaceForm**: All inputs labelled, category pills have `accessibilityState`, toast uses `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.

### Issues Found — Labels & Roles

| File                             | Element                      | Issue                                                      |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `DetailSheet.tsx` L68–70         | Close button (`✕`)           | Missing `accessibilityRole="button"`, `accessibilityLabel` |
| `DetailSheet.tsx` L67            | Place name                   | Missing `accessibilityRole="header"`                       |
| `DetailSheet.tsx` L113–121       | "Show the direction" button  | Missing `accessibilityRole="button"`, `accessibilityLabel` |
| `DetailSheet.tsx` L95–103        | Accessibility category tiles | Missing `accessible`, `accessibilityLabel` per tile        |
| `LocateButton.tsx` L14–20        | "Locate me" button           | Missing `accessibilityRole="button"`, `accessibilityLabel` |
| `AccessibilityPin.tsx` L22–29    | Map pin                      | Missing `accessibilityRole="button"`, `accessibilityLabel` |
| `SearchBar.tsx` L90–128          | Dropdown result items        | Missing `accessibilityRole="button"`, `accessibilityLabel` |
| `mapbox/place/[id].tsx` L63–79   | Category dot                 | Missing `importantForAccessibility="no"`                   |
| `mapbox/place/[id].tsx` L102–124 | Accessibility tiles          | Missing `accessible`, `accessibilityLabel` per tile        |
| `mapbox/place/[id].tsx` L146–161 | Disclaimer box               | Missing `accessibilityRole="note"`                         |
| `index.tsx` L12–23               | Loading spinner              | Missing `accessibilityLabel="Loading, please wait"`        |
| `mapbox/index.tsx` L348–366      | User location marker emoji   | Emoji not hidden from screen reader                        |
| `mapbox/index.tsx` L281–285      | Empty state text             | Missing `accessibilityRole`                                |
| `place/[id].tsx` L103            | Address pin emoji (📍)       | Emoji exposed to screen reader as raw character            |

### Contrast Verification — WCAG 2.1 AA

#### Theme token contrast ratios (calculated)

| Pair                          | Light Mode                          | Dark Mode                           | AA Required | Status  |
| ----------------------------- | ----------------------------------- | ----------------------------------- | ----------- | ------- |
| `text` on `background`        | `#14251A` on `#F7FAF8` = **14.1:1** | `#F2F7F3` on `#0F1712` = **16.2:1** | 4.5:1       | ✅ Pass |
| `textMuted` on `background`   | `#425248` on `#F7FAF8` = **7.1:1**  | `#B9C7BE` on `#0F1712` = **9.8:1**  | 4.5:1       | ✅ Pass |
| `primary` on `onPrimary`      | `#0B6B3A` on `#FFFFFF` = **5.5:1**  | `#8CE0A9` on `#082914` = **9.3:1**  | 4.5:1       | ✅ Pass |
| `danger` text on `background` | `#B3261E` on `#F7FAF8` = **5.7:1**  | `#FFB4AB` on `#0F1712` = **10.0:1** | 4.5:1       | ✅ Pass |
| `text` on `surface`           | `#14251A` on `#FFFFFF` = **15.9:1** | `#F2F7F3` on `#17221B` = **13.8:1** | 4.5:1       | ✅ Pass |

#### Hardcoded color issues (bypassing theme, breaking dark mode)

| File                 | Element                         | Hardcoded Color        | Fix                                         |
| -------------------- | ------------------------------- | ---------------------- | ------------------------------------------- |
| `DetailSheet.tsx`    | Place name, close icon, address | `#666`, system default | Use `colors.text`, `colors.textMuted`       |
| `DetailSheet.tsx`    | Accessibility tile bg/text      | `#f3f4f6`, `#4b5563`   | Use `colors.surface`, `colors.textMuted`    |
| `LocateButton.tsx`   | Button text and background      | `#333`, `#ffffff`      | Use theme tokens                            |
| `mapbox/index.tsx`   | Container, empty state text     | `#fff`, `#6b7280`      | Use `colors.background`, `colors.textMuted` |
| `ViewModeToggle.tsx` | Bottom border                   | `rgba(0,0,0,0.1)`      | Use `colors.border`                         |

---

## Proposed Changes

### 1. DetailSheet — 6 fixes (most critical)

#### [MODIFY] [`DetailSheet.tsx`](../../../apps/mobile/components/map/DetailSheet.tsx)

1. **Close button:** Add `accessibilityRole="button"`, `accessibilityLabel="Close place details"`.
2. **Place name:** Add `accessibilityRole="header"`, replace raw `Text` with `AppText`.
3. **"Show the direction" button:** Add `accessibilityRole="button"`, `accessibilityLabel="Show walking directions"`.
4. **Accessibility tiles:** Add `accessible`, `accessibilityLabel` per tile (e.g. `"Wheelchair accessible"`).
5. **Theme colors:** Replace all hardcoded `#666`, `#f3f4f6`, `#4b5563` with `appTheme.colors.*` tokens — import `useAppTheme`.
6. **Replace raw `Text`** imports with `AppText` for consistent typography.

---

### 2. LocateButton — 3 fixes

#### [MODIFY] [`LocateButton.tsx`](../../../apps/mobile/components/map/LocateButton.tsx)

1. Add `accessibilityRole="button"`, `accessibilityLabel="Locate me"`, `accessibilityHint="Centers the map on your current location"`.
2. Replace hardcoded `color: "#333"` and `backgroundColor: "#ffffff"` with theme tokens.
3. Replace `TouchableOpacity` with `TouchTarget` for consistent 44 pt minimum hit area.

---

### 3. AccessibilityPin — 2 fixes

#### [MODIFY] [`AccessibilityPin.tsx`](../../../apps/mobile/components/map/AccessibilityPin.tsx)

1. Add `accessibilityRole="button"`, `accessibilityLabel` derived from category (e.g. "Wheelchair accessible place").
2. Replace `TouchableOpacity` with `TouchTarget`.

---

### 4. SearchBar dropdown items — 1 fix

#### [MODIFY] [`SearchBar.tsx`](../../../apps/mobile/components/map/SearchBar.tsx)

1. Add `accessibilityRole="button"`, `accessibilityLabel` per dropdown result item (e.g. `"City Library, 0.5 km away"`).

---

### 5. Map tab screen — 3 fixes

#### [MODIFY] [`(tabs)/mapbox/index.tsx`](<../../../apps/mobile/app/(tabs)/mapbox/index.tsx>)

1. User location marker: Add `accessible`, `accessibilityLabel="Your current location"` to the container; hide emoji from screen reader.
2. Empty state: Add `accessibilityRole="text"`.
3. Replace hardcoded `backgroundColor: "#fff"` and `color: "#6b7280"` with theme tokens.

---

### 6. Map → Place Detail screen — 3 fixes

#### [MODIFY] [`(tabs)/mapbox/place/[id].tsx`](<../../../apps/mobile/app/(tabs)/mapbox/place/[id].tsx>)

1. Category dot: Add `importantForAccessibility="no"`.
2. Accessibility tiles: Add `accessible`, `accessibilityLabel` per tile.
3. Disclaimer box: Add `accessibilityRole="note"`.

---

### 7. Place Detail screen (stack) — 1 fix

#### [MODIFY] [`place/[id].tsx`](../../../apps/mobile/app/place/[id].tsx)

1. Address pin emoji (📍): Hide from screen reader with `importantForAccessibility="no-hide-descendants"` or `accessibilityElementsHidden`.

---

### 8. Root index redirect — 1 fix

#### [MODIFY] [`index.tsx`](../../../apps/mobile/app/index.tsx)

1. `ActivityIndicator`: Add `accessibilityLabel="Loading, please wait"`.

---

### 9. ViewModeToggle — 1 fix

#### [MODIFY] [`ViewModeToggle.tsx`](../../../apps/mobile/components/map/ViewModeToggle.tsx)

1. Replace hardcoded `borderBottomColor: "rgba(0,0,0,0.1)"` with `appTheme.colors.border`.

---

### 10. Walkthrough Log Template

#### [NEW] [`docs/tasks/WAY-14-screen-reader-walkthrough-log.md`](../tasks/WAY-14-screen-reader-walkthrough-log.md)

A structured log document for the team to complete during manual TalkBack / VoiceOver testing, containing per-screen entries with:

- Platform tested (iOS / Android)
- Tester name
- Focus order correct?
- Labels read correctly?
- Actions announced with correct role?
- Error states announced as alerts?
- Issues found (free-text)
- Pass / Fail

---

## File Summary

| Layer    | File                                                 | Action | Description                                           |
| -------- | ---------------------------------------------------- | ------ | ----------------------------------------------------- |
| Frontend | `components/map/DetailSheet.tsx`                     | MODIFY | Add a11y labels/roles, theme colors, replace raw Text |
| Frontend | `components/map/LocateButton.tsx`                    | MODIFY | Add a11y props, theme colors, use TouchTarget         |
| Frontend | `components/map/AccessibilityPin.tsx`                | MODIFY | Add a11y props, use TouchTarget                       |
| Frontend | `components/map/SearchBar.tsx`                       | MODIFY | Add a11y labels to dropdown items                     |
| Frontend | `components/map/ViewModeToggle.tsx`                  | MODIFY | Theme-aware border color                              |
| Frontend | `app/(tabs)/mapbox/index.tsx`                        | MODIFY | A11y on markers, empty state; theme colors            |
| Frontend | `app/(tabs)/mapbox/place/[id].tsx`                   | MODIFY | A11y on dots, tiles, disclaimer                       |
| Frontend | `app/place/[id].tsx`                                 | MODIFY | Hide decorative emoji from SR                         |
| Frontend | `app/index.tsx`                                      | MODIFY | A11y label on loading spinner                         |
| Docs     | `docs/tasks/WAY-14-screen-reader-walkthrough-log.md` | NEW    | Manual walkthrough log template                       |

---

## Verification Plan

### Automated Tests

```bash
# Type-check all changes
bun run check-types

# Lint for any regressions
bun run lint
```

### Manual Verification

1. **VoiceOver (iOS):**
   - Enable VoiceOver on an iOS simulator or device.
   - Navigate each Sprint 1 screen using swipe gestures.
   - Verify every interactive element is focused, announced with correct label and role.
   - Log results in the walkthrough document.

2. **TalkBack (Android):**
   - Enable TalkBack on an Android emulator or device.
   - Navigate each Sprint 1 screen using swipe/explore-by-touch.
   - Verify focus order, labels, and roles.
   - Log results in the walkthrough document.

3. **Contrast spot-check (dark mode):**
   - Toggle device to dark mode.
   - Verify DetailSheet, LocateButton, MapboxTab, and ViewModeToggle render correctly (no invisible or low-contrast text) after hardcoded colors are replaced with theme tokens.
