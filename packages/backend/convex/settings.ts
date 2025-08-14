// functions/settings.ts
import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Single setting shape
 */
type SimpleSettings = {
  allowNewSubmissions: boolean;
};

const DEFAULTS: SimpleSettings = {
  allowNewSubmissions: true,
};

/**
 * Query: return the single settings row or defaults
 */
export const get = query({
  handler: async (ctx): Promise<SimpleSettings> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new ConvexError("Unauthorized");
    }

    const rows = await ctx.db.query("settings").collect();
    if (!rows || rows.length === 0) return DEFAULTS;

    const row = rows[0] as Partial<SimpleSettings> & { updatedAt?: string };
    return {
      allowNewSubmissions:
        typeof row.allowNewSubmissions === "boolean"
          ? row.allowNewSubmissions
          : DEFAULTS.allowNewSubmissions,
    };
  },
});

/**
 * Mutation: update (or insert) the single settings row.
 * Accepts a single boolean: allowNewSubmissions
 */
export const update = mutation({
  args: {
    allowNewSubmissions: v.boolean(),
  },
  handler: async (
    ctx,
    { allowNewSubmissions }
  ): Promise<{ id: Id<"settings"> }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new ConvexError("Unauthorized");
    }

    const toSave: SimpleSettings = {
      allowNewSubmissions,
    };

    const rows = await ctx.db.query("settings").collect();

    if (!rows || rows.length === 0) {
      const id = await ctx.db.insert("settings", toSave);
      return { id };
    }

    // Use two-arg patch (table, patchObj including _id).
    // If your Convex SDK uses the 3-arg form (table, id, patch), change accordingly.
    const existingId = rows[0]._id as Id<"settings">;
    const patchObj = { _id: existingId, ...toSave };

    await ctx.db.patch(existingId, patchObj);

    return { id: existingId };
  },
});