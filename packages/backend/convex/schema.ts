import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  health: defineTable({
    count: v.number(),
  }),
});
