# S1 — UI Polish Mini Plan

**Scope:** Everything except the Map tab and map components.  
**Goal:** Make Home, Profile, Settings, Auth, Onboarding, and Place Detail feel like one cohesive, polished product.

---

## Current gaps (quick audit)

| Area                    | Issue                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **Shared UI**           | Card, nav row, and input styles duplicated across Settings / Profile / Home                              |
| **Icons**               | Home & Profile use `AppSymbol`; Auth, Onboarding, Place attributes, and Needs checkboxes still use emoji |
| **Spacing**             | Tab roots inconsistent (`paddingTop` md vs xl); stack headers fixed on Settings only                     |
| **Home**                | Missing skeleton rows for nearby list; category chips don't match Map chip styling exactly               |
| **Profile**             | No needs preview; no link to Settings; modal/backdrop could use shared sheet style                       |
| **Auth**                | Functional but plain — doesn't echo onboarding glow, logo, or card styling                               |
| **Place detail**        | Works but attribute rows use emoji; loading/error states are minimal                                     |
| **Accessibility needs** | Checkbox emoji icons; long screen could use sticky summary                                               |

---

## Design north star

Reuse what already works:

- Tokens from `constants/theme.ts`
- `AppText`, `Screen`, `TouchTarget`, `AppSymbol`
- Onboarding ambient glow + surface cards
- Home section pattern (`SectionHeader` + card content)

**Rule:** Polish by extracting shared primitives, not one-off tweaks per screen.

---

## Phase 1 — Shared components (foundation)

**Effort:** ~1 day · **Impact:** High

Extract 4 small primitives under `components/ui/`:

| Component                           | Purpose                                                      | Replaces                                              |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `SurfaceCard`                       | Bordered `surface` container, `radii.md`, consistent padding | `statusCard` in Settings, list card in HomeNearby     |
| `NavRow`                            | Title + subtitle + chevron row                               | `ProfileNavRow` (rename/generalize)                   |
| `TextField`                         | Themed `TextInput` with label + error line                   | Inline inputs in Auth + EditDisplayNameModal          |
| `PrimaryButton` / `SecondaryButton` | Standard CTA heights (44pt), primary/danger/outline variants | Repeated button styles across Profile, Auth, Settings |

**Done when:** Settings, Profile, and Auth import shared cards/buttons — no copy-pasted `StyleSheet` blocks for the same pattern.

---

## Phase 2 — Screen spacing & headers

**Effort:** ~2 hours · **Impact:** Medium

Standardize all **tab root screens** (Home, Profile, Settings):

```text
Stack header: headerShown: false  ✓ (already on all three)
Screen top padding: spacing.md
Section gap: spacing.xl
Bottom scroll padding: spacing.xxl (clears tab bar)
```

| Screen              | Action                                                                |
| ------------------- | --------------------------------------------------------------------- |
| Home                | Align `content` padding with Profile/Settings                         |
| Profile             | Change `paddingVertical: xl` → `paddingTop: md`, `paddingBottom: xxl` |
| Accessibility needs | Same padding fix; keep stack header for back nav                      |

**Done when:** Switching tabs feels like the same vertical rhythm — no random extra gaps.

---

## Phase 3 — Icon consistency (non-map)

**Effort:** ~1 day · **Impact:** High

Replace emoji-as-icons with `AppSymbol` everywhere **outside Map**:

| Location                                | Change                                             |
| --------------------------------------- | -------------------------------------------------- |
| `AttributeRow`                          | Use `ATTRIBUTE_METADATA[key].icon` via `AppSymbol` |
| `checkbox-row` / `NeedsCategorySection` | Symbol per attribute, not emoji                    |
| `onboarding.tsx` feature pills          | Symbols instead of ♿ etc. in badge text           |
| `NoDataPrompt`                          | Optional symbol + keep text label                  |

**Do not touch:** `components/map/*`, `mapbox/*`

**Done when:** No `[?]` emoji boxes on Profile, Needs, Place detail, or Onboarding on iOS.

---

## Phase 4 — Home polish

**Effort:** ~1 day · **Impact:** Medium

| Item            | Detail                                                            |
| --------------- | ----------------------------------------------------------------- |
| Nearby skeleton | 3 shimmer/skeleton rows while `useNearbyPlaces` loads             |
| Empty state     | Softer copy + `AppSymbol` map icon on CTA                         |
| Category chips  | Match Map pill border weight OR document intentional Home variant |
| Pull-to-refresh | Already shipped — add subtle haptic on refresh (optional)         |
| Home → Profile  | Profile shortcut already wired ✓                                  |

**Done when:** Home feels finished loading (no spinner-only nearby section).

---

## Phase 5 — Profile & Settings polish

**Effort:** ~1 day · **Impact:** Medium

### Profile

- **Needs preview card** (Phase 2 from profile design): show top 3 selected need labels
- **App settings link** footer row → Settings tab
- **Edit name modal**: use shared `TextField` + `PrimaryButton`; tap outside to dismiss
- **Guest state**: add Wayble logo mark above avatar for brand continuity

### Settings

- Group cards under section labels: **Appearance**, **Permissions**, **Developer**
- Hide Developer card behind `__DEV__` or a long-press easter egg (optional)
- Use `NavRow` if adding future links (e.g. About, Privacy)

**Done when:** Profile is the identity hub; Settings is clearly app prefs only.

---

## Phase 6 — Auth & Onboarding alignment

**Effort:** ~1 day · **Impact:** Medium

| Screen                | Polish                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Sign in / Sign up** | Reuse onboarding ambient glow; Wayble logo at top; shared `TextField` + buttons            |
| **Onboarding**        | Replace emoji feature badges with symbol + text pills (match Home category style)          |
| **Errors**            | Inline field errors + alert banner use `danger` token consistently                         |
| **Keyboard**          | `KeyboardAvoidingView` on both auth screens (sign-in may already have it — verify sign-up) |

**Done when:** First launch → sign up → home feels like one visual system.

---

## Phase 7 — Place detail polish

**Effort:** ~0.5 day · **Impact:** Medium

| Item             | Detail                                                  |
| ---------------- | ------------------------------------------------------- |
| Header           | Place name as large title; category badge + address row |
| Attribute groups | Reuse polished `AttributeRow` (symbols from Phase 3)    |
| No data          | `NoDataPrompt` styled as `SurfaceCard` with primary CTA |
| Loading          | Skeleton blocks for title + 3 attribute rows            |
| Stack title      | Dynamic: place name once loaded                         |

**Done when:** Tapping a nearby place on Home opens a screen that matches Profile/Home quality.

---

## Phase 8 — Micro-interactions & accessibility pass

**Effort:** ~0.5 day · **Impact:** Low–medium

- [ ] Consistent `accessibilityRole="header"` on every screen title
- [ ] Announce modal open/close via `AccessibilityInfo`
- [ ] Focus order audit: Home → Profile → Settings (VoiceOver walkthrough)
- [ ] Large Dynamic Type: verify Profile name row + modal don't clip
- [ ] Optional: light fade-in on Home sections (reuse onboarding animation values, subtle)

---

## Suggested order

```text
1. Phase 1  Shared components     ← do first; everything else gets easier
2. Phase 2  Spacing & headers    ← quick win
3. Phase 3  Icons (non-map)      ← fixes iOS emoji bugs app-wide
4. Phase 4  Home
5. Phase 5  Profile & Settings
6. Phase 6  Auth & Onboarding
7. Phase 7  Place detail
8. Phase 8  A11y & micro-interactions
```

---

## Out of scope (explicit)

- Map tab UI (`mapbox/index.tsx`, map search, filters, bottom sheet, pins, routes)
- All files in `components/map/` except `PlaceListItem` when used on Home (read-only reuse OK)
- New features (avatar upload, theme picker, contributions stats)
- Backend changes

---

## Success checklist

Polish is done when:

1. All four tabs share the same spacing, card style, and icon system
2. No emoji-as-icon rendering issues on iOS outside Map
3. Home, Profile, Settings, Auth, and Place detail look like they were designed together
4. Map tab is untouched 😁

---

## Related docs

- [S1 — Home Screen Design](./S1-home-screen-design.md)
- [S1 — Profile Section Design](./S1-profile-section-design.md)
- [S0-4 — Expo App Shell](./S0-4-expo-app-shell.md)
- [S1-WAY-14 — Screen Reader Pass](./S1-WAY-14-screen-reader-pass.md)
