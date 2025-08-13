import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  song: defineTable({
    submitter: v.object({
      name: v.string(),
      email: v.string(),
    }),

    additionalInfo: v.optional(v.string()),

    notes: v.optional(v.string()),
    
    accepted: v.boolean(),

    submissionType: v.union(
      v.literal("search"),
      v.literal("youtube"),
      v.literal("file")
    ),

    songSearch: v.optional(v.string()), 
    youtubeUrl: v.optional(v.string()), 
    songFile: v.optional(v.string()),
  }),
});
