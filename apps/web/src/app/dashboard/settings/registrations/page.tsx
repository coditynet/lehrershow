"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@ls/backend/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type SimpleSettings = {
  allowNewSubmissions: boolean;
  updatedAt?: string | undefined;
};

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // Query the current single settings row
  const serverSettings = useQuery(api.settings.get, isSignedIn ? {} : "skip") as
    | SimpleSettings
    | undefined;

  // Mutation to update the single boolean setting
  const update = useMutation(api.settings.update);

  const [allowNew, setAllowNew] = useState<boolean>(true);
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!serverSettings) return;
    setAllowNew(Boolean(serverSettings.allowNewSubmissions));
    setLoadedFromServer(true);
  }, [serverSettings]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">Anmeldung erforderlich</h2>
          <p className="text-sm text-muted-foreground">
            Bitte melden Sie sich an, um Einstellungen zu sehen.
          </p>
        </div>
      </div>
    );
  }

  const disabled = !loadedFromServer || saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Call mutation with the correct argument shape
      await update({ allowNewSubmissions: allowNew });
      toast.success("Einstellung gespeichert");
    } catch (err) {
      console.error(err);
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Registrations-Einstellungen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Erlaube oder sperre neue Einreichungen.
            </p>
          </div>

          <div>
            <Button onClick={handleSave} disabled={disabled}>
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Neue Anfragen erlauben</div>
            <div className="text-sm text-muted-foreground">
              Wenn deaktiviert, können Benutzer keine neuen Einreichungen senden.
            </div>
          </div>

          <div>
            <Switch
              checked={allowNew}
              onCheckedChange={(v) => setAllowNew(Boolean(v))}
              disabled={disabled}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}