import { v, type Infer } from "convex/values";

/**
 * Persisted accessibility vocabulary for reports.
 *
 * Attribute keys are machine-readable and intentionally independent from
 * localized display labels. Breaking changes to keys or state semantics
 * require a new taxonomy version and a migration plan. Duplicate attribute
 * keys and context-dependent note requirements are enforced by mutations,
 * not by this document validator.
 */
export const ACCESSIBILITY_TAXONOMY_VERSION = 1 as const;

/**
 * The result of assessing one accessibility characteristic.
 *
 * An omitted key means "not assessed". `unknown` means the author attempted
 * to assess it but could not determine the result. `not_applicable` means the
 * characteristic does not apply to the place.
 */
export const accessibilityAttributeValueValidator = v.union(
  v.literal("yes"),
  v.literal("no"),
  v.literal("partial"),
  v.literal("unknown"),
  v.literal("not_applicable"),
);

/**
 * Version 1 accessibility attribute keys.
 *
 * Keep these identifiers stable and presentation-neutral. Additions,
 * removals, renames, or changes in meaning require a taxonomy version review.
 */
export const accessibilityAttributeKeyValidator = v.union(
  v.literal("mobility.step_free_entrance"),
  v.literal("mobility.wide_entrance"),
  v.literal("mobility.step_free_interior"),
  v.literal("mobility.elevator"),
  v.literal("mobility.accessible_restroom"),
  v.literal("mobility.accessible_parking"),
  v.literal("mobility.wheelchair_seating"),
  v.literal("vision.braille_signage"),
  v.literal("vision.tactile_guidance"),
  v.literal("vision.high_contrast_signage"),
  v.literal("vision.visual_hazard_marking"),
  v.literal("hearing.hearing_loop"),
  v.literal("hearing.visual_alarms"),
  v.literal("communication.accessible_service_option"),
  v.literal("sensory.clear_signage"),
  v.literal("sensory.quiet_space"),
  v.literal("sensory.low_stimulation_option"),
  v.literal("assistance.service_animals"),
  v.literal("assistance.staff_support"),
);

/** A single structured accessibility observation within a report. */
export const accessibilityAttributeValidator = v.object({
  key: accessibilityAttributeKeyValidator,
  value: accessibilityAttributeValueValidator,
  note: v.optional(v.string()),
});

export type AccessibilityAttributeKey = Infer<
  typeof accessibilityAttributeKeyValidator
>;
export type AccessibilityAttributeValue = Infer<
  typeof accessibilityAttributeValueValidator
>;
export type AccessibilityAttribute = Infer<
  typeof accessibilityAttributeValidator
>;

/**
 * Every version 1 attribute key, in the order they should be presented.
 *
 * The validator above defines the vocabulary but cannot be iterated, and UI
 * that offers the user a choice of attributes (US-02 needs selection) has to
 * enumerate them. Keep this list in step with the validator — the assertion
 * below fails `tsc` if a key is added to the union but not here.
 */
export const ACCESSIBILITY_ATTRIBUTE_KEYS = [
  "mobility.step_free_entrance",
  "mobility.wide_entrance",
  "mobility.step_free_interior",
  "mobility.elevator",
  "mobility.accessible_restroom",
  "mobility.accessible_parking",
  "mobility.wheelchair_seating",
  "vision.braille_signage",
  "vision.tactile_guidance",
  "vision.high_contrast_signage",
  "vision.visual_hazard_marking",
  "hearing.hearing_loop",
  "hearing.visual_alarms",
  "communication.accessible_service_option",
  "sensory.clear_signage",
  "sensory.quiet_space",
  "sensory.low_stimulation_option",
  "assistance.service_animals",
  "assistance.staff_support",
] as const satisfies readonly AccessibilityAttributeKey[];

/**
 * Compile-time proof that `ACCESSIBILITY_ATTRIBUTE_KEYS` covers the whole
 * union. If a key is missing, `Exclude<...>` is non-`never` and this fails.
 */
type _EveryAttributeKeyIsListed =
  Exclude<
    AccessibilityAttributeKey,
    (typeof ACCESSIBILITY_ATTRIBUTE_KEYS)[number]
  > extends never
    ? true
    : never;
const _everyAttributeKeyIsListed: _EveryAttributeKeyIsListed = true;
void _everyAttributeKeyIsListed;
