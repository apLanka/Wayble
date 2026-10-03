# Manual test runbook — S4-5 (`strings.ts` localisation module)

- **Task:** S4-5 / `z8v0kmrg2d` / subtasks `z8v0kmrj4x`, `z8v0kmrj55`, `z8v0kmrj5d`, `z8v0kmrj5q`
- **Branch:** `feature/s4-5-strings-ts-localisation-module` (base `e6379fc`)
- **Platform:** iOS Simulator + VoiceOver, then Android emulator + TalkBack
- **Tester:** _(leave blank)_
- **Date:** _(leave blank)_

## Why this exists

S4-5 moved **every user-facing string in the mobile app into one module**. It
added no features and changed no behaviour. That makes this a _differential_
test: the pass condition is not "the app looks right" but "**the app is
byte-for-byte the app on `main`, and every screen still renders**".

Two facts make the manual run the only real verification:

1. **46 `.tsx` files were refactored and `apps/mobile` has no component test
   runner.** Vitest there has no DOM and no React renderer, so no screen in this
   app has ever been rendered by a test. Every one of those 46 files is
   type-checked and nothing more. A refactor that type-checks can still crash at
   runtime — several intermediate states during this work broke JSX and imports
   in ways `tsc` did not catch immediately.
2. **The screen-reader output is the product.** The composed labels
   (`placeRowLabel`, `attributeLabel`, `outstandingNote`, the step
   announcements) are sentences a person hears read aloud. A test pins the
   string; only a human confirms the sentence _in context_, on the right screen,
   at the right moment.

## 0. What the automated suites already cover — do not re-test

- 116 mobile unit tests: every composed string's exact output, the guard test,
  and the byte-pinned formatter suites.
- 162 backend tests. `tsc --noEmit` clean. `eslint` clean. `expo config` loads.

If a failure below contradicts those, the suites are wrong, not the screen.

## 1. Prerequisites

- macOS with Xcode and an iOS Simulator runtime. Bun — `packageManager` is `bun@1.3.1`.
- A Convex dev deployment, provisioned once per machine (`bun run --filter @packages/backend setup`, interactive).
- **Not** required: a location permission or a Mapbox token. Section 3 reaches
  places through the debug screen, because the nearby list and the map are both
  gated on a location fix.

## 2. Bring the stack up

```bash
bun install          # skip if node_modules exists
bun run dev          # terminal A, repo root: syncs env, then convex dev + expo start
```

Expected first line: `[sync-convex-env] wrote EXPO_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud`.

Then run the branch build:

```bash
git checkout feature/s4-5-strings-ts-localisation-module
bun run dev
```

### 2a. Establish the baseline first — this is the part people skip

Run the **same** script in section 4 against `main` **before** running it against
the branch, and keep the recording. A refactor is only provable against a
before. Without the baseline, any oddity you hit will be attributed to the
branch whether or not it was caused by it.

```bash
git checkout main
# ... run section 4, record
git checkout feature/s4-5-strings-ts-localisation-module
```

## 3. Accounts and fixtures

Sign up one account and sign in. You do not need two: S4-5 changed no
multi-user behaviour.

Then seed some places, so the list and detail screens have content:

```bash
bun run seed          # from a second terminal
```

Or use the debug screen: Settings → Developer → **Open debug screen** →
**Load all places**. The debug screen's own copy was **not** refactored (it is
deliberately outside scope), so a difference there is not from this branch.

## 4. The script

For each step: run it on `main`, run it on the branch, compare. **Any difference
is a defect.** Quote the literal text of anything that differs.

### S4-5-A — the app launches and the shell renders

Open the app. Check:

- [ ] Launches to a screen, no red box, no blank screen
- [ ] Tab bar shows **Home, Map, Profile, Settings** — in that order and that
      capitalisation
- [ ] Tapping each tab changes screens
- [ ] No crash on any tab

The tab labels moved from four inline literals to `STRINGS.navigation.tabs`.
They are the most visible string in the app.

### S4-5-B — route titles in the header

- [ ] Profile → **Accessibility Needs** (title case, with "Needs" capitalised)
- [ ] Settings → **Notifications**
- [ ] Debug → **Debug**
- [ ] A place detail screen → **Place Details**
- [ ] The report form → **Report accessibility** (sentence case — note the
      lowercase "a")
- [ ] A place that does not exist → **Not Found**
- [ ] The header back button reads **Back**

Three surfaces say three different things about accessibility needs and they
**must stay** that way: the stack header says "Accessibility Needs", the
settings card says "Accessibility needs", and the profile nav row says "**My**
accessibility needs". A previous commit in this branch collapsed the last two.
If any two match, the branch is wrong.

### S4-5-C — profile tab, the highest-risk screen

- [ ] Header greeting: "Good morning/afternoon/evening, `<name>`", or
      **Welcome to Wayble** when signed out
- [ ] The first nav row's visible title reads **My accessibility needs**
- [ ] VoiceOver on that row announces **"My accessibility needs. \<summary\>"** —
      with the "My", and with a full stop before the summary
- [ ] **Sign Out** row
- [ ] **Edit display name** → the modal opens, title **Edit name**, body **This
      is how you appear in Wayble.**, field label **Display name**, buttons
      **Cancel** / **Save**, and VoiceOver on the close button says
      **Close edit name dialog**
- [ ] Signed out: the prompt shows **Sign In** and **Create Account**, and
      VoiceOver labels them **Sign in** / **Create account** (lowercase — the
      label and the button are deliberately different strings)
- [ ] Accessibility needs screen: **Clear all**, and the count line reads
      **No needs selected yet** or **"N needs selected"**

### S4-5-D — report wizard, step indicator and announcements

Walk all four steps: Category → Attributes → Notes → Confirm.

- [ ] Step indicator reads **Step 1 of 4 — Category** (with an **em dash**)
- [ ] VoiceOver on the indicator says **"step 1 of 4, progress bar, Category"** —
      position once, not twice
- [ ] On every step change, the announcement is **"Step 2 of 4: Attributes"**
      (with a **colon**, not an em dash)

> **The colon in the announcement and the em dash on screen are both correct.**
> They are deliberately two different strings, pinned by two different tests. A
> tester will flag this as a bug. It is not.

- [ ] Category step: **What would you like to report?**, **Pick a group. You
      will confirm the exact details in the next step.**
- [ ] Category row hint says **"N attributes. Double tap to report on
      mobility."** — and the count is pluralised
- [ ] Attributes step: **Set a value for each one. Leave anything you did not
      check blank.**
- [ ] On **Partial**, the note label reads **Add a note — required for Partial**;
      otherwise **Add a note (optional)**
- [ ] If a note is required, the banner reads the full sentence: _"A note is
      still required for 1 attribute in Mobility. Go back and choose Mobility to
      add it."_ — and with two groups, _"…for 2 attributes in Mobility and Vision.
      Go back and choose Mobility and Vision to add them."_ Listen to the three-group
      case too: it must be _"Mobility, Vision and Hearing"_, not a trailing
      "and" with nothing after it.
- [ ] Notes step: **Anything to add?**, **Your summary (optional)**, and the
      counter **"N of 500 characters left"**
- [ ] Confirm step: **Check your report**, **Your note**, **Submit report**
- [ ] Hardware back on Android walks back a step, and the announcement fires
- [ ] Submit succeeds, and the announcement is **Report submitted. Thank you.**

### S4-5-E — place detail, reports, verification

- [ ] Loading state, then attributes render with **Accessibility Attributes**
- [ ] VoiceOver on a row hears **"Ramp: Available"**, and with a note,
      **"Ramp: Partial. Note: Slight lip"**
- [ ] The reports link reads **"3 reports on this place"** — and **"1 report on
      this place"** for a single report
- [ ] **Add or correct this report** button
- [ ] Empty state: **No accessibility data yet**, **Be the first to contribute!**
- [ ] A place with no reports: **No reports on this place yet.**
- [ ] **Confirmed** / **Disputed** buttons; confirm then dispute, and the tally
      follows both directions
- [ ] Your own report is disabled and the reason reads **"You can't verify your
      own report · 2 confirmed"**
- [ ] The announcements after a vote are **Report confirmed.** / **Report
      disputed.**

### S4-5-F — the signed-out gates

Both screens gate on sign-in and both were touched:

- [ ] Report form, signed out: **Sign in to submit a report**, and the button's
      VoiceOver label is **Go to sign in**
- [ ] Reports list, signed out: **Sign in to verify a report**, and the button's
      VoiceOver label is **Go to sign in**

> Both labels must read **"Go to sign in"**, not "Sign in". A previous commit
> flattened one of them while the other stayed correct, so the two screens gave
> different announcements for the same action. Check both.

### S4-5-G — settings and notifications

- [ ] **Settings**, **Manage your account and app preferences.**
- [ ] Sections: **Account**, **Location**, **Developer**
- [ ] Not signed in / **Sign Out**
- [ ] Theme: **Current theme**, **Follows your device appearance setting.**,
      and **Dark** / **Light**
- [ ] Location status reads **Status:** then **Granted** / **Denied** /
      **Undetermined**
- [ ] **Developer** → **Convex connection health check and debug utilities.**
- [ ] Notifications: **Sign in to manage notifications** when signed out
- [ ] Radius options read **Within 500 m**, **Within 2 km**, **Within 5 km** —
      three distinct strings, not one formatted by the UI
- [ ] **What we store** and the full privacy paragraph
- [ ] Toggling notifications on Android, then check **Android Settings →
      Notifications → Wayble**: the channel is named **Nearby verification
      requests**. This is OS-visible copy the automated tests cannot see.

### S4-5-H — auth and onboarding

- [ ] Onboarding: **Wayble**, the slogan in curly quotes, the two feature pills,
      **Get Started**, **I already have an account**, **Explore map as guest →**
- [ ] VoiceOver announces **Welcome to Wayble. Find a better way to get there.**
- [ ] Sign in: subtitle, **Email**, **Password**, placeholders, **Sign In**,
      **Don't have an account?**, **Create account**, **Go to sign up screen**
- [ ] Validation errors, verbatim: **Email address is required.** / **Please
      enter a valid email address.** / **Password is required.** / **Password
      must be at least 8 characters.**
- [ ] Sign up: **Create Account**, **Confirm Password**, **Passwords do not
      match.**, and **An account with this email already exists. Please sign in
      instead.**

### S4-5-I — map, home, and search

- [ ] Home: **Quick actions**, **Browse by need**, **Nearby accessible places**,
      **See all**, **Open Map**, **Near Me**
- [ ] Nearby section's four states, all reachable: location-denied, loading,
      empty, populated
- [ ] Map tab search: placeholder, **Search nearby places**, **Clear search**,
      and a result row heard as **"\<name\>, \<km\> km away, features: …"** — with
      the clauses in that order and no dangling comma when the distance is absent
- [ ] A place list row heard as **"\<name\>, \<category\>, 450m away"**
- [ ] Category filter pills and their labels
- [ ] Location permission banner, both states

### S4-5-J — the location permission prompt (iOS + Android, first run only)

This is the one string in the project with two copies, because
`app.config.ts` cannot import `strings.ts` — Expo evaluates the config as
CommonJS and Node cannot resolve a `.ts` sibling. A test asserts the two agree,
but only a device shows the OS prompt.

- [ ] On a **fresh install**, dismiss and re-request location permission
- [ ] The system prompt reads **"Wayble needs your location to show accessible
      places near you."**
- [ ] On iOS: Settings → Wayble → Location. On Android: the app's permission
      entry
- [ ] The prompt text is **identical** to what `strings.ts` holds — if it is not,
      the test is not catching drift and both must be fixed

### S4-5-K — the highest-value pass: read the module against the screens

Not a device test. Open `apps/mobile/constants/strings.ts` and read it top to
bottom, checking each string appears where it should on the screen you just
used. This is now possible _because_ the strings are in one file, which is the
entire point of the change, and it catches the class of bug a device tour can
miss: a string in the module that no screen shows, or a screen showing something
the module does not hold.

- [ ] Every namespace maps to a screen you visited
- [ ] No string in the module is unused (31 were, at the last review)
- [ ] No string on a screen is absent from the module

### S4-5-L — light, dark, and large text

Spot-check the four refactored densest screens — settings, sign-up, onboarding,
confirm step — in dark mode and at 200% text size:

- [ ] No clipping, no truncation
- [ ] Emojis (`📋`, `📍`, `✓`) render, not tofu boxes
- [ ] The separators `·` `•` `—` render, not as `?`

## 5. Automated gates — confirm before recording

```bash
bun run --filter mobile test     # expect 116 passed
bun run check-types              # expect clean
bun run --filter mobile lint     # expect clean
bun run --filter @packages/backend test   # expect 162 passed
```

Also confirm the branch is intact and no stray commit crept in:

```bash
git log --oneline origin/main..HEAD -- bun.lock docs/traceability.md "apps/mobile/app/(tabs)/mapbox/index.tsx"
# expect NO output
```

## 6. Known gaps in this run

State these in any report rather than implying full coverage.

- **The map tab's own two strings are not verified here.**
  `app/(tabs)/mapbox/index.tsx` carries uncommitted work predating this branch,
  so it could not be committed or refactored. Its copy — "Your current
  location", the search placeholder, the empty state — is still inline, and the
  keys that will replace it already exist. Verify the map tab only if your
  working tree has the map restored; otherwise skip S4-5-I's map half.
- **The debug screens' copy was deliberately not refactored.** `app/debug` and
  `components/debug` are real routes and do render copy, but they are not
  user-facing product and are outside this task's scope.
- **`app.json` still says `"name": "mobile"`.** That is the label under the
  home-screen icon, on both platforms, and it is a fourth copy surface the
  guard cannot reach. The in-app name is "Wayble"; the launcher label is not.
  Unchanged by this branch, and named here so the claim stays precise.
- **No Sinhala or Tamil ships.** Nothing is translated. What this task proves is
  that the strings are _extractable_, not that the app is localised.
- **A green run here does not cover the Android hardware-back handler on iOS**
  (not testable by construction) or a live cross-device push.

## 7. Recording the result

| Task | Steps run | Passed | Failed | Partial | Not applicable | Tester | Date |
| ---- | --------- | ------ | ------ | ------- | -------------- | ------ | ---- |
| S4-5 |           |        |        |         |                |        |      |

Guidance: quote the literal screen text for every failure, and note which
baseline it was compared against. For any step that differs between `main` and
the branch, record the two texts side by side — that pair is the evidence a
reviewer needs, not a verdict.
