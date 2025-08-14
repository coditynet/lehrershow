import { mutation, query, action, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Expect an environment variable UPLOADTHING_ID that contains the
 * subdomain/tenant id part of the UploadThing URL (e.g. `epsx952932`).
 */
const UPLOADTHING_ID = process.env.UPLOADTHING_ID;
if (!UPLOADTHING_ID) {
  throw new Error(
    "Missing env var UPLOADTHING_ID. Please set UPLOADTHING_ID in your environment."
  );
}

/**
 * YouTube Data API v3 key - add this to your environment variables
 */
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  throw new Error(
    "Missing env var YOUTUBE_API_KEY. Please set YOUTUBE_API_KEY in your environment."
  );
}

const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([A-Za-z0-9_-]{11})(?:\S+)?$/i;

/**
 * Extract a YouTube video id from a variety of YouTube URLs (and plain IDs).
 */
function extractYouTubeId(input: string): string | null {
  if (!input) return null;

  const match = input.match(YOUTUBE_URL_REGEX);
  if (match && match[1]) {
    return match[1];
  }

  const plainId = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(plainId)) {
    return plainId;
  }

  return null;
}

/**
 * Validate an UploadThing file URL using the configured UPLOADTHING_ID.
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

/**
 * Action to fetch YouTube video info using YouTube Data API v3
 */
export const fetchYouTubeInfo = action({
  args: {
    videoId: v.string(),
  },
  handler: async (ctx, { videoId }) => {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.warn(`YouTube API returned ${response.status} for video ${videoId}`);
        return { title: undefined, channelName: undefined };
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.warn(`No video found for ID ${videoId}`);
        return { title: undefined, channelName: undefined };
      }
      
      const snippet = data.items[0].snippet;
      
      return {
        title: snippet.title || undefined,
        channelName: snippet.channelTitle || undefined,
      };
    } catch (error) {
      console.warn(`Failed to fetch YouTube info for video ${videoId}:`, error);
      return { title: undefined, channelName: undefined };
    }
  },
});

/**
 * Internal mutation to create a song record
 */
export const createSong = internalMutation({
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
    youtubeId: v.optional(v.string()),
    title: v.optional(v.string()),
    artist: v.optional(v.string()),
    songFile: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("songs", {
      submitter: {
        name: args.name.trim(),
        email: args.email.trim(),
      },
      submissionType: args.submissionType,
      songSearch: args.songSearch?.trim() ?? undefined,
      youtubeId: args.youtubeId ?? undefined,
      title: args.title ?? undefined,
      artist: args.artist ?? undefined,
      songFile: args.songFile?.trim() ?? undefined,
      additionalInfo: args.additionalInfo?.trim() ?? undefined,
      isAccepted: false,
    });

    return { id };
  },
});

/**
 * Main action to add a song (handles validation and external API calls)
 */
export const addSong = action({
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
    turnstileToken: v.string(),
    songName: v.optional(v.string())
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
      songName,
      turnstileToken,
    } = args;

    if (!turnstileToken) throw new ConvexError("Captcha token required.");

    const verifyResult: { success?: boolean } = await ctx.runAction(api.turnstile.verify, {
      token: turnstileToken,
    });
    if (!verifyResult || !verifyResult.success) {
      throw new ConvexError("Captcha verification failed.");
    }

    let youtubeId = undefined;
    let youtubeTitle = undefined;
    let youtubeChannelName = undefined;

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

      youtubeId = id;

      const youtubeInfo: { title?: string; channelName?: string; } = await ctx.runAction(api.songs.fetchYouTubeInfo, {
        videoId: id,
      });
      youtubeTitle = youtubeInfo.title;
      youtubeChannelName = youtubeInfo.channelName;
      
    } else if (submissionType === "file") {
      if (!songFile || !songFile.trim()) {
        throw new ConvexError("For file submissions, provide a songFile URL.");
      }

      if (!isValidUploadThingUrl(songFile.trim())) {
        throw new ConvexError(
          "songFile must be a valid UploadThing URL served from the configured UPLOADTHING_ID."
        );
      }

      if (!songName || !songName.trim()) {
        throw new ConvexError(
          "For file submissions, please provide a songName."
        );
      }
    } else {
      throw new ConvexError("Invalid submission type.");
    }

    let finalTitle: string | undefined;
    let finalArtist: string | undefined;

    if (submissionType === "youtube") {
      finalTitle = youtubeTitle;
      finalArtist = youtubeChannelName || name; 
    } else if (submissionType === "search") {
      finalTitle = songSearch;
      finalArtist = name; 
    } else if (submissionType === "file") {
      finalTitle = songName;
      finalArtist = name; 
    } else {
      finalTitle = undefined;
      finalArtist = undefined;
    }


    const result: { id: Id<"songs"> } = await ctx.runMutation(internal.songs.createSong, {
      name,
      email,
      additionalInfo,
      submissionType,
      songSearch,
      youtubeId,
      title: finalTitle, 
      artist: finalArtist, 
      songFile,
    });

    return result;
  },
});

export const listApproved = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.subject) {
      throw new ConvexError("Unauthorized");
    }

    const songs = await ctx.db
      .query("songs")
      .withIndex("by_accepted", q => q.eq("isAccepted", true))
      .collect();

    return songs;
  },
});