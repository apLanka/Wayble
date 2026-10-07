import type { ConfidenceTier } from "@packages/backend/convex/confidence";

/** Display metadata for confidence tiers, mirroring accessibility-metadata.ts's shape. */

export const CONFIDENCE_LABELS: Record<ConfidenceTier, string> = {
  unverified: "Unverified",
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export const CONFIDENCE_SEMANTIC_COLORS: Record<
  ConfidenceTier,
  "success" | "warning" | "danger" | "textMuted"
> = {
  unverified: "textMuted",
  low: "danger",
  medium: "warning",
  high: "success",
};
