# S4-3: WCAG 2.1 AA Audit — Sprint 3 Screens

**Story:** S4-3 Full WCAG 2.1 AA accessibility audit + fixes
**Branch:** `feature/s4-3-wcag-audit-sprint-3` (from `main`)
**Precedent:** [`WAY-14-screen-reader-walkthrough-log.md`](./WAY-14-screen-reader-walkthrough-log.md) (Sprint 1 screens)

---

## Scope

Sprint 3 screens **merged to `main`** at the time of the audit:

| Story | Screen / component                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------- |
| US-08 | Report wizard `app/report/[placeId].tsx`: `CategoryStep`, `AttributesStep`, `NotesStep`, `ConfirmStep`, `StepIndicator` |
| US-08 | Report CTAs on `app/place/[id]/index.tsx`, `NoDataPrompt`                                                               |
| US-10 | Reports screen `app/place/[id]/reports.tsx`: `ReportCard`, `VerifyControl`                                              |
| US-11 | `ConfidenceBadge` on the place screen                                                                                   |
| US-13 | Flag flow in `ReportCardMenu` (reason picker + confirm sheet)                                                           |
| —     | `AttributeRow` (US-05, Sprint 1) — included because `ConfirmStep` renders it                                            |

**Not in this audit:** US-09 (photo evidence) and US-16 (needs ranking) are unmerged and are audited
on their own branches; US-23 (live feed) is unmerged and not yet available.

## Method

- **1.4.3 contrast:** WCAG relative-luminance ratios computed from `constants/theme.ts` tokens for
  both themes, including translucent tints blended over the background they sit on. Hard-coded
  colours in scope were found by search.
- **2.5.8 targets:** every pressable in scope checked for `TouchTarget` (enforces 44 × 44 via
  `sizing.minTouchTarget`) or an equivalent size.
- **4.1.2 name, role, value:** every `TouchTarget`, `Pressable` and `TextInput` checked for
  `accessibilityRole`, an accessible name, `accessibilityHint` and state.
- **1.4.4 resize text:** static review for fixed heights around text, `numberOfLines` truncation,
  disabled font scaling. **Needs on-device confirmation at 200% (see checklist).**
- **Single tap:** search for `onLongPress`, gesture handlers, swipe-to-dismiss.

---

## 1.4.3 Contrast (minimum) — ✅ Pass

Text needs ≥ 4.5:1 (≥ 3:1 for large text). All values below are normal-size text.

**Theme tokens** (lowest pair per theme):

| Theme | Pair                               | Ratio  |
| ----- | ---------------------------------- | ------ |
| Light | `border` on `background`           | 5.37:1 |
| Light | `focus` on `background`            | 5.70:1 |
| Light | `textMuted` on `background`        | 7.89:1 |
| Light | `onPrimary` on `primary` (buttons) | 6.61:1 |
| Dark  | `border` on `surfaceElevated`      | 4.69:1 |
| Dark  | `textMuted` on `surfaceElevated`   | 7.91:1 |
| Dark  | `onPrimary` on `primary`           | 9.98:1 |

**Tinted and special cases in scope:**

| Where                            | Pair                                  | Light  | Dark   |
| -------------------------------- | ------------------------------------- | ------ | ------ |
| `ConfidenceBadge` — Unverified   | `textMuted` on `textMuted` + 12.5 %   | 6.51:1 | 8.09:1 |
| `ConfidenceBadge` — Low          | `danger` on `danger` + 12.5 %         | 5.05:1 | 8.34:1 |
| `ConfidenceBadge` — Medium       | `warning` on `warning` + 12.5 %       | 5.34:1 | 8.92:1 |
| `ConfidenceBadge` — High         | `success` on `success` + 12.5 %       | 5.20:1 | 9.30:1 |
| "N reports" badge (place screen) | `primary` on `primary` + 8 %          | 5.57:1 | 9.79:1 |
| Wizard error banner              | `danger` on `danger` + 10 %           | 5.26:1 | 8.84:1 |
| Flag confirm button              | `onPrimary` on `danger`               | 6.54:1 | 9.25:1 |
| Placeholder text                 | `textMuted` on `surface`/`background` | ≥ 7.89 | ≥ 9.35 |

- Lowest in scope: **5.05:1** (light "Low confidence" badge).
- Disabled controls are dimmed to 50–60 % opacity; inactive components are exempt from 1.4.3. The
  explanation for a disabled vote ("You can't verify your own report …") is outside the dimmed
  buttons, in `textMuted` (8.29:1).
- Hard-coded colours: the place category dot `#6b7280` is decorative and hidden from assistive
  tech; the modal backdrop `rgba(0,0,0,0.45)` carries no text.

## 2.5.8 Target size — ✅ Pass

| Element                             | Size                 |
| ----------------------------------- | -------------------- |
| All `TouchTarget`s (16 in scope)    | ≥ 44 × 44 (enforced) |
| Vote buttons (`VerifyControl`)      | min height 48        |
| Wizard Back / Next, Submit          | min height 52        |
| Report options ⋮ (`ReportCardMenu`) | 44 × 44              |
| Modal backdrops (`Pressable`, 2)    | full screen          |

No `hitSlop` tricks and no pressable outside `TouchTarget` except the two full-screen backdrops.

## 4.1.2 Name, role, value — ✅ Pass (hints: ⚠ partial)

- **20 / 20** interactive elements (16 `TouchTarget`, 2 `Pressable`, 2 `TextInput`; a component
  rendered in a loop counts once) have a role and an accessible name. Both `TextInput`s have an
  `accessibilityLabel` and `accessibilityLabelledBy` pointing at their visible label.
- State is exposed: wizard values use `radio` + `checked`, vote buttons `selected` + `disabled`,
  submit `busy`; `TouchTarget` merges `disabled` into `accessibilityState` automatically.
- **⚠ `accessibilityHint` on 7 / 20.** The ClickUp item asks for hints on every interactive
  element. Missing on 13: Go to sign in (wizard, reports screen), Go back a step, Continue, Add the
  first report, Agree / Dispute (one component), Report options, "Report as …" (one component), the
  two modal backdrops, Cancel, Confirm flagging, and the per-attribute note input → **Fix F5**.
- **⚠ Hints that name the gesture.** `AttributesStep` value pills say "Double tap to set this
  value." VoiceOver and TalkBack already announce the gesture, so it is heard twice and is wrong for
  switch-control users → **Fix F6**.

## 1.4.4 Resize text — ❌ Fail (4 findings)

`AppText` keeps `allowFontScaling` on and React Native scales `lineHeight` with the font, so fixed
line heights alone are not a problem. These are:

| #   | Where                                  | Problem                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `ReportCardMenu` Cancel / Flag buttons | `height: 44` (fixed). At 200 % the 16 pt label needs ~48 pt of line height, so the text clips.                                                                                                                                                                                |
| F2  | `ReportCardMenu` ⋮ button              | Fixed `width/height: 44` around a 28 pt glyph with `lineHeight: 28`; at 200 % the glyph overflows the box.                                                                                                                                                                    |
| F3  | `ReportCard` attribute note            | `numberOfLines={2}` truncates the note. Larger text means more lines, so more of the note is lost exactly when the user needs it bigger.                                                                                                                                      |
| F4  | `AttributeRow` label and note          | `numberOfLines={2}` (label) and `{3}` (note) truncate the same way; rendered by `ConfirmStep`, so the user cannot read back their own note before submitting. Found while fixing: the emoji sits in a fixed 32 × 32 box with a 20 pt line height, which it outgrows at 200 %. |

## Single-tap operation — ✅ Pass

No `onLongPress`, gesture handlers or swipe-only dismissal in scope. Both modals close by a tap on
the labelled backdrop, an explicit Cancel (confirm sheet), or the Android back button.

---

## Fixes

| #   | Fix                                                                      | Status |
| --- | ------------------------------------------------------------------------ | ------ |
| F1  | Flag sheet buttons: `height` → `minHeight`                               | Fixed  |
| F2  | ⋮ button: fixed box → `minWidth`/`minHeight`                             | Fixed  |
| F3  | `ReportCard` note: drop `numberOfLines`                                  | Fixed  |
| F4  | `AttributeRow` label and note: drop `numberOfLines`; icon box → minimums | Fixed  |
| F5  | Add `accessibilityHint` to the 13 elements without one                   | Open   |
| F6  | `AttributesStep` hints describe the result, not the gesture              | Open   |

## On-device checklist (not yet run)

Static review cannot prove 1.4.4. These need a simulator or device, after the fixes land:

- [ ] iOS: Settings → Accessibility → Display & Text Size → Larger Text, max (≈ 200 %+). Android: Font size max + Display size max.
- [ ] Report wizard, all four steps: no clipped or overlapping text; Back / Next still reachable.
- [ ] Reports screen: long notes wrap in full; Agree / Dispute labels fit.
- [ ] Flag flow: reason rows, Cancel / Flag labels fully visible.
- [ ] Place screen: confidence badge and "N reports" badge wrap rather than clip.
- [ ] VoiceOver and TalkBack: every hint added in F5 is read once, after the label.
- [ ] Light and dark mode for each of the above.
