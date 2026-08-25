# US-02 Tasks

## Backend

- [x] `convex/accessibility.ts` — `ACCESSIBILITY_ATTRIBUTE_KEYS` + compile-time exhaustiveness guard
- [x] `convex/schema.ts` — `users.accessibilityNeeds` (optional array of attribute keys)
- [x] `convex/users.ts` — `updateProfile` accepts `accessibilityNeeds`; duplicate-key guard
- [x] `convex/users.test.ts` — tests written first and confirmed failing before implementing

## Frontend — Constants

- [x] `constants/accessibility-metadata.ts` — shared `ATTRIBUTE_ICON_EMOJI`, `ATTRIBUTE_KEYS_BY_CATEGORY`
- [x] `components/place/AttributeRow.tsx` — consume the shared emoji map instead of a private copy

## Frontend — Components

- [x] `components/ui/checkbox-row.tsx` — accessible checkbox row (`role=checkbox`, checked state, 44pt target)
- [x] `components/profile/NeedsCategorySection.tsx` — category heading + checkboxes

## Frontend — Screens & Navigation

- [x] `app/(tabs)/settings/accessibility-needs.tsx` — needs selection screen, save-on-toggle
- [x] `app/(tabs)/settings/_layout.tsx` — register the route
- [x] `app/(tabs)/settings/index.tsx` — entry card with needs summary

## Verification

- [x] Backend tests pass (20/20, 7 new)
- [x] Exhaustiveness guard proven to fail `tsc` when a key is missing
- [x] `bun run check-types` clean
- [x] `bun run lint` clean
- [x] `bun run format:check` clean
- [ ] Manual device pass: persistence, `Clear all`, offline revert, VoiceOver/TalkBack, light/dark
