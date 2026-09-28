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

  // Added by later tasks:
  //   place    (Task 6)
  //   report   (Task 7)
  //   profile  (Task 8)
  //   settings (Task 9)
  //   errors.* (Tasks 6, 7, 8, 9)
} as const;

export type Strings = typeof STRINGS;
