# S0-4 — Expo App Shell Task Document

**Related plan:** [`docs/plans/S0-4-expo-app-shell.md`](../plans/S0-4-expo-app-shell.md)

## Task Summary

- **Sprint:** Sprint 0
- **Epics:** E1 Foundation & DevOps, E8 App Accessibility
- **Story points:** 5
- **Owner:** M2
- **Objective:** Extend the existing root-level Expo Router structure with an accessible stack, Native Tabs shell, theme system, and reusable UI defaults.

## Technical Constraints

- Target the existing Expo SDK 57 / Expo Router 57 dependencies.
- Keep the existing root-level `app` directory; no `src` migration is required.
- Use `NativeTabs` from `expo-router/unstable-native-tabs` for the initial mobile shell.
- Use nested native `Stack` layouts inside each tab.
- Use Expo Router's `ThemeProvider`, `DefaultTheme`, and `DarkTheme`.
- Keep `userInterfaceStyle: "automatic"`, typed routes, React Compiler, and `expo-system-ui` enabled.
- Do not add generated `ios` or `android` directories or manually edit native projects.
- Install or correct Expo dependencies only with `bun expo install`.
- Do not add a third-party UI kit for this story.
- Preserve the existing Convex `/debug` route and behavior.

## Dependencies and Suggested Order

```text
T1 Confirm existing route/source structure
 ├── T2 Root theme + providers
 ├── T3 Native Tabs + nested stacks
 │    └── T5 Screen shell refactor
 ├── T4 Design tokens
 │    └── T5 UI primitives
 │         └── T6 Screen refactor
 └── T7 Contrast evidence
      └── T8 Automated validation
           └── T9 Device/accessibility validation
```

T2 and T4 can be developed in parallel after T1. T3 can start after the current route structure is confirmed, but it should consume the tokens from T4 before finalizing navigation colours.

## Work Items

### T1 — Confirm the existing Expo Router structure

**Files:** `apps/mobile/app/*`, `apps/mobile/components/*`, `apps/mobile/tsconfig.json`

- [x] Keep `apps/mobile/app` as the single Expo Router route directory.
- [x] Keep `ConvexClientProvider` at `apps/mobile/components/providers/ConvexClientProvider.tsx`; do not move or rename it.
- [x] Add `components/ui`, `constants`, and `hooks` at the mobile package root as needed.
- [x] Keep the existing `@/*` alias mapped to `./*`.
- [x] Do not create `apps/mobile/src/app` alongside the current route tree.
- [x] Confirm `app.json`, `package.json`, `tsconfig.json`, and `assets` remain at the package root.
- [ ] Restart Expo after route changes and confirm Router discovers the root `app` directory.

**Done when:** The existing root-level `app` route tree is confirmed and `@/` imports resolve without a source migration.

### T2 — Implement root providers, theme, and system bars

**Files:** `apps/mobile/app/_layout.tsx`, `apps/mobile/constants/theme.ts`, `apps/mobile/hooks/use-app-theme.ts`

- [x] Add typed light and dark semantic tokens.
- [x] Add the spacing, typography, radius, and sizing scales.
- [x] Define `minTouchTarget` as `44`.
- [x] Implement `useAppTheme` with React Native `useColorScheme`.
- [x] Extend Expo Router `DefaultTheme` and `DarkTheme` with project tokens.
- [x] Wrap the existing `ConvexClientProvider` and Router layout correctly.
- [x] Add adaptive `expo-status-bar` configuration.
- [x] Configure root `Stack` screens for `(tabs)` and `debug`.
- [x] Hide the route-group header and give `/debug` a human-readable title.
- [x] Keep `userInterfaceStyle: "automatic"` and `expo-system-ui` unchanged unless Expo validation requires a correction.

**Done when:** Content, navigation chrome, and the status bar follow system light/dark appearance without restarting the app. T2 implementation is complete; device theme-switch validation remains part of T9.

### T3 — Add Native Tabs and nested stacks

**Files:** `apps/mobile/app/(tabs)/*`

- [x] Add `(tabs)/_layout.tsx` using `NativeTabs`.
- [x] Define the Home and Settings routes explicitly with `NativeTabs.Trigger`.
- [x] Add visible `NativeTabs.Trigger.Label` values.
- [x] Add iOS `sf` icons and Android `md` icons.
- [x] Provide selected/unselected icon variants where supported.
- [x] Set Android tab labels to remain visible with `labelVisibilityMode="labeled"`.
- [x] Keep the tab count at five or fewer.
- [x] Add `(tabs)/index/_layout.tsx` with a nested `Stack`.
- [x] Add `(tabs)/settings/_layout.tsx` with a nested `Stack`.
- [x] Keep tab declarations static; do not dynamically add or remove tabs.
- [x] Configure navigation and tab colours from shared tokens.
- [x] Preserve the typed Home link to `/debug`.
- [x] Do not use `unstable_nativeProps`.

**Done when:** Home and Settings are native tabs, each supports a nested stack, and `/debug` opens above the complete tab shell. T3 implementation is complete; device and assistive-technology checks remain part of T9.

### T4 — Build accessible UI primitives

**Files:** `apps/mobile/components/ui/app-text.tsx`, `screen.tsx`, `touch-target.tsx`

#### `AppText`

- [ ] Support semantic variants: `body`, `bodyStrong`, `label`, `title`, and `display`.
- [ ] Keep `allowFontScaling` enabled.
- [ ] Do not set a global `maxFontSizeMultiplier`.
- [ ] Use tokenized line heights and allow text to wrap and grow.
- [ ] Forward `TextProps` and accessibility props.

#### `Screen`

- [ ] Apply the active semantic background and tokenized padding.
- [ ] Handle safe-area edges not already managed by the navigator.
- [ ] Avoid duplicate bottom insets with Native Tabs.
- [ ] Support content growth and scrolling without fixed-height essential content.

#### `TouchTarget`

- [ ] Wrap `Pressable` and enforce `minWidth` and `minHeight` of 44 points.
- [ ] Forward accessibility role, label, hint, state, and press props.
- [ ] Provide visible pressed and focus states in both themes.
- [ ] Expose disabled state through `accessibilityState`.
- [ ] Use `hitSlop` only when adjacent targets cannot overlap.

**Done when:** New shell controls use primitives instead of repeating raw styles or accessibility defaults.

### T5 — Create Home and Settings shell screens

**Files:** `apps/mobile/app/(tabs)/index/index.tsx`, `apps/mobile/app/(tabs)/settings/index.tsx`

- [ ] Move the existing home content into the Home tab.
- [ ] Use `Screen` and `AppText` for layout and text.
- [ ] Add a clearly named accessible link/button to `/debug`.
- [ ] Add a lightweight Settings/accessibility placeholder.
- [ ] Include system-theme and Dynamic Type information without adding persistence.
- [ ] Ensure controls meet the 44-point target requirement.
- [ ] Keep the screens lightweight because Native Tabs renders tabs eagerly.

**Done when:** The app launches into Home, Settings is reachable, and the shell demonstrates the shared theme and accessibility primitives.

### T6 — Refactor the Convex Debug screen

**File:** `apps/mobile/app/debug.tsx`

- [ ] Preserve `api.health.ping` and `api.health.touch` behavior.
- [ ] Preserve the loading state while Convex connects.
- [ ] Replace hard-coded layout/text styles with shared primitives and tokens.
- [ ] Give the Touch action a clear accessible name and role.
- [ ] Expose loading and disabled states where applicable.
- [ ] Confirm the route remains a root stack screen outside the tabs.

**Done when:** `/debug` still shows server time/counter and the Touch action increments the counter without refresh.

### T7 — Verify colour contrast and accessibility defaults

**Files:** `apps/mobile/constants/theme.ts`, `docs/plans/S0-4-expo-app-shell.md`

- [ ] Check light and dark `text` on `background` at 4.5:1 or better.
- [ ] Check light and dark `textMuted` on `background` at 4.5:1 or better.
- [ ] Check light and dark `onPrimary` on `primary` at 4.5:1 or better.
- [ ] Check selected tab label/icon against tab background at 4.5:1 or better.
- [ ] Check focus indicators and non-text boundaries at 3:1 or better where applicable.
- [ ] Adjust semantic tokens instead of adding screen-specific colour overrides.
- [ ] Record final ratios in the plan's evidence table.
- [ ] Verify state is not communicated by colour alone.

**Done when:** No required contrast entry remains `TBD` and evidence is reviewable in the PR.

### T8 — Run automated Expo and repository validation

**Working directory:** repository root unless noted.

- [ ] Run `bun run lint`.
- [ ] Run `bun run check-types`.
- [ ] Run `bun --cwd apps/mobile expo export`.
- [ ] From `apps/mobile`, run `bunx expo-doctor`.
- [ ] From `apps/mobile`, run `bun expo config --type introspect`.
- [ ] Confirm typed route generation succeeds with the root-level route tree.
- [ ] Confirm no native `ios` or `android` directories were introduced.
- [ ] If dependencies change, run `bun expo install <package>` and repeat Expo Doctor.

**Done when:** All automated checks pass with the SDK-compatible dependency set.

### T9 — Perform device and assistive-technology validation

**Targets:** Android emulator/device and iOS simulator/device when available.

#### Navigation

- [ ] App opens on Home.
- [ ] Home and Settings tabs have visible labels and native icons.
- [ ] Selected tab state is understandable without colour alone.
- [ ] Tab state is preserved when moving between tabs.
- [ ] Nested stack headers display correctly.
- [ ] `/debug` opens above tabs.
- [ ] Back navigation returns to the previous tab state.
- [ ] Direct `/debug` deep link works.
- [ ] Re-selecting a tab follows expected native pop/scroll behavior.

#### Theme and layout

- [ ] Toggle system light/dark mode without restarting.
- [ ] Confirm screen content, headers, tab bar, icons, labels, and status bar update together.
- [ ] Check safe areas around status bars, notches, home indicators, and Android navigation bars.
- [ ] Check short/static and scrollable iOS screens for tab-bar transparency.
- [ ] Check small and typical phone sizes in portrait.

#### Accessibility

- [ ] Traverse the shell with TalkBack.
- [ ] Traverse the shell with VoiceOver.
- [ ] Confirm labels, roles, hints, disabled/loading states, and selected tab state are announced once.
- [ ] Set the largest available accessibility text size.
- [ ] Confirm essential text wraps and controls remain usable.
- [ ] Measure custom controls at 44 × 44 points or larger.
- [ ] Verify pressed, focused, selected, disabled, loading, and error states.
- [ ] Confirm no essential state is conveyed by colour alone.

**Done when:** Manual results are recorded in the PR and no blocking navigation or accessibility issue remains.

## Native Tabs Fallback Task

Create a follow-up decision during T9 if Native Tabs blocks the story:

- [ ] Confirm whether the issue is an implementation error, an SDK 57 limitation, or an alpha API defect.
- [ ] If TalkBack/VoiceOver, Dynamic Type, Expo export, or development-build stability is blocked, replace only the `(tabs)/_layout.tsx` implementation with stable Expo Router JavaScript `Tabs`.
- [ ] Keep the root-level structure, nested stacks, theme tokens, UI primitives, and acceptance criteria unchanged.
- [ ] Record the decision and evidence in the PR.

## File Ownership Map

| Area                            | Primary files                                                                                         | Responsibility                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------- |
| Existing route/source structure | `apps/mobile/app/*`, `apps/mobile/components/*`, `apps/mobile/tsconfig.json`                          | M2 or assigned foundation owner |
| Root providers/theme            | `apps/mobile/app/_layout.tsx`, `apps/mobile/constants/theme.ts`, `apps/mobile/hooks/use-app-theme.ts` | M2                              |
| Navigation                      | `apps/mobile/app/(tabs)/*`                                                                            | M2                              |
| UI primitives                   | `apps/mobile/components/ui/*`                                                                         | M2 / accessibility reviewer     |
| Shell screens                   | `apps/mobile/app/(tabs)/**/index.tsx`                                                                 | M2                              |
| Convex provider/debug           | `apps/mobile/components/providers/ConvexClientProvider.tsx`, `apps/mobile/app/debug.tsx`              | Existing mobile owner           |
| Contrast evidence               | `theme.ts`, plan document                                                                             | Accessibility reviewer          |
| Device validation               | PR checklist/evidence                                                                                 | M2 + Android/iOS reviewers      |

## Acceptance Checklist

- [ ] Source uses the existing root-level `app`, `components`, `constants`, and `hooks` structure.
- [ ] No `src/app` directory is introduced alongside the current route tree.
- [ ] `@/*` continues to resolve from `apps/mobile`.
- [ ] Root `Stack` contains nested Native Tabs.
- [ ] Home and Settings each have nested native stacks.
- [ ] Native tab labels and SF Symbol/Material Symbol icons work.
- [ ] `/debug` remains functional above the tab shell.
- [ ] Light/dark system appearance is applied consistently.
- [ ] Shared tokens are used for colours, spacing, type, radii, and sizing.
- [ ] Required text contrast is at least 4.5:1.
- [ ] Focus and non-text boundaries meet 3:1 where applicable.
- [ ] Dynamic Type remains enabled and usable at the largest tested size.
- [ ] Custom touch targets are at least 44 × 44 points.
- [ ] TalkBack and VoiceOver checks pass.
- [ ] `bun run lint` passes.
- [ ] `bun run check-types` passes.
- [ ] Expo export, Expo Doctor, and config introspection pass.
- [ ] Final contrast and manual test evidence are attached to the PR.

## Definition of Done

This task document is complete when every work item is checked, all automated validation passes, device and assistive-technology evidence is recorded, no required contrast ratio is `TBD`, and the implementation satisfies the related plan without introducing a `src` migration, native project directories, or unrelated dependencies.
