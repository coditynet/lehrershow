import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  songs: defineTable({
    submitter: v.object({
      name: v.string(),
      email: v.string(),
    }),

    title: v.optional(v.string()),
    artist: v.optional(v.string()),

    additionalInfo: v.optional(v.string()),

    notes: v.optional(v.string()),
    
    isAccepted: v.boolean(),

    submissionType: v.union(
      v.literal("search"),
      v.literal("youtube"),
      v.literal("file")
    ),

    image: v.optional(v.string()),
    spotifyId: v.optional(v.string()), 
    youtubeId: v.optional(v.string()), 
    songFile: v.optional(v.string()),
  }).index("by_accepted", ["isAccepted"]),
  settings: defineTable({
    allowNewSubmissions: v.boolean(),
  })
});
