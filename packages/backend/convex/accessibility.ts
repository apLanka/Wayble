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
