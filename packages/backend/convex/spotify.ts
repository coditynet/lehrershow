import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { ActionCache } from "@convex-dev/action-cache";
import { components, internal } from "./_generated/api";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

export const fetchSpotifyToken = internalAction({
  args: {},
  handler: async (): Promise<string> => {
    const authHeader =
      "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Spotify token");
    }

    const data = await response.json();
    return data.access_token as string;
  },
});

const spotifyTokenCache = new ActionCache(components.actionCache, {
  action: internal.spotify.fetchSpotifyToken,
  name: "spotifyTokenV1",
  ttl: 1000 * 60 * 50, // 50 minutes
});

export const search = action({
  args: { query: v.string() },
  handler: async (
    ctx,
    { query }
  ): Promise<
    Array<{
      id: string;
      title: string;
      artist: string;
      albumArt: string | null;
      spotifyUrl: string;
    }>
  > => {
    const token = await spotifyTokenCache.fetch(ctx, {});

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Spotify search failed");
    }

    const data = await response.json();

    return data.tracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      albumArt: track.album.images?.[0]?.url ?? null,
      spotifyUrl: track.external_urls.spotify,
    }));
  },
});

export const getById = action({
  args: { id: v.string() },
  handler: async (
    ctx,
    { id }
  ): Promise<{
    id: string;
    title: string;
    artist: string;
    albumArt: string | null;
    spotifyUrl: string;
    albumName: string;
    durationMs: number;
    previewUrl: string | null;
  }> => {
    const token = await spotifyTokenCache.fetch(ctx, {});

    const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify getById failed for id=${id}`);
    }

    const track = await response.json();

    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      albumArt: track.album.images?.[0]?.url ?? null,
      spotifyUrl: track.external_urls.spotify,
      albumName: track.album.name,
      durationMs: track.duration_ms,
      previewUrl: track.preview_url,
    };
  },
});