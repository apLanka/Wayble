import type { AccessibilityAttributeKey } from "./accessibility";
import { describeAge } from "./confidence";
import type { VerificationNeed } from "./verificationNeed";

/**
 * Notification text, built server-side.
 *
 * WHY THIS FILE OWNS ITS OWN LABELS: push copy is generated on the server,
 * but the display metadata used by the app lives in
 * `apps/mobile/constants/accessibility-metadata.ts`, which the backend cannot
 * import — and `accessibility.ts` deliberately keeps attribute keys free of
 * presentation text. So these 19 strings are a knowing duplication, held
 * honest by a test asserting they cover `ACCESSIBILITY_ATTRIBUTE_KEYS`.
 * When US-22 makes push copy per-locale, this map is the right place to
 * replace with a locale lookup.
 *
 * Labels are lowercase because they appear mid-sentence.
 */
export const PUSH_ATTRIBUTE_LABELS: Record<AccessibilityAttributeKey, string> =
  {
    "mobility.step_free_entrance": "step-free entrance",
    "mobility.wide_entrance": "wide entrance",
    "mobility.step_free_interior": "step-free interior",
    "mobility.elevator": "elevator",
    "mobility.accessible_restroom": "accessible restroom",
    "mobility.accessible_parking": "accessible parking",
    "mobility.wheelchair_seating": "wheelchair seating",
    "vision.braille_signage": "braille signage",
    "vision.tactile_guidance": "tactile guidance",
    "vision.high_contrast_signage": "high-contrast signage",
    "vision.visual_hazard_marking": "visual hazard marking",
    "hearing.hearing_loop": "hearing loop",
    "hearing.visual_alarms": "visual alarms",
    "communication.accessible_service_option": "accessible service option",
    "sensory.clear_signage": "clear signage",
    "sensory.quiet_space": "quiet space",
    "sensory.low_stimulation_option": "low-stimulation option",
    "assistance.service_animals": "service animal access",
    "assistance.staff_support": "staff support",
  };

export function buildVerifyNearbyPush(args: {
  placeName: string;
  need: VerificationNeed;
  attributeKey?: AccessibilityAttributeKey;
}): { title: string; body: string } {
  const { placeName, need, attributeKey } = args;

  if (!need.needed) {
    throw new Error(
      `Cannot build copy for a place that does not need verification: ${placeName}`,
    );
  }

  const title = `${placeName} needs a check`;
  const subject = attributeKey
    ? `the ${PUSH_ATTRIBUTE_LABELS[attributeKey]}`
    : null;

  if (need.reason === "never_reported") {
    const body = subject
      ? `Nobody has confirmed ${subject} at ${placeName}. You're nearby — can you check?`
      : `${placeName} has no accessibility information yet. You're nearby — can you add some?`;
    return { title, body };
  }

  const age = describeAge(need.ageDays ?? 0);
  const body = attributeKey
    ? `${placeName}'s ${PUSH_ATTRIBUTE_LABELS[attributeKey]} was last confirmed ${age} ago. You're nearby — is it still right?`
    : `${placeName}'s accessibility information is ${age} old. You're nearby — is it still right?`;
  return { title, body };
}
