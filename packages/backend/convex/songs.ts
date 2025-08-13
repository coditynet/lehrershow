import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

/**
 * Expect an environment variable UPLOADTHING_ID that contains the
 * subdomain/tenant id part of the UploadThing URL (e.g. `epsx952932`).
 *
 * Example valid URL:
 *   https://epsx952932.ufs.sh/f/tNGxt6IZe7CDXwOTNSo4D57yKXqnux8wig0bpotAhcmlzrkN
 *
 * Add to your .env:
 *   UPLOADTHING_ID=epsx952932
 */
const UPLOADTHING_ID = process.env.UPLOADTHING_ID;
if (!UPLOADTHING_ID) {
  throw new Error(
    "Missing env var UPLOADTHING_ID. Please set UPLOADTHING_ID in your environment."
  );
}

const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([A-Za-z0-9_-]{11})(?:\S+)?$/i;

/**
 * Extract a YouTube video id from a variety of YouTube URLs (and plain IDs).
 * Returns the 11-character id or null if none found.
 */
function extractYouTubeId(input: string): string | null {
  if (!input) return null;

  const match = input.match(YOUTUBE_URL_REGEX);
  if (match && match[1]) {
    return match[1];
  }

  // If the input itself is exactly a 11-char video id
  const plainId = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(plainId)) {
    return plainId;
  }

  return null;
}

/**
 * Validate an UploadThing file URL using the configured UPLOADTHING_ID.
 * Accepts https only, host must be `${UPLOADTHING_ID}.ufs.sh`.
 * Path must start with `/f/` followed by a file key (alphanumeric + - _).
 */
function isValidUploadThingUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") return false;

    const expectedHost = `${UPLOADTHING_ID}.ufs.sh`;
    if (parsed.host !== expectedHost) return false;

    const match = parsed.pathname.match(/^\/f\/([A-Za-z0-9_-]+)(?:\/.*)?$/);
    if (!match) return false;

    const token = match[1];
    if (token.length < 8 || token.length > 256) return false;

    return true;
  } catch {
    return false;
  }
}

export const addSong = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    additionalInfo: v.optional(v.string()),
    submissionType: v.union(
      v.literal("search"),
      v.literal("youtube"),
      v.literal("file")
    ),
    songSearch: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    songFile: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      name,
      email,
      additionalInfo,
      submissionType,
      songSearch,
      youtubeUrl,
      songFile,
    } = args;

    let youtubeId: string;

    if (!name || !name.trim()) throw new ConvexError("Name is required.");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ConvexError("A valid email is required.");

    if (submissionType === "search") {
      if (!songSearch || !songSearch.trim()) {
        throw new ConvexError("For search submissions, provide a songSearch value.");
      }
    } else if (submissionType === "youtube") {
      if (!youtubeUrl || !youtubeUrl.trim()) {
        throw new ConvexError("For YouTube submissions, provide a youtubeUrl.");
      }

      const id = extractYouTubeId(youtubeUrl.trim());
      if (!id) {
        throw new ConvexError("Please provide a valid YouTube URL or video id.");
      }

      youtubeId = id
    } else if (submissionType === "file") {
      if (!songFile || !songFile.trim()) {
        throw new ConvexError("For file submissions, provide a songFile URL.");
      }

      if (!isValidUploadThingUrl(songFile.trim())) {
        throw new ConvexError(
          "songFile must be a valid UploadThing URL served from the configured UPLOADTHING_ID."
        );
      }
    } else {
      throw new ConvexError("Invalid submission type."); // defensive. should b in v.union???? 
    }


    const id = await ctx.db.insert("songs", {
        submitter: {
            name: name.trim(),
            email: email.trim(),
        },

        submissionType,
        songSearch: songSearch?.trim() ?? undefined,
        youtubeUrl: args.youtubeUrl?.trim() ?? undefined,
        songFile: songFile?.trim() ?? undefined,
        additionalInfo: additionalInfo?.trim() ?? undefined,
        isAccepted: false
    });

    return { id };
  },
});


export const listApproved = query({
    handler: async(ctx) => {
        const identity  = await ctx.auth.getUserIdentity();

        if (!identity?.subject) {
            throw new ConvexError ("Unauthorized")
        }

        const songs = ctx.db.query("songs").withIndex("by_accepted", q => q.eq("isAccepted", true))
    },
})