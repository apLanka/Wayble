# US-02: Set My Accessibility Needs in My Profile

**Sprint 1 · Epic E2 Identity / E6 Personalised Needs Matching · 2 pts · Owner M1**

As a contributor, I can record which accessibility features I personally need, so the app can highlight and rank places that work for me.

## Context

- **Backend**: `packages/backend/convex/` — the `users` table already carried `displayName`, `avatarUrl`, `role`; `users.updateProfile` already enforced auth via `getAuthUserId`.
- **Taxonomy**: `convex/accessibility.ts` defines 19 attribute keys across 6 categories (mobility, vision, hearing, communication, sensory, assistance) at taxonomy version 1.
- **Mobile**: `apps/mobile/app/(tabs)/settings/` is an Expo Router stack that previously held only `index`. `constants/accessibility-metadata.ts` already maps every attribute key to a label, icon and category for US-05.

### Decision: needs are stored as specific attribute keys

The sprint task sheet described a coarse four-way multi-select ("mobility, vision, hearing, cognitive"). That vocabulary does not exist in the schema — the taxonomy has six categories and no `cognitive` — and coarse categories would limit US-16 to "this place has some mobility features" rather than "it has the step-free entrance you need".

Needs are therefore stored as an array of `AccessibilityAttributeKey`, reusing the taxonomy verbatim. No new vocabulary was introduced, and US-16 can score a place attribute by attribute. The cost is a 19-row selection screen, which is grouped into the six existing categories.

---

## Changes

### 1. Backend

**`convex/accessibility.ts`** — added `ACCESSIBILITY_ATTRIBUTE_KEYS`, an ordered array of all 19 keys. The validator defines the vocabulary but cannot be iterated, and UI offering the user a choice of attributes must enumerate them. Drift is prevented at compile time:

```ts
type _EveryAttributeKeyIsListed =
  Exclude<
    AccessibilityAttributeKey,
    (typeof ACCESSIBILITY_ATTRIBUTE_KEYS)[number]
  > extends never
    ? true
    : never;
```

Adding a key to the union without adding it to the array fails `tsc`. This was verified by removing a key and confirming `tsc` errors.

**`convex/schema.ts`** — `users` gains `accessibilityNeeds: v.optional(v.array(accessibilityAttributeKeyValidator))`. Optional, so existing user documents need no migration.

**`convex/users.ts`** — `updateProfile` gains an `accessibilityNeeds` arg, with these semantics:

| Argument    | Effect                                                           |
| ----------- | ---------------------------------------------------------------- |
| omitted     | field untouched — a `displayName`-only edit never clobbers needs |
| `[]`        | needs explicitly cleared                                         |
| `[...keys]` | full replacement, not a merge                                    |

Duplicate keys are rejected by `assertNoDuplicateNeeds`. The validator guarantees each entry is a known key but not that the list is a set, and a duplicate would double-count a need in US-04 filtering and US-16 ranking, so it is rejected at the boundary. Auth is enforced by the pre-existing `getAuthUserId` guard, satisfying the DoD clause that every mutation checks auth.

**`convex/users.test.ts`** (new) — seven `convex-test` cases, written before the implementation and confirmed failing first.

### 2. Mobile

**`constants/accessibility-metadata.ts`** — `ATTRIBUTE_ICON_EMOJI` was lifted out of `AttributeRow`'s private `getIconEmoji` helper, since the needs checkboxes require the same icon data and duplicating it would let the two lists drift. Added `ATTRIBUTE_KEYS_BY_CATEGORY`, derived from the backend key list so a new attribute appears in the UI automatically once it has display metadata.

**`components/place/AttributeRow.tsx`** — now reads the shared emoji map; its private copy was removed. No behaviour change.

**`components/ui/checkbox-row.tsx`** (new) — the accessibility-critical piece. `accessibilityRole="checkbox"` with `accessibilityState={{ checked }}`, so the visual tick is never the only indication of selection. Whole row is one 44pt-minimum touch target via `TouchTarget`; icon always paired with a text label.

**`components/profile/NeedsCategorySection.tsx`** (new) — a category heading plus its checkboxes, mirroring how `AttributeGroup` presents the same six categories on the place detail screen.

**`app/(tabs)/settings/accessibility-needs.tsx`** (new) — the selection screen.

Each toggle persists immediately through `useMutation(...).withOptimisticUpdate` rather than waiting behind a Save button. The tick responds instantly, Convex rolls the value back automatically if the mutation fails, and there is no way to lose a selection by leaving the screen. Consequently the screen holds no draft state — `currentUser.accessibilityNeeds` is the single source of truth. The stored array is written in taxonomy order regardless of the order the user tapped, so the persisted value is deterministic.

Also: a selected-count summary, a `Clear all` action disabled when nothing is selected, `AccessibilityInfo.announceForAccessibility` on every toggle, an `accessibilityRole="alert"` banner on save failure, a loading state, and a signed-out state matching the settings screen's existing "Not signed in" handling.

**`app/(tabs)/settings/_layout.tsx`** — registers the route.

**`app/(tabs)/settings/index.tsx`** — a navigable card reading "Accessibility needs › / 3 needs selected", or "Not set yet", or "Sign in to set your needs".

### Deliberately out of scope

Nothing reads `accessibilityNeeds` yet. US-04's "Matches my profile" filter and US-16's needs-based ranking are separate stories; this one only establishes the field and the editor.

---

## File Summary

| Layer   | File                                          | Action | Description                                          |
| ------- | --------------------------------------------- | ------ | ---------------------------------------------------- |
| Backend | `convex/accessibility.ts`                     | MODIFY | Ordered key list + compile-time exhaustiveness guard |
| Backend | `convex/schema.ts`                            | MODIFY | `users.accessibilityNeeds`                           |
| Backend | `convex/users.ts`                             | MODIFY | `updateProfile` accepts needs; duplicate guard       |
| Backend | `convex/users.test.ts`                        | NEW    | 7 `convex-test` cases                                |
| Mobile  | `constants/accessibility-metadata.ts`         | MODIFY | Shared emoji map + category grouping                 |
| Mobile  | `components/place/AttributeRow.tsx`           | MODIFY | Use the shared emoji map                             |
| Mobile  | `components/ui/checkbox-row.tsx`              | NEW    | Accessible checkbox row                              |
| Mobile  | `components/profile/NeedsCategorySection.tsx` | NEW    | Category heading + checkboxes                        |
| Mobile  | `app/(tabs)/settings/accessibility-needs.tsx` | NEW    | Needs selection screen                               |
| Mobile  | `app/(tabs)/settings/_layout.tsx`             | MODIFY | Register the route                                   |
| Mobile  | `app/(tabs)/settings/index.tsx`               | MODIFY | Entry card with needs summary                        |

---

## Verification

### Automated

```bash
cd packages/backend && bun run vitest run   # 20/20 pass (7 new)
bun run check-types                          # clean
bun run lint                                 # clean
bun run format:check                         # clean
```

The mobile typecheck needs Expo's generated route types refreshed after adding a route — `npx expo customize tsconfig.json` in `apps/mobile`, which is the same step CI already runs in its `typecheck` job.

### Manual

- Settings → "Accessibility needs" → toggle several needs → back out → reopen: selections persisted, and the settings card count updates.
- `Clear all` empties the list and is disabled when nothing is selected.
- Toggle with the app offline: the tick reverts and the alert banner appears.
- VoiceOver / TalkBack: each row announces as a checkbox with its checked state; toggling announces the new state and the running count.
- Light and dark mode both render correctly.

### Known gap

`apps/mobile` has no React Native test infrastructure (React Native Testing Library is listed in the report's tooling table but is not installed), so screen-level coverage is manual plus typecheck. Worth raising as a Sprint 2 item rather than leaving implied.
