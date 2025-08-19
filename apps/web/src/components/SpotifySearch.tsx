"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@ls/backend/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SpotifySong = {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string;
};

export function SpotifySearch({ field }: { field: any }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifySong[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SpotifySong | null>(null);

  const searchSpotify = useAction(api.spotify.search);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchSpotify({ query: q });
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSong = (song: SpotifySong) => {
    setSelectedSong(song);
    field.onChange(song.id); 
    setResults([]);
    setQuery(""); 
  };

  const handleRemoveSong = () => {
    setSelectedSong(null);
    field.onChange(undefined); 
    setQuery("");
  };

  return (
    <div className="relative">
      {!selectedSong ? (
        <>
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white/5 px-4 py-3 backdrop-blur-md focus-within:border-primary/50 transition-all">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a song on Spotify..."
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
          </div>

          {/* Results dropdown */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 mt-2 w-full rounded-xl border border-primary/20 bg-white/10 backdrop-blur-md shadow-lg max-h-64 overflow-y-auto"
              >
                {results.map((song) => (
                  <li
                    key={song.id}
                    onClick={() => handleSelectSong(song)}
                    className="flex cursor-pointer items-center gap-3 p-3 transition-all hover:bg-primary/10 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {song.albumArt && (
                      <img
                        src={song.albumArt}
                        alt={song.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-foreground truncate">
                        {song.title}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {song.artist}
                      </span>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {loading && (
            <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
          )}
        </>
      ) : (
        /* Selected song card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-primary/20 bg-white/5 p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {selectedSong.albumArt && (
                <img
                  src={selectedSong.albumArt}
                  alt={selectedSong.title}
                  className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">
                  {selectedSong.title}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {selectedSong.artist}
                </span>
                {/* <a
                  href={selectedSong.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-500 underline hover:text-green-400 mt-1"
                >
                  Open in Spotify
                </a> */}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveSong}
              className="rounded-md bg-rose-600 p-2 text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}