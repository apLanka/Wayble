# WAY-14: Screen-reader Walkthrough Log

**Story:** S1-WAY-14 Screen-reader pass over all Sprint 1 screens  
**Related Plan:** [`docs/plans/S1-WAY-14-screen-reader-pass.md`](../plans/S1-WAY-14-screen-reader-pass.md)  
**Related Tasks:** [`docs/tasks/S1-WAY-14-screen-reader-pass-tasks.md`](./S1-WAY-14-screen-reader-pass-tasks.md)

---

## Testing Protocol & Guidelines

### Requirements

- **TalkBack (Android)**: Tested on Android Emulator (API 34+) or physical Android device with TalkBack enabled.
- **VoiceOver (iOS)**: Tested on iOS Simulator or physical iPhone with VoiceOver enabled.
- **WCAG 2.1 AA Criteria**:
  - 1.3.1 Info and Relationships (Logical heading structure, roles, groups)
  - 2.4.3 Focus Order (Logical swipe/tab order)
  - 2.4.4 Link / Button Purpose (Clear accessible names)
  - 4.1.2 Name, Role, Value (Every interactive element announced)
  - 4.1.3 Status Messages (Errors/alerts announced via live regions / alert roles)

---

## Walkthrough Summary

| Screen                                                              | TalkBack (Android) | VoiceOver (iOS) | Status      |
| ------------------------------------------------------------------- | ------------------ | --------------- | ----------- |
| 1. Root / Splash (`app/index.tsx`)                                  | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 2. Sign In (`app/(auth)/sign-in.tsx`)                               | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 3. Sign Up (`app/(auth)/sign-up.tsx`)                               | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 4. Home Tab (`app/(tabs)/home/index.tsx`)                           | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 5. Map Tab — List View (`app/(tabs)/mapbox/index.tsx`)              | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 6. Map Tab — Map View & DetailSheet (`app/(tabs)/mapbox/index.tsx`) | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 7. Map Place Detail (`app/(tabs)/mapbox/place/[id].tsx`)            | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 8. Place Detail Screen (`app/place/[id].tsx`)                       | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 9. Settings Tab (`app/(tabs)/settings/index.tsx`)                   | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |
| 10. Debug Screen (`app/debug.tsx`)                                  | 🟢 Pass            | 🟢 Pass         | 🟢 Complete |

---

## Detailed Test Logs

### 1. Root / Splash Screen (`app/index.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Loading spinner announced as `"Loading, please wait"` when auth check is resolving.
  - [x] Seamless automatic transition to either `/sign-in` (unauthenticated) or `/home` (authenticated).
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 2. Sign In Screen (`app/(auth)/sign-in.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] App title `"Wayble"` and subtitle read in order.
  - [x] Email input announced with label `"Email"`, type `"email"`.
  - [x] Password input announced with label `"Password"`, secure text entry status.
  - [x] Field errors announced with `accessibilityRole="alert"` when validation fails.
  - [x] Server error banner announced with `accessibilityRole="alert"` on credential mismatch.
  - [x] `"Sign In"` button announced with role `"button"` and disabled/loading state announced.
  - [x] `"Create account"` link announced with role `"link"` and hint.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 3. Sign Up Screen (`app/(auth)/sign-up.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Title `"Create Account"` read as header.
  - [x] Inputs (Email, Password, Confirm Password) read associated native labels.
  - [x] Password mismatch and short password errors announced as alerts.
  - [x] Duplicate email error banner announced as alert.
  - [x] `"Create Account"` button announced with role `"button"`.
  - [x] `"Sign in"` link announced with role `"link"`.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 4. Home Tab Screen (`app/(tabs)/home/index.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Header `"Accessibility Mapper"` announced with role `"header"`.
  - [x] Introduction paragraph read clearly.
  - [x] `"Open debug screen"` button announced with role `"button"`, accessible label, and accessibility hint.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 5. Map Tab — List View (`app/(tabs)/mapbox/index.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Screen reader auto-enables list view (or toggles via `"List View"` switch).
  - [x] Search bar announced with role `"search"`, placeholder, and clear button announced.
  - [x] Search dropdown results announce place name, distance, and feature tags with role `"button"`.
  - [x] Category filter pills announce selected state (`selected: true/false`) and label.
  - [x] `"List View"` switch announces switch role, checked state, and toggle hint.
  - [x] Place list items announce composite label (e.g. `"City Library, education, 1.2 km away, button"`).
  - [x] Empty state announced with role `"text"` when no results are found.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 6. Map Tab — Map View & DetailSheet (`app/(tabs)/mapbox/index.tsx` & `components/map/DetailSheet.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] User location marker announced as `"Your current location"`; decorative emoji hidden.
  - [x] `"Locate me"` button announced with role `"button"` and hint `"Centers the map on your current location"`.
  - [x] Place marker pins announced with category (e.g. `"Wheelchair Accessible place, button"`).
  - [x] DetailSheet place name announced with role `"header"`.
  - [x] DetailSheet close button announced as `"Close place details, button"`.
  - [x] Category badge announced with role `"text"` and label `"Category: <name>"`.
  - [x] Accessibility category tiles announced with role `"text"` and label (e.g. `"Wheelchair Accessible"`).
  - [x] `"Show walking directions"` button announced with role `"button"`.
  - [x] `"View full accessibility details"` button announced with role `"button"` and hint.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 7. Map Place Detail Screen (`app/(tabs)/mapbox/place/[id].tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Place title announced with role `"header"`.
  - [x] Category dot hidden (`importantForAccessibility="no"`).
  - [x] Address section announced with role `"header"` and text.
  - [x] Accessibility Profile category tiles announced with accessible text labels.
  - [x] Verified features list read in order.
  - [x] Disclaimer box announced with role `"summary"`.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 8. Place Detail Screen (`app/place/[id].tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Loading state announced as `"Loading place details…"`.
  - [x] Place title announced with role `"header"`.
  - [x] Category badge announced with role `"text"` and formatted label.
  - [x] Address pin emoji hidden; address announced cleanly as `"Address: <address>"`.
  - [x] Accessibility Attributes section announced with category headers and count badge.
  - [x] Each `AttributeRow` announced as a continuous composite label (e.g. `"Step-free Entrance: Available. Note: Ramp at side entrance"`).
  - [x] Empty state `NoDataPrompt` announced with illustration hidden and `"Contribute accessibility info"` CTA button announced with hint.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 9. Settings Tab Screen (`app/(tabs)/settings/index.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Title `"Settings"` announced with role `"header"`.
  - [x] Account card announced as `"Account information"` container.
  - [x] User display name, email, and role announced.
  - [x] `"Sign Out"` button announced as `"Sign out of your account, button"`.
  - [x] Theme card announced as `"Theme: <mode>"` with description.
  - [x] Location card announced as `"Location permissions"` with current status.
  - [x] `"Open Settings"` button announced with accessible label and role `"button"`.
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail

---

### 10. Debug Screen (`app/debug.tsx`)

- **Platform(s) Tested**: Android 14 (TalkBack 14.1, Emulator API 34) & iOS 17.5 (VoiceOver, Simulator iPhone 15 Pro)
- **Tester Name**: M1
- **Date**: 2026-08-25
- **Checklist**:
  - [x] Header `"Connection debug"` announced with role `"header"`.
  - [x] Server time and counter values read in order.
  - [x] `"Touch"` button announced as `"Increment the health counter, button"` with hint.
  - [x] `"Add place"` form header announced with role `"header"`.
  - [x] Inputs (Name, Address, Lat, Lng) announced with respective labels.
  - [x] Business category pills announce selected state (`selected: true/false`).
  - [x] Accessibility feature pills announce checkbox role (`checkbox`) and checked state (`checked: true/false`).
  - [x] Success toast announced with role `"alert"` and polite live region (`accessibilityLiveRegion="polite"`).
- **Issues Found**: None.
- **Result**: [x] Pass / [ ] Fail
