import type { AccessibilityAttributeKey } from "@packages/backend/convex/accessibility";

/**
 * Display metadata for each accessibility attribute key.
 *
 * Every attribute has a human-readable label and an icon name so that
 * icons are **always paired with a text label** (never icon-only).
 *
 * Icon names reference SF Symbols (used by `expo-symbols`) with Material
 * Design fallbacks handled automatically by Expo on Android.
 */

export type AttributeDisplayMeta = {
  /** Human-readable text label */
  label: string;
  /** SF Symbol name for expo-symbols */
  icon: string;
  /** Display group (e.g., "Mobility", "Vision") */
  category: string;
};

export const ATTRIBUTE_METADATA: Record<
  AccessibilityAttributeKey,
  AttributeDisplayMeta
> = {
  // ── Mobility ──────────────────────────────────────────────
  "mobility.step_free_entrance": {
    label: "Step-free Entrance",
    icon: "figure.roll",
    category: "Mobility",
  },
  "mobility.wide_entrance": {
    label: "Wide Entrance",
    icon: "door.left.hand.open",
    category: "Mobility",
  },
  "mobility.step_free_interior": {
    label: "Step-free Interior",
    icon: "arrow.left.arrow.right",
    category: "Mobility",
  },
  "mobility.elevator": {
    label: "Elevator",
    icon: "arrow.up.arrow.down",
    category: "Mobility",
  },
  "mobility.accessible_restroom": {
    label: "Accessible Restroom",
    icon: "toilet",
    category: "Mobility",
  },
  "mobility.accessible_parking": {
    label: "Accessible Parking",
    icon: "car",
    category: "Mobility",
  },
  "mobility.wheelchair_seating": {
    label: "Wheelchair Seating",
    icon: "chair",
    category: "Mobility",
  },

  // ── Vision ────────────────────────────────────────────────
  "vision.braille_signage": {
    label: "Braille Signage",
    icon: "hand.point.up.braille",
    category: "Vision",
  },
  "vision.tactile_guidance": {
    label: "Tactile Guidance",
    icon: "hand.raised",
    category: "Vision",
  },
  "vision.high_contrast_signage": {
    label: "High Contrast Signage",
    icon: "eye",
    category: "Vision",
  },
  "vision.visual_hazard_marking": {
    label: "Visual Hazard Marking",
    icon: "exclamationmark.triangle",
    category: "Vision",
  },

  // ── Hearing ───────────────────────────────────────────────
  "hearing.hearing_loop": {
    label: "Hearing Loop",
    icon: "ear",
    category: "Hearing",
  },
  "hearing.visual_alarms": {
    label: "Visual Alarms",
    icon: "bell",
    category: "Hearing",
  },

  // ── Communication ─────────────────────────────────────────
  "communication.accessible_service_option": {
    label: "Accessible Service Option",
    icon: "bubble.left.and.bubble.right",
    category: "Communication",
  },

  // ── Sensory ───────────────────────────────────────────────
  "sensory.clear_signage": {
    label: "Clear Signage",
    icon: "signpost.right",
    category: "Sensory",
  },
  "sensory.quiet_space": {
    label: "Quiet Space",
    icon: "speaker.slash",
    category: "Sensory",
  },
  "sensory.low_stimulation_option": {
    label: "Low Stimulation Option",
    icon: "light.min",
    category: "Sensory",
  },

  // ── Assistance ────────────────────────────────────────────
  "assistance.service_animals": {
    label: "Service Animals Allowed",
    icon: "dog",
    category: "Assistance",
  },
  "assistance.staff_support": {
    label: "Staff Support Available",
    icon: "person.2",
    category: "Assistance",
  },
};

/** Ordered list of category display names for consistent rendering. */
export const CATEGORY_DISPLAY_ORDER = [
  "Mobility",
  "Vision",
  "Hearing",
  "Communication",
  "Sensory",
  "Assistance",
] as const;

/** Human-readable labels for attribute values. */
export const VALUE_LABELS: Record<string, string> = {
  yes: "Available",
  no: "Not available",
  partial: "Partial",
  unknown: "Unknown",
  not_applicable: "N/A",
};

/**
 * Semantic color keys (referencing theme token names) for each attribute value.
 * Consumed by components to pick the right color from the active theme.
 */
export const VALUE_SEMANTIC_COLORS: Record<
  string,
  "success" | "danger" | "warning" | "textMuted"
> = {
  yes: "success",
  no: "danger",
  partial: "warning",
  unknown: "textMuted",
  not_applicable: "textMuted",
};

/**
 * Human-readable labels for place categories.
 */
export const PLACE_CATEGORY_LABELS: Record<string, string> = {
  education: "Education",
  food_and_drink: "Food & Drink",
  government: "Government",
  healthcare: "Healthcare",
  lodging: "Lodging",
  outdoor: "Outdoor",
  retail: "Retail",
  transport: "Transport",
  workplace: "Workplace",
  other: "Other",
};

/**
 * Colors for place category badges.
 */
export const PLACE_CATEGORY_COLORS: Record<string, string> = {
  education: "#1565C0",
  food_and_drink: "#E65100",
  government: "#4527A0",
  healthcare: "#C62828",
  lodging: "#00695C",
  outdoor: "#2E7D32",
  retail: "#6A1B9A",
  transport: "#37474F",
  workplace: "#455A64",
  other: "#616161",
};
