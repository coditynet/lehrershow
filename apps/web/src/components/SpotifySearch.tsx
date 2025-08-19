'use client'; // Required for components with hooks

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, LoaderCircle, Play, Pause } from 'lucide-react';
import { type ControllerRenderProps } from 'react-hook-form';

// --- Types ---
// Define the shape of a song object for type safety
type Song = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number; // Duration in milliseconds
  previewUrl: string | null; // 30-second preview URL from Spotify
};

// Define the props our component will accept
type SpotifySearchProps = {
  // This comes directly from the <FormField render={...}> prop
  field: ControllerRenderProps<any, string>; 
  // A callback to inform the parent page about the selected song object
  onSongSelected: (song: Song | null) => void;
};

// --- Debounce Hook ---
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Main Search Component ---
export const SpotifySearch = ({ field, onSongSelected }: SpotifySearchProps) => {
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const accessToken = useRef<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use the value from the form field for debouncing
  const debouncedSearchTerm = useDebounce(field.value, 500);

  // --- API Logic (Token and Search) ---
  const getSpotifyToken = useCallback(async () => {
    // Check if environment variables are properly set
    if (!process.env.NEXT_PUBLIC_NEXT_PUBLIC_SPOTIFY_CLIENT_ID || !process.env.NEXT_PUBLIC_NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET) {
        setError("Please add your Spotify API credentials.");
        return null;
    }
    setError(null);
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(process.env.NEXT_PUBLIC_NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.NEXT_PUBLIC_NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Spotify auth response:', response.status, errorText);
        throw new Error(`Failed to authenticate with Spotify: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.access_token;
    } catch (err: any) {
      console.error("Spotify Auth Error:", err);
      setError(err.message);
      return null;
    }
  }, []);
  
  const searchSpotifyAPI = useCallback(async (query: string, token: string) => {
    // ... (API logic is the same as the previous version)
    if (!query || !token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
            const newToken = await getSpotifyToken();
            if (newToken) {
                accessToken.current = newToken;
                return searchSpotifyAPI(query, newToken);
            }
        }
        throw new Error('Failed to fetch songs.');
      }
      const data = await response.json();
      const tracks = data.tracks.items.map((track: any) => {
        console.log('Track preview URL:', track.name, track.preview_url); // Debug log
        return {
          id: track.id,
          title: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          albumArt: track.album.images[0]?.url || 'https://placehold.co/80x80/1a1a1a/ff004c?text=N/A',
          duration: track.duration_ms,
          previewUrl: track.preview_url
        };
      });
      return tracks;
    } catch (err: any) {
      console.error("Spotify Search Error:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getSpotifyToken]);

  // --- Effects ---
  // Effect to perform the search
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm) {
        setDropdownVisible(true);
        if (!accessToken.current) {
          const token = await getSpotifyToken();
          if (token) accessToken.current = token;
        }
        if (accessToken.current) {
          const apiResults = await searchSpotifyAPI(debouncedSearchTerm, accessToken.current);
          setResults(apiResults);
        }
      } else {
        setResults([]);
        setError(null);
        setDropdownVisible(false);
      }
    };
    performSearch();
  }, [debouncedSearchTerm, getSpotifyToken, searchSpotifyAPI]);

  // Effect to hide dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);


  // --- Handlers ---
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!selectedSong?.previewUrl) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(selectedSong.previewUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSelectSong = (song: Song) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Update the form field's value
    field.onChange(`${song.title} - ${song.artist}`);
    // Set the selected song for display
    setSelectedSong(song);
    // Notify the parent page of the full song object
    onSongSelected(song);
    // Hide the results
    setDropdownVisible(false);
  };

  const handleRemoveSelectedSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setSelectedSong(null);
    field.onChange('');
    onSongSelected(null);
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      {/* We use the input from your original code, passing the field prop to it */}
      <input
        placeholder="Titel, Künstler oder Stichworte"
        {...field} // This connects react-hook-form
        onFocus={() => { if(field.value) setDropdownVisible(true); }}
        className="border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/70 focus:ring-red-500/50 w-full rounded-lg border bg-gray-900/70 py-3 pl-4 pr-10 transition-all focus:ring-2 focus:outline-none"
      />
      
      {/* --- Selected Song Display --- */}
      {selectedSong && (
        <div className="mt-3 p-4 bg-gray-900/50 border border-red-500/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={selectedSong.albumArt} 
                alt={selectedSong.title} 
                className="w-16 h-16 rounded-md object-cover"
              />
              {selectedSong.previewUrl ? (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-0 hover:opacity-100 transition-opacity duration-200"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-75">
                  <div className="text-xs text-white text-center px-1">
                    Keine<br/>Vorschau
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">{selectedSong.title}</h3>
              <p className="text-gray-400">{selectedSong.artist}</p>
              <p className="text-sm text-gray-500 mt-1">
                Dauer: {formatDuration(selectedSong.duration)}
              </p>
            </div>
            <button
              onClick={handleRemoveSelectedSong}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* --- Results Dropdown --- */}
      {isDropdownVisible && (
        <div className="absolute top-full mt-2 w-full bg-gray-900/80 backdrop-blur-md border border-red-500/30 rounded-lg shadow-lg z-10 overflow-hidden max-h-80">
          {loading ? (
            <div className="flex items-center justify-center p-6 text-gray-400"><LoaderCircle className="animate-spin mr-3" size={24} /><span>Searching...</span></div>
          ) : error ? (
            <div className="p-4 text-center text-red-400">{error}</div>
          ) : results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              <ul>
                {results.map((song) => (
                  <li key={song.id} onClick={() => handleSelectSong(song)} className="flex items-center p-3 hover:bg-red-500/10 cursor-pointer transition-colors duration-200">
                    <img src={song.albumArt} alt={song.title} className="w-12 h-12 rounded-md mr-4 object-cover"/>
                    <div>
                      <p className="font-semibold text-white">{song.title}</p>
                      <p className="text-sm text-gray-400">{song.artist}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p className="font-semibold">Keine Ergebnisse gefunden</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
