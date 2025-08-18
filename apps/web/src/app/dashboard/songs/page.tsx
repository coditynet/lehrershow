"use client";

import React from "react";
import Loader from "@/components/loader";
import { useAuth } from "@clerk/nextjs";
import { api } from "@ls/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { toast } from "sonner";

import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  ImageIcon,
  ExternalLink,
  Play,
  User,
  Info,
  Youtube,
  FileAudio,
  Search,
  InfoIcon,
} from "lucide-react";
import type { Doc } from "@ls/backend/convex/_generated/dataModel";

type Song = Doc<"songs">;

function formatDate(ts?: number | null) {
  if (!ts) return "Unbekanntes Datum";
  try {
    return new Date(ts).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Ungültiges Datum";
  }
}

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const songs = useQuery(api.songs.listApproved, isSignedIn ? {} : "skip");

  if (!isLoaded) return <Loader />;

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">Anmeldung erforderlich</h2>
          <p className="text-sm text-muted-foreground">
            Bitte melden Sie sich an, um die Lieder zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Lieder</h1>
        <p className="text-sm text-muted-foreground">Genehmigte Musikbeiträge</p>
      </div>

      {songs === undefined ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader />
        </div>
      ) : songs.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Keine Lieder gefunden</h3>
            <p className="text-sm text-muted-foreground">
              Noch keine genehmigten Lieder verfügbar.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {songs.map((song: Song) => (
            <SongCard key={song._id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}

function SongCard({ song }: { song: Song }) {
  const title = song.title ?? "Kein Titel";
  const youtubeThumb = song.youtubeId
    ? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`
    : undefined;

  const submitterName = song.submitter?.name ?? "Unbekannt";
  const submitterEmail = song.submitter?.email ?? "";

  const artistName = song.artist ?? submitterName;

  const handleCopy = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link kopiert")
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const openSheet = () => {
    console.log("Open sheet for", song._id);
    toast.info("Sheet-Funktionalität wird bald verfügbar sein");
  };

  const getSubmissionTypeIcon = (type?: string) => {
    switch (type) {
      case "youtube":
        return <Youtube className="h-3 w-3" />;
      case "file":
        return <FileAudio className="h-3 w-3" />;
      case "search":
        return <Search className="h-3 w-3" />;
      default:
        return <ImageIcon className="h-3 w-3" />;
    }
  };

  const getSubmissionTypeColor = (type?: string) => {
    switch (type) {
      case "youtube":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "file":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "search":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-150 hover:shadow">
      <div className="p-3">
        <div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                {youtubeThumb ? (
                  <img src={youtubeThumb} alt={title} className="w-full h-full object-cover" />
                ) : song.songFile ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 inline-flex items-center gap-1 ${getSubmissionTypeColor(
                    song.submissionType
                  )}`}
                >
                  {getSubmissionTypeIcon(song.submissionType)}
                  {song.submissionType === "youtube"
                    ? "YouTube"
                    : song.submissionType === "file"
                      ? "File Upload"
                      : song.submissionType === "search"
                        ? "Search"
                        : "Unknown"}
                </Badge>
              </div>

              <CardTitle className="text-lg font-semibold leading-tight truncate">
                {title}
              </CardTitle>

              <div className="text-sm text-foreground mt-1 font-medium truncate">
                {artistName}
              </div>

              {/* <div className="text-xs text-muted-foreground mt-1">
                {formatDate(song._creationTime)}
              </div> */}
            </div>
          </div>
        </div>

        <div className="mt-3 mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" />
            Eingereicht von
          </div>
          <div className="mt-1 ml-6">
            <div className="text-sm font-medium">{submitterName}</div>
            {submitterEmail ? (
              <div className="text-xs text-muted-foreground truncate">{submitterEmail}</div>
            ) : null}
          </div>
        </div>

        {song.additionalInfo ? (
          <div className="mt-2 mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="h-4 w-4" />
              Info
            </div>
            <div className="mt-1 ml-6 text-sm">
              {song.additionalInfo.length > 120
                ? song.additionalInfo.slice(0, 120) + "…"
                : song.additionalInfo}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          {song.submissionType === "youtube" && song.youtubeId && (
            <>
              <Button asChild className="flex-1">
                <a
                  href={`https://youtube.com/watch?v=${song.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3"
                >
                  <ExternalLink className="h-4 w-4" />
                  YouTube
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(`https://youtube.com/watch?v=${song.youtubeId}`);
                  toast.success("Link kopiert")
                }}
                className="border px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}

          {song.submissionType === "file" && song.songFile && (
            <>
              <Button asChild className="flex-1">
                <a
                  href={song.songFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3"
                >
                  <ExternalLink className="h-4 w-4" />
                  Öffnen
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleCopy(song.songFile)}
                className="border px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button onClick={openSheet} className="" variant={"outline"}>
            <InfoIcon className=" h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}