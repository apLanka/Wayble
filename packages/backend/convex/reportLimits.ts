/**
 * Limits shared by the report submission mutation and the report form UI.
 *
 * No imports and no I/O on purpose: the mutation enforces these and the
 * wizard needs the same numbers for its character counter and `maxLength`,
 * so both sides read them from here rather than hard-coding two copies that
 * can drift apart.
 */

/** Maximum characters in a report's overall `summary`. */
export const MAX_SUMMARY_LENGTH = 500;

/** Maximum characters in a single attribute's `note`. */
export const MAX_NOTE_LENGTH = 280;

/** A user may report on the same place at most once per this window. */
export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** How far ahead of server time a client clock may claim to have observed. */
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/** How far back a report may claim to have been observed. */
export const MAX_OBSERVATION_AGE_MS = 365 * 24 * 60 * 60 * 1000;
