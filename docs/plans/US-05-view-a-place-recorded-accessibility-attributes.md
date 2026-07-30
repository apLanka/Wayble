# US-05: View a Place's Recorded Accessibility Attributes

**Sprint 1 · Epic E3 Place Discovery · 5 pts · Owner M2**

As a user, I can open a place and see its recorded accessibility attributes, so I know whether I can get in.

## Context

The project is a Turborepo monorepo with:

- **Backend**: Convex (`packages/backend/convex/`) — schema already defines `places`, `reports` (with `attributes` array), `verifications`, and `flags` tables with appropriate indexes (`reports.by_place`).
- **Mobile**: Expo Router (`apps/mobile/`) — uses `@gorhom/bottom-sheet`, existing [DetailSheet.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/map/DetailSheet.tsx) shows a place preview but currently reads from mock data (`AccessibleLocation`) and has no accessibility attribute display.
- **Accessibility taxonomy**: Defined in [accessibility.ts](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/packages/backend/convex/accessibility.ts) with 19 attribute keys across 6 categories (mobility, vision, hearing, communication, sensory, assistance).
- **Design system**: [theme.ts](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/constants/theme.ts) provides colors (light/dark), spacing, typography, radii, and sizing tokens. Reusable UI components exist in `components/ui/` ([AppText](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/ui/app-text.tsx), [Screen](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/ui/screen.tsx), [TouchTarget](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/ui/touch-target.tsx)).

---

## Proposed Changes

### 1. Backend — Convex `getPlace` Query

#### [NEW] [places.ts](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/packages/backend/convex/places.ts)

A new Convex query file for place-related reads. Contains:

**`getPlace` query**

- **Args**: `placeId: v.id("places")`
- **Logic**:
  1. Fetch the place document by ID; return `null` if not found.
  2. Fetch all active reports for that place using the `reports.by_place` index, filtering to `status === "active"`.
  3. Aggregate attributes across active reports using a **last-write-wins** strategy — for each attribute key, use the value from the most recent report (by `observedAt`). Notes are preserved from the winning report.
  4. Return a response shaped as:
     ```ts
     {
       _id: Id<"places">,
       name: string,
       category: PlaceCategory,
       address: string,
       location: { latitude: number, longitude: number },
       attributes: Array<{
         key: AccessibilityAttributeKey,
         value: AccessibilityAttributeValue,
         note?: string,
       }>,
       reportCount: number,
       lastReportedAt: number | null,
     }
     ```
- This query is **public** (no auth required) — accessibility data should be viewable by anyone.

#### [NEW] [places.test.ts](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/packages/backend/convex/places.test.ts)

Unit tests using `convex-test` + `vitest` (matching existing test patterns in [schema.test.ts](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/packages/backend/convex/schema.test.ts)):

| Test case                                | Description                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Returns place with aggregated attributes | Seed a place + 2 active reports with overlapping keys; verify last-write-wins merging |
| Returns empty attributes when no reports | Place with zero reports → `attributes: []`, `reportCount: 0`                          |
| Ignores non-active reports               | Seed active + superseded reports; verify only active attributes appear                |
| Returns `null` for nonexistent place     | Pass a fabricated ID → returns `null`                                                 |

---

### 2. Frontend — Shared Accessibility Display Metadata

#### [NEW] [accessibility-metadata.ts](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/constants/accessibility-metadata.ts)

A lookup table mapping each `AccessibilityAttributeKey` to its display metadata:

```ts
export const ATTRIBUTE_METADATA: Record<
  AccessibilityAttributeKey,
  {
    label: string; // Human-readable text (e.g., "Step-free Entrance")
    icon: string; // Expo Symbols SF name (e.g., "figure.roll")
    category: string; // Group label (e.g., "Mobility")
  }
>;
```

This ensures **icons are always paired with text labels** (AC requirement) since the metadata is consumed as a pair.

Also includes:

- `CATEGORY_DISPLAY_ORDER`: Array defining the order categories appear on-screen.
- `VALUE_LABELS`: Human-readable labels for attribute values (`yes` → "Available", `no` → "Not available", `partial` → "Partially available", `unknown` → "Unknown", `not_applicable` → "N/A").
- `VALUE_COLORS`: Theme-aware color tokens for each attribute value (e.g., `yes` → `success`, `no` → `danger`, `partial` → `warning`).

---

### 3. Frontend — Place Detail Screen

#### [NEW] [place-detail.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/app/place/[id].tsx)

A new **dynamic route** accessible at `/place/[id]` (Expo Router file-based routing). This is a full-screen stack route (not a tab), pushed from the map's bottom sheet or any place link.

**Screen layout** (top to bottom):

1. **Header bar** (via Stack.Screen options): Place name as title, back button
2. **Place info section**: Name (`title` variant), category badge (pill with color), address (with `textMuted` color)
3. **Attributes section** (when attributes exist):
   - Section header: "Accessibility Attributes" with report count badge
   - Grouped by category (Mobility, Vision, Hearing, etc.) with group headers
   - Each attribute rendered as a row: `[Icon] [Label] — [Value badge]`
   - Icons always shown **with** their text label (never icon-only)
   - Value badges color-coded (green=yes, red=no, amber=partial, grey=unknown/N/A)
   - Optional note shown below the attribute row in muted text
4. **No-data state** (when `attributes` is empty):
   - Illustration/icon area with a `"magnifying glass"` or `"plus.circle"` icon
   - "No accessibility data yet" heading
   - "Be the first to contribute! Share what you know about this place's accessibility." descriptive text
   - "Contribute Accessibility Info" CTA button (using `TouchTarget` + `primary` color)
   - The CTA button is a placeholder for now — it will navigate to the report submission flow in a future story

**Key implementation details**:

- Uses `useQuery(api.places.getPlace, { placeId })` from Convex React client
- Loading state: skeleton placeholder while query resolves
- Error state: graceful fallback if place not found
- Theme-aware: uses `useAppTheme()` for all colors, spacing, typography
- Accessibility: all interactive elements have `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` props
- Uses existing `AppText` for text, `TouchTarget` for buttons

#### [MODIFY] [_layout.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/app/_layout.tsx)

Register the new place detail route in the root Stack navigator:

```diff
 <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
 <Stack.Screen name="debug" options={{ title: "Debug" }} />
+<Stack.Screen name="place/[id]" options={{ title: "Place Details" }} />
```

---

### 4. Frontend — Reusable Components

#### [NEW] [AttributeRow.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/place/AttributeRow.tsx)

Renders a single accessibility attribute:

- **Layout**: Horizontal row → `[Icon 20×20] [Gap 8px] [Label flex:1] [Value Badge]`
- Icon sourced from `expo-symbols` (SF Symbols), always rendered alongside text label
- Value badge: colored pill with text label from `VALUE_LABELS`
- Optional note: collapsible text below the row in `textMuted` color
- Uses theme tokens for all styling

#### [NEW] [AttributeGroup.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/place/AttributeGroup.tsx)

Groups attributes by category:

- Section header with category name (e.g., "Mobility", "Vision")
- Renders a list of `AttributeRow` components
- Visual separator between groups

#### [NEW] [NoDataPrompt.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/place/NoDataPrompt.tsx)

The "no data yet" empty state:

- Centered layout with icon, heading, description, CTA
- Uses `AppText` variants for heading and body
- CTA button styled with `primary` color via `TouchTarget`
- `onContribute` callback prop (currently a no-op / placeholder navigation)

#### [NEW] [CategoryBadge.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/place/CategoryBadge.tsx)

Reusable place category pill badge:

- Displays formatted category label (e.g., "food_and_drink" → "Food & Drink")
- Color-coded background per category
- Compact pill shape using `radii.pill`

---

### 5. Frontend — Navigation Integration

#### [MODIFY] [DetailSheet.tsx](file:///c:/Users/aaththika_i/Desktop/Wayble/Wayble/apps/mobile/components/map/DetailSheet.tsx)

Add a "View Details" button/row that navigates to the new place detail screen:

- Add a `TouchTarget` at the bottom of the sheet content
- On press: `router.push(\`/place/${placeId}\`)`using`expo-router`'s `useRouter`
- This bridges the existing map bottom sheet → new detail screen

> [!IMPORTANT]
> The current `DetailSheet` uses mock data (`AccessibleLocation` from `data/mock-data.ts`). This story should update it to accept a Convex place ID so it can link to the real detail screen. However, a full migration of the map views from mock data to Convex is out of scope for this story — we'll add the "View Details" link using the place ID when available, and keep mock data support as a fallback.

---

## File Summary

| Layer    | File                                  | Action | Description                                 |
| -------- | ------------------------------------- | ------ | ------------------------------------------- |
| Backend  | `convex/places.ts`                    | NEW    | `getPlace` query with report aggregation    |
| Backend  | `convex/places.test.ts`               | NEW    | Unit tests for `getPlace` query             |
| Frontend | `constants/accessibility-metadata.ts` | NEW    | Attribute display labels, icons, categories |
| Frontend | `app/place/[id].tsx`                  | NEW    | Place detail screen                         |
| Frontend | `app/_layout.tsx`                     | MODIFY | Register place detail route                 |
| Frontend | `components/place/AttributeRow.tsx`   | NEW    | Single attribute display row                |
| Frontend | `components/place/AttributeGroup.tsx` | NEW    | Category-grouped attributes                 |
| Frontend | `components/place/NoDataPrompt.tsx`   | NEW    | Empty state with CTA                        |
| Frontend | `components/place/CategoryBadge.tsx`  | NEW    | Reusable category pill badge                |
| Frontend | `components/map/DetailSheet.tsx`      | MODIFY | Add "View Details" navigation link          |

---

## Open Questions

> [!IMPORTANT]
> **Aggregation strategy**: The plan uses **last-write-wins** (most recent `observedAt` per attribute key). Should we instead use a majority-vote approach across reports, or is last-write-wins acceptable for Sprint 1?

> [!NOTE]
> **Icon library**: The plan uses `expo-symbols` (SF Symbols) which is already in the project's dependencies. On Android, these fall back to Material icons. Should we use a different icon library (e.g., `@expo/vector-icons` with MaterialCommunityIcons) for more consistent cross-platform rendering?

> [!NOTE]
> **Contribute CTA behavior**: The "Contribute Accessibility Info" button in the no-data state is a placeholder for now. Should it navigate to an existing screen, show a toast/snackbar saying "Coming soon", or just be disabled?

---

## Verification Plan

### Automated Tests

```bash
cd packages/backend && npx vitest run places.test.ts
```

- Validates `getPlace` query logic: aggregation, empty state, status filtering, null return

### Manual Verification

- Launch the Expo dev client
- Navigate from map → tap a pin → bottom sheet → "View Details" → verify place detail screen renders name, category, address
- Verify attribute list displays with icon + text label (never icon-only)
- Test with a place that has no reports → verify "No data yet" state with CTA
- Toggle light/dark mode → verify all elements theme correctly
- Run screen reader (TalkBack/VoiceOver) → verify all elements are announced correctly
