import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  ACCESSIBILITY_TAXONOMY_VERSION,
  accessibilityAttributeKeyValidator,
  accessibilityAttributeValidator,
} from "./accessibility";

export const userRoleValidator = v.union(
  v.literal("member"),
  v.literal("moderator"),
  v.literal("admin"),
);

export const placeCategoryValidator = v.union(
  v.literal("education"),
  v.literal("food_and_drink"),
  v.literal("government"),
  v.literal("healthcare"),
  v.literal("lodging"),
  v.literal("outdoor"),
  v.literal("retail"),
  v.literal("transport"),
  v.literal("workplace"),
  v.literal("other"),
);

// Mobile map's accessibility-feature category (pin color/filter) — orthogonal
// to placeCategoryValidator's business type. Optional/additive: not every
// place has this set.
export const accessibilityCategoryValidator = v.union(
  v.literal("wheelchair"),
  v.literal("elevator"),
  v.literal("bathroom"),
  v.literal("multi"),
);

const reportStatusValidator = v.union(
  v.literal("active"),
  v.literal("superseded"),
  v.literal("removed"),
);

const verificationVerdictValidator = v.union(
  v.literal("confirm"),
  v.literal("dispute"),
);

const flagReasonValidator = v.union(
  v.literal("inaccurate"),
  v.literal("spam"),
  v.literal("abusive"),
  v.literal("privacy"),
  v.literal("duplicate"),
  v.literal("other"),
);

const flagStatusValidator = v.union(
  v.literal("open"),
  v.literal("resolved"),
  v.literal("dismissed"),
);

const locationValidator = v.object({
  latitude: v.number(),
  longitude: v.number(),
});

const evidenceValidator = v.object({
  storageId: v.id("_storage"),
  caption: v.optional(v.string()),
});

export default defineSchema({
  ...authTables,

  health: defineTable({
    count: v.number(),
  }),

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.optional(userRoleValidator),
    // US-02: the accessibility attributes this user personally needs, drawn
    // from the same taxonomy that reports use. Optional so existing users
    // need no migration; an empty array means "explicitly cleared".
    accessibilityNeeds: v.optional(v.array(accessibilityAttributeKeyValidator)),
    updatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  places: defineTable({
    name: v.string(),
    category: placeCategoryValidator,
    address: v.string(),
    location: locationValidator,
    createdBy: v.id("users"),
    updatedAt: v.number(),
    accessibilityCategories: v.optional(
      v.array(accessibilityCategoryValidator),
    ),
    features: v.optional(v.array(v.string())),
  }).searchIndex("search_name", { searchField: "name" }),

  reports: defineTable({
    placeId: v.id("places"),
    authorId: v.id("users"),
    taxonomyVersion: v.literal(ACCESSIBILITY_TAXONOMY_VERSION),
    attributes: v.array(accessibilityAttributeValidator),
    summary: v.optional(v.string()),
    evidence: v.array(evidenceValidator),
    observedAt: v.number(),
    status: reportStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_place", ["placeId"])
    .index("by_author", ["authorId"]),

  verifications: defineTable({
    reportId: v.id("reports"),
    authorId: v.id("users"),
    verdict: verificationVerdictValidator,
    note: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_report", ["reportId"])
    .index("by_author", ["authorId"])
    .index("by_report_and_author", ["reportId", "authorId"]),

  flags: defineTable({
    reportId: v.id("reports"),
    authorId: v.id("users"),
    reason: flagReasonValidator,
    details: v.optional(v.string()),
    status: flagStatusValidator,
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_report", ["reportId"])
    .index("by_author", ["authorId"]),
});
