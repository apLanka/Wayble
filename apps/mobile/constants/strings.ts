/**
 * Every user-facing string in the mobile app.
 *
 * ## Why this file exists
 *
 * PRD §6 makes one claim about localisation: that all strings are kept "in
 * one module" with no text baked into images, "so the claim is credible". This
 * is that module. It is the evidence for the claim, and
 * `strings-guard.test.ts` is what keeps the claim from quietly becoming false
 * the first time someone adds a screen.
 *
 * ## The one rule that constrains this file: no runtime imports
 *
 * `app.config.ts` reads the OS location-permission prompt from here, and Expo
 * evaluates that config in plain Node — no `@/` path alias, no React Native
 * modules. So this file may not import anything at runtime. A single value
 * import breaks `expo start` at build time, which no other check in the repo
 * would catch; `strings-guard.test.ts` asserts the absence directly.
 *
 * This is why the character limits, the step count and the attribute key list
 * are interpolated at the call site rather than imported here.
 *
 * ## Shape
 *
 * Namespaces mirror the feature that owns the words, so a translator or a
 * future locale file has the same structure the screens do. Screen-reader copy
 * lives in an `a11y` object *inside* its feature, not in a shared top-level
 * one: it is announced from the screen that owns it, and it is the copy that
 * most needs translating first.
 *
 * A leaf is either a string or a `(…args) => string` function — never an
 * object, array or `Record`. Interpolated sentences are functions rather than
 * templates precisely so that a locale lookup can replace them without
 * touching a single call site.
 *
 * ## What is deliberately not here
 *
 * - `accessibility-metadata.ts` — the attribute, value and place-category
 *   labels. Already a central table keyed off the backend's accessibility
 *   enum, and the same file owns the icon that each label is paired with.
 *   Moving the labels out would split a label from its icon.
 * - `packages/backend/convex/notificationCopy.ts` — 19 server-side push
 *   labels. The backend cannot import from `apps/mobile`, and that file's own
 *   comment says US-22 turns its map into a locale lookup.
 * - `components/debug/*` and `app/debug/*` — dev-only screens, never shipped.
 * - React Native tokens and identifiers: `accessibilityRole` values, SF
 *   Symbol names, route params, storage keys, `console` output, and the
 *   substrings `classifyReportError` / `classifyVerificationError` match
 *   against backend error messages.
 * - Emoji used as icons. They are always rendered alongside a text label, and
 *   there is nothing to translate about them.
 */

/**
 * English one/many selection.
 *
 * Sinhala and Tamil do not use this rule, and this is not a pluralisation
 * solution — it is the minimum needed to keep the existing English copy
 * correct while the strings are gathered in one place. US-22 replaces this
 * with a locale lookup, and the per-locale plural categories it needs.
 */
export function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

export const STRINGS = {
  /**
   * Copy shared by more than one feature, and the sentences built from it.
   */
  common: {
    appName: "Wayble",
    tagline: "Find a better way to get there.",

    // Generic actions.
    back: "Back",
    cancel: "Cancel",
    save: "Save",
    next: "Next",
    close: "Close",
    retry: "Retry",

    // The two authentication verbs, in the casing each surface uses. A
    // button reads "Sign In"; a screen-reader label reads "Sign in". They are
    // different strings on purpose — see GuestProfilePrompt.
    signIn: "Sign In",
    signInLower: "Sign in",
    signUp: "Sign Up",
    signUpLower: "Sign up",
    createAccount: "Create account",
    createAccountCapitalised: "Create Account",

    // Identity.
    guest: "Guest",
    user: "User",

    // Waiting and absence.
    loading: "Loading",
    loadingEllipsis: "Loading…",
    loadingWait: "Loading, please wait",
    none: "None",
    other: "Other",

    /** The disclosure chevron drawn at the end of a settings row. */
    chevron: "›",

    /**
     * "1 need", "0 needs", "3 needs".
     *
     * The count is the only interpolated part, so this is the one place the
     * one/many choice is made for every list length in the app.
     */
    countLabel: (count: number, noun: string): string =>
      `${count} ${plural(count, noun, `${noun}s`)}`,

    /** Time-of-day greeting for the home header. */
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",

    /**
     * Relative times, as US-10's report cards and S3-7's activity feed show
     * them. Split from the thresholds themselves: `formatRelativeTime` owns
     * *when* to use each of these, this owns the wording.
     */
    relativeTime: {
      justNow: "just now",
      minutes: (n: number) => `${n} min ago`,
      hours: (n: number) => `${n} h ago`,
      days: (n: number) => `${n} d ago`,
      weeks: (n: number) => `${n} w ago`,
    },

    /**
     * Distances. The unit suffixes are user-visible and locale-dependent —
     * Sinhala and Tamil do not use "m"/"km" the way English does — so they
     * belong here rather than in the arithmetic. US-22 owns unit formatting.
     */
    distanceMetres: (m: number) => `${Math.round(m)}m`,
    distanceKilometres: (km: number) => `${km.toFixed(1)}km`,
  },

  /**
   * Route titles, tab labels and the back affordance. The PRD's EDI row for
   * screen readers cares about these: they are the first words a VoiceOver or
   * TalkBack user hears for a screen.
   */
  navigation: {
    tabs: {
      home: "Home",
      map: "Map",
      profile: "Profile",
      settings: "Settings",
    },
    titles: {
      debug: "Debug",
      placeDetails: "Place Details",
      reportAccessibility: "Report accessibility",
      allPlaces: "All places",
      reports: "Reports",
      notifications: "Notifications",
      /**
       * Title case, because that is the stack header's own string. The body
       * text says "Accessibility needs" in sentence case, and both are correct
       * where they are — see `STRINGS.profile.accessibilityNeedsTitle`.
       */
      accessibilityNeeds: "Accessibility Needs",
      notFound: "Not Found",
    },
    back: "Back",
  },

  /**
   * Anything the operating system shows, plus the copy around a permission
   * prompt. These are the strings most often missed, because they live
   * outside the component tree — one of them is in `app.config.ts`.
   */
  permissions: {
    location: {
      title: "Location Access",
      granted: "Granted",
      denied: "Denied",
      undetermined: "Undetermined",
      openSettings: "Open Settings",
      enable: "Enable",
      enableLocation: "Enable Location",
      openSettingsForLocation: "Open settings for location",
    },
    notification: {
      /** The Android channel name — user-visible in system settings. */
      channelName: "Nearby verification requests",
    },
    os: {
      /**
       * The iOS/Android location permission prompt, read by `app.config.ts`.
       * This is the reason this file may not import anything at runtime.
       */
      locationWhenInUse:
        "Wayble needs your location to show accessible places near you.",
    },
  },

  /**
   * Copy spoken by `AccessibilityInfo.announceForAccessibility`.
   *
   * Held apart from the on-screen strings because it is copy for the ear, not
   * for the page: it is written to be understood without a visual referent, in
   * one breath, and it is never seen. A screen-reader user who cannot read the
   * text still has to get all of it.
   */
  announcements: {
    welcome: "Welcome to Wayble. Find a better way to get there.",
    reportSubmitted: "Report submitted. Thank you.",
    reportConfirmed: "Report confirmed.",
    reportDisputed: "Report disputed.",
    needsCleared: "All accessibility needs cleared.",
  },

  /**
   * Signing in and signing up.
   *
   * `fieldLabels` is shared between the two screens and between a field's
   * visible label and its `accessibilityLabel` — they are the same word, and
   * the visible label is already announced through `accessibilityLabelledBy`.
   */
  auth: {
    fieldLabels: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
    },
    signIn: {
      subtitle: "Sign in to contribute and verify accessibility information.",
      emailPlaceholder: "name@example.com",
      passwordPlaceholder: "Enter your password",
      toSignUpLabel: "Go to sign up screen",
      noAccount: "Don't have an account? ",
    },
    signUp: {
      subtitle: "Join Wayble to map and verify accessibility worldwide.",
      passwordPlaceholder: "Minimum 8 characters",
      confirmPasswordPlaceholder: "Re-enter your password",
      toSignInLabel: "Go to sign in screen",
      haveAccount: "Already have an account? ",
    },
  },

  /**
   * Validation and server-failure copy for the auth screens.
   *
   * The `includes("invalid")`-style substrings in sign-in and sign-up stay in
   * those files: they classify what the auth provider threw, they are never
   * rendered, and moving them would hide the fact that they are a wire-level
   * guess rather than a contract.
   */
  errors: {
    auth: {
      emailRequired: "Email address is required.",
      emailInvalid: "Please enter a valid email address.",
      passwordRequired: "Password is required.",
      passwordTooShort: (min: number) =>
        `Password must be at least ${min} characters.`,
      confirmPasswordRequired: "Please confirm your password.",
      passwordsDoNotMatch: "Passwords do not match.",
      invalidCredentials:
        "Invalid email or password. Please check your credentials.",
      emailAlreadyInUse:
        "An account with this email already exists. Please sign in instead.",
      signInUnexpected: "An unexpected error occurred. Please try again.",
      signUpUnexpected:
        "Registration could not be completed. Please try again.",
    },

    /**
     * Copy for a failed `verifyReport` (US-10).
     *
     * The substrings `classifyVerificationError` matches on are *not* here:
     * they are the backend's own error text, pinned by the backend suite, and
     * they are never rendered. Only the messages a person reads are.
     */
    verification: {
      unauthenticated: "Sign in to confirm or dispute a report.",
      selfVerification: "You can't verify your own report.",
      unknownReport: "This report no longer exists.",
      noteTooLong: (max: number) =>
        `Keep your note to ${max} characters or fewer.`,
      generic: "We couldn't save your vote. Please try again.",
    },

    /**
     * Copy for a failed `submitReport` (US-08).
     *
     * `classifyReportError` matches on the backend's own error text, which is
     * pinned by the backend suite and never rendered. Only the message a person
     * reads is here.
     */
    report: {
      duplicate:
        "You already reported on this place today. You can add another report tomorrow.",
      unauthenticated: "Sign in to submit a report.",
      summaryTooLong: (max: number) =>
        `Keep your summary to ${max} characters or fewer.`,
      observationTime:
        "Your device clock looks wrong. Turn on automatic date and time, then try again.",
      generic: "We couldn't submit your report. Please try again.",
    },

    /**
     * A failed write that is not tied to one story. Shared by the
     * accessibility-needs editor and the notifications screen, which both
     * showed the same sentence.
     */
    saveFailed: "Couldn't save that change. Check your connection.",

    nameSaveFailed: "Couldn't save your name. Check your connection.",

    needsLoadFailed:
      "Couldn't load your accessibility needs. Check your connection.",
  },

  /**
   * First-run screen.
   *
   * `slogan` is the tagline in curly quotes, which is not the same string as
   * `common.tagline` — the home header shows it unquoted.
   *
   * The two feature pills keep their leading emoji inside the string. It is
   * the one place in the app where iconography is glued to copy, and US-22
   * should split them: an emoji does not translate, and a translator editing
   * that string will have to preserve a character they cannot read.
   */
  onboarding: {
    slogan: "“Find a better way to get there.”",
    benefitRoutes: "🗺️ Accessible route navigation & place guides",
    benefitMobility: "♿ Verified ramp, entrance & mobility info",
    getStarted: "Get Started",
    haveAccount: "I already have an account",
    exploreAsGuest: "Explore map as guest →",
    a11y: {
      logo: "Wayble application logo",
      getStartedLabel: "Get Started",
      getStartedHint: "Creates a new account to join Wayble",
      haveAccountLabel: "I already have an account. Sign in",
      haveAccountHint: "Navigates to the sign in page",
      exploreAsGuestLabel: "Explore map as guest",
      exploreAsGuestHint: "Explores accessible map without signing in",
    },
  },

  /**
   * The home screen: the greeting, the two quick actions, and the nearby
   * section's four states.
   *
   * `nearby.*` is a set of mutually exclusive states rather than four
   * independent strings — a user sees exactly one of them at a time, which is
   * why the empty case has to carry its own call to action instead of reusing
   * the location-denied one.
   */
  home: {
    quickActionsTitle: "Quick actions",
    browseByNeedTitle: "Browse by need",
    nearbyTitle: "Nearby accessible places",
    seeAll: "See all",
    searchPlaceholder: "Search accessible places…",

    openMap: "Open Map",
    nearMe: "Near Me",

    /** Named for the signed-out case, which replaces the whole greeting. */
    greetingFallback: "Welcome to Wayble",

    profileGreeting: (greeting: string, displayName: string | null): string =>
      displayName
        ? `${greeting}, ${displayName}`
        : STRINGS.home.greetingFallback,

    nearby: {
      locationNeededTitle: "Location needed",
      enableLocationBody: "Enable location to see nearby accessible places.",
      findingNearby: "Finding nearby places…",
      emptyNearby: "No places found nearby. Explore the map to discover more.",
      openMapLabel: "Open map",
      openMapButton: "Open Map",
    },

    a11y: {
      screen: "Wayble home",
      logo: "Wayble logo",
      openProfile: "Open profile",
      openProfileHint: "Opens your profile and accessibility needs",
      searchLabel: "Search accessible places",
      searchHint: "Opens map search",
      openMapLabel: "Open map",
      openMapHint: "Opens the full map view",
      nearMeLabel: "Show places near me",
      nearMeHint: "Opens the map centered on your location",
      categoryShortcutHint: "Opens map filtered by this category",
      locationEnable: "Enable location",
      locationOpenSettings: "Open settings for location",
    },
  },

  /**
   * The map tab: its search bar, the category filter, and the sentences the
   * map's list view speaks.
   *
   * `categoryLabels` is the map's own five categories, which are not the ten
   * place categories in `accessibility-metadata.ts`. They were declared on
   * `CategoryFilter` and imported from a component by four other files; they
   * are here because a component is not a constants module. `CATEGORY_COLORS`
   * and the emoji tables stay on the component — colour and iconography are
   * not copy.
   */
  map: {
    categoryLabels: {
      all: "All places",
      wheelchair: "Wheelchair Accessible",
      elevator: "Elevator",
      bathroom: "Accessible Bathroom",
      multi: "Multiple Features",
    },

    /**
     * The search bar's own default. Distinct from the home screen's entry
     * placeholder, which is longer and includes the ellipsis — two strings,
     * not one.
     */
    searchPlaceholderShort: "Search places...",

    /** The deferred `app/(tabs)/mapbox/index.tsx` copy. See Ruling 6. */
    searchPlaceholder: "Search accessible places…",
    emptyNearby: "No places found nearby.",

    search: {
      inputLabel: "Search nearby places",
      clearLabel: "Clear search",
      distanceAway: (km: string) => `${km} km away`,
      distanceShort: (km: string) => `${km} km`,
      /** Joins a place's feature list in the dropdown. */
      featureSeparator: " • ",
    },

    location: {
      /** Verbatim, including the wrong city — see Finding 1 in the plan. */
      deniedBody:
        "Location access denied. Using default location (Bangalore). Enable in settings for local results.",
      undeterminedBody:
        "Allow location access to see places near you. Currently using default location (Bangalore).",
      enable: "Enable",
    },

    detailSheet: {
      closeLabel: "Close place details",
      /** The direction button's accessible name, not its visible text. */
      directionsLabel: "Show walking directions",
      directionsButton: "Show the direction",
      viewDetailsLabel: "View full accessibility details",
      viewDetailsHint:
        "Opens the full place detail screen with all accessibility attributes",
      viewDetailsButton: "View Details →",
    },

    locate: {
      label: "Locate me",
      hint: "Centers the map on your current location",
      button: "Locate me 📍",
    },

    viewMode: {
      label: "List View",
      hint: "Toggles between map and accessible list views",
    },

    placeDetail: {
      addressTitle: "Address",
      profileTitle: "Accessibility Profile",
      verifiedTitle: "Verified Features",
      noFeatures: "No accessibility features reported.",
      unknownPlace: "Unknown Place",
      disclaimer:
        "Note: A feature not listed here has not been assessed — it does not mean it is unavailable.",
    },

    /** The pin's accessible name when the filter is showing everything. */
    placeMarkerLabel: "Place marker",

    /**
     * "Cafe, food_and_drink, 450m away" — one continuous string so a screen
     * reader reads the row as a sentence instead of three disconnected items.
     */
    placeRowLabel: (
      name: string,
      category: string,
      distance: string | null,
    ): string => `${name}, ${category}${distance ? `, ${distance} away` : ""}`,

    /** The same idea for a search-dropdown row, which also lists features. */
    searchResultLabel: (
      name: string,
      distanceText: string | null,
      features: string | null,
    ): string =>
      `${name}${distanceText ? `, ${distanceText}` : ""}${
        features ? `, features: ${features}` : ""
      }`,

    categoryLabel: (label: string): string => `Category: ${label}`,

    /**
     * Resolves a category to its label, composing from the raw key when the
     * category is not one the filter knows.
     *
     * The known branch does NOT get " accessible" appended. That is the
     * existing behaviour, and changing it is a copy change, not a refactor.
     */
    categoryAccessible: (category: string, label: string | null): string =>
      label ?? `${category} accessible`,

    placeMarker: (category: string, label: string): string =>
      category === "all" ? STRINGS.map.placeMarkerLabel : `${label} place`,
  },

  /**
   * Place detail, the report list, and the verification control.
   *
   * The attribute, value and category *labels* are not here — they live in
   * `accessibility-metadata.ts`, keyed off the backend's accessibility enum so
   * that a new attribute appears in the UI automatically. What is here is the
   * prose that wraps them: the sentence a screen reader reads, the empty state,
   * and the states of the confirm/dispute control.
   */
  place: {
    attributes: {
      title: "Accessibility Attributes",
    },

    noData: {
      label: "No accessibility data available yet. Be the first to contribute.",
      title: "No accessibility data yet",
      body: "Be the first to contribute! Share what you know about this place's accessibility features to help others.",
      button: "Contribute Accessibility Info",
      buttonLabel: "Contribute accessibility info",
      buttonHint: "Opens the accessibility report form for this place",
    },

    verification: {
      confirmed: "Confirmed",
      disputed: "Disputed",
      confirmLabel: "Confirm this report",
      disputeLabel: "Dispute this report",
      /** The separator between the two counts in a tally sentence. */
      tallySeparator: " · ",
      noVerifications: "No verifications yet",
      confirmedCount: (n: number) => `${n} confirmed`,
      disputedCount: (n: number) => `${n} disputed`,
    },

    reports: {
      title: "Reports",
      empty: "No reports on this place yet.",
      loading: "Loading reports…",
      signedOutTitle: "Sign in to verify a report",
      signedOutBody:
        "Confirming or disputing a report is tied to your account, so people know who agreed with what.",
      countLabel: (n: number) => `${n} report${n === 1 ? "" : "s"}`,
      /** The list header, and the link on the place screen, differ in suffix. */
      header: (n: number) => `${n} ${plural(n, "report", "reports")}`,
      onThisPlace: (n: number) =>
        `${STRINGS.place.reports.countLabel(n)} on this place`,
    },

    addReport: {
      button: "Add or correct this report",
      label: "Add or correct this report",
      hint: "Opens the accessibility report form to add what others missed or fix a value that is wrong",
    },

    addressLabel: (address: string): string => `Address: ${address}`,

    notFound: {
      loading: "Loading place details…",
      title: "Place not found",
      body: "This place may have been removed or doesn't exist.",
    },

    reportsLinkHint:
      "Opens the list of reports so you can confirm or dispute them",

    /**
     * "Ramp: Available" or "Ramp: Partial. Note: Slight lip".
     *
     * Shared by `AttributeRow` and `ReportCard`, which build the same sentence
     * by different routes — the card pre-appends ". Note: " and passes it
     * whole. Two copies would drift the first time either was reworded.
     */
    attributeLabel: (
      label: string,
      valueLabel: string,
      note: string | null,
    ): string => `${label}: ${valueLabel}${note ? `. Note: ${note}` : ""}`,

    /** "Reported 2 days ago", on a report card's timestamp chip. */
    reportedOn: (observed: string): string => `Reported ${observed}`,

    /**
     * The disabled reason on a user's own report. Takes the already-formatted
     * tally rather than the counts, so it cannot re-derive them and disagree
     * with the control underneath it.
     */
    ownReportNote: (tallySummary: string): string =>
      `You can't verify your own report · ${tallySummary}`,
  },

  /**
   * The four-step report wizard.
   *
   * `stepTitles` is the only non-scalar leaf in the whole module. It is keyed
   * on the wizard's own `ReportStep` union, and `StepIndicator` re-annotates it
   * as `Record<ReportStep, string>` so renaming a step id is a `tsc` error
   * there — a missing key fails, an extra key does not.
   */
  report: {
    stepTitles: {
      category: "Category",
      attributes: "Attributes",
      notes: "Notes",
      confirm: "Confirm",
    },

    stepOf: (position: number, total: number): string =>
      `Step ${position} of ${total}`,

    /**
     * The joined form. The em dash is deliberate and load-bearing: it is what
     * separates the position from the title for a screen reader, and a hyphen
     * would be read as a dash with no pause.
     */
    stepOfWithTitle: (position: number, total: number, title: string): string =>
      `${STRINGS.report.stepOf(position, total)} — ${title}`,

    continueToLabel: (title: string): string => `Continue to ${title}`,
    backLabel: "Go back a step",
    back: "Back",
    next: "Next",
    /**
     * `stepTitle` returns "" for an out-of-range index, and the forward button
     * is only rendered while `step < 3` — so this fallback is unreachable in
     * practice. It is named rather than left empty so the Continue label can
     * never read "Continue to ".
     */
    nextStepFallback: "next step",

    category: {
      title: "What would you like to report?",
      body: "Pick a group. You will confirm the exact details in the next step.",
      groupLabel: "Accessibility group",
      /** "3 attributes. Double tap to report on mobility." */
      hint: (countLabel: string, category: string): string =>
        `${countLabel}. Double tap to report on ${category.toLowerCase()}.`,
    },

    attributes: {
      body: "Set a value for each one. Leave anything you did not check blank.",
      groupLabel: (label: string) => `${label} value`,
      valueLabel: (label: string): string => `${label} value`,
      valueAnnounce: (label: string, valueLabel: string): string =>
        `${label}: ${valueLabel}`,
      setValueHint: "Double tap to set this value.",
      clearValueHint: "Double tap to clear this value.",
      noteRequired: "Add a note — required for Partial",
      noteOptional: "Add a note (optional)",
      notePlaceholder: "What did you see?",
      noteLabel: (label: string): string => `Note for ${label}`,

      /**
       * The banner explaining which groups still need a note.
       *
       * The list joining is here rather than at the call site because "A, B
       * and C" is English grammar, not a fact about the data — and the whole
       * sentence is spoken aloud, so a dangling " and " is audible.
       */
      outstandingNote: (count: number, groups: string[]): string => {
        if (count === 0) return "";
        const one = count === 1;
        const list =
          groups.length === 1
            ? groups[0]
            : `${groups.slice(0, -1).join(", ")} and ${groups[groups.length - 1]}`;
        return `A note is still required for ${count} attribute${one ? "" : "s"} in ${list}. Go back and choose ${list} to add ${one ? "it" : "them"}.`;
      },
    },

    notes: {
      title: "Anything to add?",
      body: "One optional sentence about the whole visit. You can skip this.",
      label: "Your summary",
      titleLabel: "Your summary (optional)",
      placeholder:
        "For example: the side entrance is the only step-free way in.",
      summaryLabel: "Your summary",
      summaryHint: (max: number) => `Optional. Up to ${max} characters.`,
      charactersLeft: (remaining: number, max: number) =>
        `${remaining} of ${max} characters left`,
    },

    confirm: {
      title: "Check your report",
      noteTitle: "Your note",
      noteLabel: "Your summary",
      submit: "Submit report",
      submitting: "Submitting…",
      submitHint: "Saves your accessibility report for this place.",
      summaryLabel: (summary: string): string => `Your note: ${summary}`,
    },

    account: {
      checking: "Checking your account…",
      signedOutTitle: "Sign in to submit a report",
      signedOutBody:
        "Reports are tied to your account so other people can confirm or dispute what you observed.",
      signInLabel: "Go to sign in",
      missingPlace:
        "This report form is missing a place. Go back and try again.",
      reportingOn: (placeName: string) => `Reporting on ${placeName}`,
    },
  },

  /**
   * The profile tab and the accessibility-needs editor.
   *
   * `accessibilityNeedsTitle` is sentence case, which is what the body text
   * has always said. The stack header says "Accessibility Needs" in title
   * case and lives at `navigation.titles.accessibilityNeeds`. Both are correct
   * where they are; unifying them is a copy change, not a refactor.
   */
  profile: {
    title: "Profile",
    loading: "Loading profile…",
    accessibilityNeedsTitle: "Accessibility needs",
    needsLinkHint:
      "Opens the screen where you choose the accessibility features you need",

    signOut: {
      button: "Sign Out",
      label: "Sign out of your account",
      hint: "Signs you out and returns to the sign in screen",
    },

    header: {
      editLabel: "Edit display name",
      editHint: "Opens a dialog to change your name",
      guestSubtitle: "Sign in to save your profile",
      defaultAvatar: "Default profile avatar",
    },

    guest: {
      signIn: "Sign In",
      createAccount: "Create Account",
      signInLabel: "Sign in",
      createAccountLabel: "Create account",
      signInHint: "Opens the sign in screen",
      signUpHint: "Opens the sign up screen",
    },

    editName: {
      title: "Edit name",
      body: "This is how you appear in Wayble.",
      label: "Display name",
      placeholder: "Your name",
      closeLabel: "Close edit name dialog",
      cancel: "Cancel",
      cancelLabel: "Cancel editing name",
      save: "Save",
      saveLabel: "Save display name",
    },

    needs: {
      loading: "Loading your needs…",
      signInToSet: "Sign in to set your needs",
      notSetYet: "Not set yet",
      /** The summary shown when nothing is selected. */
      signedInBody:
        "Your accessibility needs are saved to your account so the app can highlight places that match them.",
      editorBody:
        "Choose the features you need. We use them to highlight and rank places that work for you. Changes save automatically.",
      clearAll: "Clear all",
      clearAllLabel: "Clear all accessibility needs",
      cleared: "All accessibility needs cleared.",
      noneSelected: "No needs selected yet",
    },

    /** "0 needs selected" / "1 need selected" — matches the util it replaces. */
    needsCountLabel: (count: number): string =>
      `${count} ${plural(count, "need", "needs")} selected`,

    /**
     * The per-group row's spoken name. The `selected` flag is what makes it
     * "remove from" rather than "add to" — the same row does both.
     */
    needsCategoryHint: (categoryName: string, selected: boolean): string =>
      `${categoryName} need. Double tap to ${
        selected ? "remove from" : "add to"
      } your accessibility needs.`,

    /** " · 3 selected" — the count badge on a group row. */
    needsCategoryCount: (count: number): string => ` · ${count} selected`,

    navRowLabel: (title: string, subtitle: string | null): string =>
      subtitle ? `${title}. ${subtitle}` : title,

    profilePhotoLabel: (displayName: string | null): string =>
      displayName
        ? `Profile photo for ${displayName}`
        : STRINGS.profile.header.defaultAvatar,
  },

  // Added by later tasks:
  //   place    (Task 6)
  //   report   (Task 7)
  //   profile  (Task 8)
  //   settings (Task 9)
  //   errors.* (Tasks 6, 7, 8, 9)
} as const;

export type Strings = typeof STRINGS;
