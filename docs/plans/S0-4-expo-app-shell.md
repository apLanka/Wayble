# S0-4 — Expo App Shell with Navigation and Accessible Theme

## Story

- **Sprint:** Sprint 0
- **Epics:** E1 Foundation & DevOps, E8 App Accessibility
- **Estimate:** 5 points
- **Owner:** M2
- **Objective:** Establish a modern Expo mobile shell, navigation, design tokens, and accessibility defaults before feature screens are built.

## Technical Direction

Implement this story against the project's existing **Expo SDK 57**, React Native 0.86, and Expo Router 57 stack.

Use current Expo conventions:

- Expo Router's supported root-level `app` directory, which is already used by this project.
- Expo Router file-based routing and typed routes.
- Expo Router `NativeTabs` for platform-native Android and iOS tab bars.
- Native `Stack` layouts for headers and pushed screens.
- Expo Router `ThemeProvider`, `DefaultTheme`, and `DarkTheme` exports.
- React Native `useColorScheme` with `userInterfaceStyle: "automatic"`.
- `expo-status-bar` and the already-installed `expo-system-ui`.
- `react-native-safe-area-context` plus Native Tabs' automatic content-inset behavior.
- React Compiler and typed routes, which are already enabled in `app.json`.
- Continuous Native Generation and config plugins for native configuration; do not create or manually maintain `ios` or `android` directories for this story.

`expo-router/unstable-native-tabs` is available in SDK 57 and provides native Material tabs on Android and native UIKit tabs on iOS. It is still an **alpha API**, so its use and fallback are documented under Risks.

## Current State

The Expo app in `apps/mobile` currently has:

- Expo Router configured through `expo-router/entry`.
- Typed routes and React Compiler enabled.
- A root `Stack` in `app/_layout.tsx`.
- A home route at `/`.
- A Convex health-check route at `/debug` that must remain reachable.
- `userInterfaceStyle: "automatic"` and `expo-system-ui` installed.
- `@expo/ui`, `expo-symbols`, `expo-status-bar`, `react-native-safe-area-context`, and `react-native-screens` installed.

The app still uses the older root-level `app` and `components` layout and does not have tabs, shared design tokens, reusable accessible primitives, or recorded accessibility validation.

## Scope

### In scope

1. Keep the existing root-level Expo Router source structure and add the shell in place.
2. Add an Expo Router root stack with nested platform-native tabs.
3. Add light and dark semantic colour tokens with WCAG AA contrast.
4. Add shared spacing, radius, sizing, and type scales.
5. Apply system appearance to content, stacks, tabs, and system bars.
6. Preserve Dynamic Type and font-scaling behavior.
7. Enforce 44 × 44 point minimum touch targets in shared controls.
8. Preserve the existing Convex debug flow.
9. Record navigation and accessibility validation evidence.

### Out of scope

- Final product screen designs or product-specific tab information architecture.
- Authentication and onboarding.
- Backend changes.
- A persisted user theme override.
- EAS Build, EAS Update, or store deployment configuration.
- Native modules, custom config plugins, or generated native projects.
- Broad adoption of `@expo/ui`; use it only when a required control has a stable universal API and improves native accessibility.

## Target Folder Structure

```text
apps/mobile/
├── app.json
├── package.json
├── tsconfig.json
├── assets/
├── app/
│   ├── _layout.tsx                     # Root providers, theme, StatusBar, Stack
│   ├── (tabs)/
│   │   ├── _layout.tsx                 # Expo Router NativeTabs
│   │   ├── index/
│   │   │   ├── _layout.tsx             # Native Stack for the Home tab
│   │   │   └── index.tsx               # Home shell screen
│   │   └── settings/
│   │       ├── _layout.tsx             # Native Stack for the Settings tab
│   │       └── index.tsx               # Accessibility/settings placeholder
│   └── debug.tsx                       # Existing Convex screen above tabs
├── components/
│   └── ui/
│       ├── app-text.tsx
│       ├── screen.tsx
│       └── touch-target.tsx
├── constants/
│   └── theme.ts                        # Typed tokens and light/dark themes
├── hooks/
│   └── use-app-theme.ts
└── components/
    └── providers/
        └── ConvexClientProvider.tsx
```

Why this structure:

- The existing root-level `app` directory is fully supported by Expo Router and requires no migration for this story.
- Route files remain focused on navigation and screen composition.
- Reusable UI, hooks, providers, and constants live outside the route tree and cannot accidentally become routes.
- A stack inside each native tab follows Expo's guidance for tab headers and future pushed screens.
- The root stack owns screens displayed above the whole tab shell, including `/debug`.

Do not add a second `src/app` directory for this story. Expo Router gives `src/app` precedence when both exist, which could hide the current routes and create maintenance confusion.

## Implementation Plan

### 1. Keep the existing Expo Router structure

1. Keep `apps/mobile/app` as the route directory.
2. Keep reusable providers under `apps/mobile/components/providers` unless a later refactor requires a different shared-source location.
3. Add `components/ui`, `constants`, and `hooks` at the mobile package root.
4. Keep the existing `@/*` alias mapping to `./*`.
5. Do not create `src/app` alongside the existing `app` directory.
6. Restart Expo after route changes so Router regenerates typed-route declarations.
7. Confirm the root `app` directory remains the single active route tree.

No custom Router root config is needed. Expo Router supports the existing root-level `app` directory.

### 2. Build root stack and native tab shell

Use Expo Router's stable `Stack` and SDK 57 Native Tabs compound-component API.

Root layout responsibilities:

- Keep `ConvexClientProvider` at `components/providers/ConvexClientProvider.tsx` and render it at the app root.
- Resolve the current colour scheme.
- Wrap Router in Expo Router's `ThemeProvider`.
- Render an adaptive `StatusBar`.
- Render a root `Stack` with `(tabs)` and `debug` screens.
- Hide the route-group header and provide a human-readable title for Debug.

Native tab layout responsibilities:

- Import `NativeTabs` from `expo-router/unstable-native-tabs`.
- Define every tab explicitly with `NativeTabs.Trigger`; native tabs do not auto-add routes.
- Use `NativeTabs.Trigger.Label` so tabs always have visible, descriptive names.
- Use `NativeTabs.Trigger.Icon` with SDK 57's `sf` and `md` props for native SF Symbols and Material Symbols without adding an icon-font dependency.
- Provide distinct default and selected icons where supported.
- Keep `labelVisibilityMode="labeled"` on Android so state is not communicated by icons or colour alone.
- Derive tab tint, label, indicator, ripple, and background colours from shared semantic tokens.
- Use no more than five tabs because Android native tabs have a platform limit of five.
- Keep tab definitions static; Native Tabs does not support dynamically adding or removing tabs without remounting state.

Each tab gets a nested `Stack` layout. This supplies native headers and allows future feature routes to push within their own tab while preserving tab state.

The home screen must keep a typed Expo Router `Link` to `/debug`. The debug screen remains outside `(tabs)` and opens above the complete tab shell.

### 3. Account for Native Tabs platform behavior

Use Native Tabs' built-in platform behavior instead of recreating a custom tab bar:

- Let the native component provide platform-sized tab hit areas and assistive-technology semantics.
- Keep labels visible and verify selected state with TalkBack and VoiceOver.
- On iOS, use native SF Symbols through the `sf` icon prop.
- On Android, use native Material Symbols through the `md` icon prop.
- Set `disableTransparentOnScrollEdge` if static or short iOS screens make the tab bar unexpectedly transparent.
- Do not set `minimizeBehavior` for this shell; minimizing can reduce discoverability and needs separate accessibility review.
- Retain the default pop-to-root and scroll-to-top behavior unless product requirements say otherwise.
- Do not use `unstable_nativeProps`; rely only on Expo Router's public Native Tabs surface.

Safe-area behavior must follow the SDK 57 Native Tabs rules:

- Android receives the bottom inset automatically; screen content must handle top, left, and right insets.
- On iOS, the first nested `ScrollView` receives automatic content-inset adjustment.
- Do not set `disableAutomaticContentInsets` unless the screen takes full responsibility for every inset.
- If a wrapper is required before an iOS `ScrollView`, set it up so native inset and scroll-to-top behavior are not broken.

### 4. Define accessible design tokens

Create a typed, immutable token module at `constants/theme.ts`.

Include:

- **Semantic colours:** `background`, `surface`, `surfaceElevated`, `text`, `textMuted`, `primary`, `onPrimary`, `border`, `focus`, `success`, `warning`, and `danger` for light and dark modes.
- **Navigation colours:** values derived from the same semantic palette for stack cards, headers, tab backgrounds, icons, labels, indicators, and Android ripples.
- **Spacing:** a consistent 4-point scale such as 4, 8, 12, 16, 24, and 32.
- **Typography:** semantic `body`, `bodyStrong`, `label`, `title`, and `display` styles with font size, line height, and optional weight.
- **Radii:** a small consistent scale.
- **Sizing:** `minTouchTarget: 44` as a named token.

Requirements:

- Normal text and meaningful icons must have at least **4.5:1** contrast against their intended background.
- Large text may use the WCAG AA **3:1** threshold, but base tokens should target 4.5:1 where practical.
- Interactive boundaries and focus indicators must have at least **3:1** contrast against adjacent colours.
- Selected, disabled, success, warning, and error states cannot rely on colour alone.
- Feature screens must use semantic tokens rather than importing raw palette values.

### 5. Compose the Expo Router theme

Create `useAppTheme` using React Native's `useColorScheme`:

- Resolve `dark` to dark tokens and all other values to light tokens.
- Return stable app tokens and an Expo Router navigation theme.
- Extend `DefaultTheme` and `DarkTheme` rather than building an incomplete navigation theme from scratch.
- Override navigation `colors` from the same semantic tokens used by app content.
- Avoid introducing a theme context until a persisted user override is required; the system hook is sufficient for this story.

`app.json` already contains `userInterfaceStyle: "automatic"`, and `expo-system-ui` is already installed. Keep both. Use `expo-status-bar` with an adaptive style in the root layout.

### 6. Add Dynamic Type-safe UI primitives

Create `AppText` as a thin typed wrapper around React Native `Text`:

- Accept semantic typography variants.
- Keep `allowFontScaling` enabled.
- Do not apply a global `maxFontSizeMultiplier`.
- Use readable proportional line heights.
- Allow wrapping and vertical growth for essential content.
- Avoid fixed-height text containers.
- Forward standard `TextProps` and accessibility props.

Default policy:

- Essential body, instruction, and action text must not be truncated or capped.
- Native stack and tab labels should use native behavior first.
- Apply a component-specific scaling cap only after reproducing an unusable platform layout and recording the reason.
- Test at the largest accessibility font size available on target devices.

Create a `Screen` primitive that:

- Applies semantic background and spacing.
- Uses `react-native-safe-area-context` for edges not managed by the navigator.
- Supports scrollable and non-scrollable screen composition without double-applying bottom insets.
- Does not place essential content in fixed-height wrappers.

Create `TouchTarget` as a thin `Pressable` wrapper that:

- Enforces `minWidth` and `minHeight` of 44 points.
- Forwards role, label, hint, state, focus, and press props.
- Provides visible pressed and focus states in both themes.
- Uses `hitSlop` only when it cannot overlap an adjacent target.
- Exposes disabled state through `accessibilityState`, not opacity alone.

Prefer platform controls and installed Expo libraries when they already satisfy a requirement. Do not add a third-party UI kit for these three primitives.

### 7. Update shell and debug screens

Refactor the placeholder Home, Settings, and Debug screens to consume `Screen`, `AppText`, `TouchTarget`, and semantic tokens.

- Home identifies the app shell and links to `/debug` using a typed `Link` or `Link` with `asChild` around the accessible pressable.
- Settings provides a simple accessibility/theme information placeholder; it does not persist preferences in this story.
- Debug retains the Convex query, mutation, loading state, and counter behavior.
- Loading and action controls expose clear accessible names.
- No screen uses hard-coded text colours, spacing, or touch dimensions.

Use `@expo/ui` only if a concrete shell control benefits from its stable universal API. Do not replace basic text and layout primitives merely to demonstrate the dependency.

### 8. Verify and document contrast

Before merging:

1. List every foreground/background pair used by content, stacks, and native tabs.
2. Check light and dark combinations with a WCAG contrast calculator.
3. Adjust shared token values instead of adding one-off screen overrides.
4. Record final ratios below or beside `theme.ts`.

| Mode  | Foreground token        | Background token | Required ratio | Verified ratio |
| ----- | ----------------------- | ---------------- | -------------: | -------------: |
| Light | `text`                  | `background`     |          4.5:1 |            TBD |
| Light | `textMuted`             | `background`     |          4.5:1 |            TBD |
| Light | `onPrimary`             | `primary`        |          4.5:1 |            TBD |
| Light | selected tab label/icon | tab background   |          4.5:1 |            TBD |
| Dark  | `text`                  | `background`     |          4.5:1 |            TBD |
| Dark  | `textMuted`             | `background`     |          4.5:1 |            TBD |
| Dark  | `onPrimary`             | `primary`        |          4.5:1 |            TBD |
| Dark  | selected tab label/icon | tab background   |          4.5:1 |            TBD |

Do not complete the story while any required ratio remains `TBD`.

### 9. Validate the shell

#### Expo and repository checks

Run from the repository root:

```bash
bun run lint
bun run check-types
bun --cwd apps/mobile expo export
```

Also run Expo dependency/configuration checks from `apps/mobile`:

```bash
bunx expo-doctor
bun expo config --type introspect
```

If a package must be added or corrected, install the SDK-compatible version with `bun expo install <package>` from `apps/mobile`. Do not use the deprecated global `expo-cli`.

#### Manual navigation checks

Test Android and, when available, iOS:

- App launches into the Home native tab.
- Home and Settings show native tab labels and platform-native icons.
- Selected state is visible without relying only on colour.
- Each tab preserves its nested stack/navigation state.
- Selecting an active tab follows the documented native pop/scroll behavior.
- `/debug` opens above the entire tab shell and Back returns to the prior tab state.
- A direct `/debug` deep link still resolves.
- Light/dark changes update screens, stack headers, native tabs, and status bar without restart.
- iOS tab transparency and content insets behave correctly on static and scrollable screens.
- Android content is not covered by status/navigation bars.

#### Manual accessibility checks

- Traverse all controls with TalkBack and VoiceOver in logical order.
- Confirm tab labels and selected state are announced once and clearly.
- Verify platform tab targets and custom controls are at least 44 × 44 points.
- Set text to the largest accessibility size and confirm essential text wraps without blocking controls.
- Test a small phone and a typical phone in portrait.
- Test light/dark pressed, focused, selected, disabled, loading, and error states.
- Confirm no state or meaning depends on colour alone.

## Expected File Changes

| Path                                                        | Change                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/mobile/app/*`                                         | Add the root stack, native tabs, nested stacks, and screens in place.                   |
| `apps/mobile/components/providers/*`                        | Preserve the existing Convex provider.                                                  |
| `apps/mobile/app/_layout.tsx`                               | Add providers, Expo Router theme, adaptive status bar, and root stack.                  |
| `apps/mobile/app/(tabs)/_layout.tsx`                        | Add SDK 57 `NativeTabs` triggers, labels, and native icons.                             |
| `apps/mobile/app/(tabs)/index/_layout.tsx`                  | Add the Home tab's nested stack.                                                        |
| `apps/mobile/app/(tabs)/index/index.tsx`                    | Add themed Home shell and typed Debug link.                                             |
| `apps/mobile/app/(tabs)/settings/_layout.tsx`               | Add the Settings tab's nested stack.                                                    |
| `apps/mobile/app/(tabs)/settings/index.tsx`                 | Add accessibility/settings placeholder.                                                 |
| `apps/mobile/app/debug.tsx`                                 | Preserve Convex behavior and apply accessible shared UI.                                |
| `apps/mobile/components/ui/*`                               | Add minimal accessible primitives.                                                      |
| `apps/mobile/constants/theme.ts`                            | Add typed semantic tokens and Router themes.                                            |
| `apps/mobile/hooks/use-app-theme.ts`                        | Add system-aware theme selection.                                                       |
| `apps/mobile/components/providers/ConvexClientProvider.tsx` | Do not move or rename the existing provider; continue rendering it at the app root.     |
| `apps/mobile/tsconfig.json`                                 | Keep `@/*` mapped to `./*`.                                                             |
| `apps/mobile/app.json`                                      | Keep modern Expo settings; change only if validation identifies a required config.      |
| `apps/mobile/package.json`                                  | Change only through `bun expo install` if Expo validation identifies a dependency need. |
| `docs/plans/S0-4-expo-app-shell.md`                         | Record final contrast and manual test evidence.                                         |

## Acceptance Criteria

- [ ] Mobile source keeps the existing root-level `app`, `components`, `constants`, and `hooks` structure.
- [ ] No `src/app` directory is introduced alongside the existing route tree.
- [ ] The `@/*` alias continues to resolve from `apps/mobile`.
- [ ] Expo Router uses a root `Stack` containing a nested `NativeTabs` navigator.
- [ ] Each native tab owns a nested native `Stack` for headers and future pushed routes.
- [ ] At least two tabs have visible labels and native `sf`/`md` icons.
- [ ] `/debug` remains reachable above the tab shell and its Convex behavior still works.
- [ ] Content, stacks, native tabs, and system bars follow system light/dark appearance.
- [ ] Typed shared tokens provide colour, spacing, typography, radii, and minimum touch size.
- [ ] Normal text and meaningful icon combinations meet WCAG AA 4.5:1 contrast.
- [ ] Non-text boundaries and focus indicators meet 3:1 where applicable.
- [ ] Shared text preserves Dynamic Type and essential content works at the largest tested size.
- [ ] Custom interactive controls and effective hit areas are at least 44 × 44 points.
- [ ] TalkBack and VoiceOver announce labels, roles, states, and tab selection clearly.
- [ ] Typed routes and React Compiler remain enabled.
- [ ] No `ios`/`android` directories or manual native edits are introduced.
- [ ] Lint, type checks, Expo export, Expo Doctor, and config introspection pass.
- [ ] Final contrast ratios and manual accessibility evidence are recorded.

## Risks and Mitigations

| Risk                                                                   | Mitigation                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NativeTabs` is alpha and its API can change in an Expo Router update. | Pin Expo Router through the SDK-compatible version, isolate Native Tabs in one layout, and replace it with stable Expo Router JavaScript `Tabs` if alpha behavior blocks accessibility or release stability. |
| Native Tabs behavior differs between Android, iOS, and web.            | Test both mobile platforms; accept native differences, and add a platform-specific `app-tabs.web.tsx` using `expo-router/ui` only when web requirements demand it.                                           |
| Native Tabs eagerly renders every tab.                                 | Keep shell tabs lightweight; defer expensive feature content with focus-aware loading in later stories.                                                                                                      |
| Large text clips tab labels or stack headers.                          | Use short labels, retain native label behavior, and test maximum accessibility sizes before considering a narrowly scoped cap.                                                                               |
| Safe-area padding is applied twice or omitted.                         | Respect Native Tabs' platform rules and centralize only unmanaged edges in `Screen`.                                                                                                                         |
| A 44-point visual control has a smaller press area.                    | Enforce minimum dimensions in `TouchTarget` and inspect controls on-device.                                                                                                                                  |
| Navigation chrome and screen colours drift apart.                      | Derive Expo Router and Native Tabs colours from one semantic token source.                                                                                                                                   |
| A future `src/app` directory masks the current root routes.            | Do not introduce `src/app`; keep the root `app` directory as the single route tree.                                                                                                                          |
| Route migration breaks Convex debug flow.                              | Move rather than rewrite provider logic, retain `/debug`, and test navigation, deep linking, query, and mutation behavior.                                                                                   |
| A new package version is incompatible with SDK 57.                     | Use `bun expo install`, then run Expo Doctor; do not install arbitrary latest native package versions.                                                                                                       |

## Rollback Decision for Native Tabs

Use stable Expo Router JavaScript `Tabs` instead of Native Tabs if any of these are true during implementation:

- TalkBack or VoiceOver does not announce tab names or selected state correctly.
- Dynamic Type produces an unusable tab bar with no accessible native configuration.
- A required platform has a blocking SDK 57 Native Tabs defect.
- The alpha API prevents Expo export or development-build stability.
- Product requirements need tab behavior that Native Tabs explicitly does not support.

The route tree, nested stacks, theme tokens, screens, and accessibility primitives remain valid if only the `(tabs)/_layout.tsx` implementation is swapped.

## Definition of Done

The story is done when the existing root-level Expo Router structure contains the root stack and platform-native tab shell, system appearance is reflected consistently, shared accessible tokens and primitives are in use, final contrast ratios are documented, maximum Dynamic Type remains operable, touch targets meet the 44-point minimum, assistive-technology checks pass, and repository plus Expo validation commands succeed.

## Expo References

- [Top-level src directory](https://docs.expo.dev/router/reference/src-directory/)
- [Expo Router Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [Native tabs SDK 57 API](https://docs.expo.dev/versions/latest/sdk/router/native-tabs/)
- [Expo Router Stack](https://docs.expo.dev/router/advanced/stack/)
- [Colour themes](https://docs.expo.dev/develop/user-interface/color-themes/)
- [Safe areas](https://docs.expo.dev/develop/user-interface/safe-areas/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
