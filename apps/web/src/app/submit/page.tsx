"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type ControllerRenderProps } from "react-hook-form";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Youtube, Search } from "lucide-react";

import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useAction } from "convex/react";
import { api } from "@ls/backend/convex/_generated/api";

// Turnstile widget
import Turnstile from "react-turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const isValidYouTubeUrl = (url: string) => {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/)?[A-Za-z0-9_\-]{6,}(?:[&?].*)?$/i;
  return youtubeRegex.test(url);
};

const formSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    anmerkungen: z.string().optional(),
    submissionType: z.enum(["search", "youtube", "file"]).optional(),
    songSearch: z.string().optional(),
    youtubeUrl: z.string().optional(),
    // songFile stores the public URL returned by UploadThing
    songFile: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.submissionType) return;

    if (data.submissionType === "search") {
      if (!data.songSearch || !data.songSearch.trim()) {
        ctx.addIssue({
          path: ["songSearch"],
          code: z.ZodIssueCode.custom,
          message: "Please provide a search term (title, artist or keywords).",
        });
      }
    } else if (data.submissionType === "youtube") {
      if (!data.youtubeUrl || !data.youtubeUrl.trim()) {
        ctx.addIssue({
          path: ["youtubeUrl"],
          code: z.ZodIssueCode.custom,
          message: "Please provide a YouTube URL.",
        });
      } else if (!isValidYouTubeUrl(data.youtubeUrl)) {
        ctx.addIssue({
          path: ["youtubeUrl"],
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid YouTube URL.",
        });
      }
    } else if (data.submissionType === "file") {
      if (!data.songFile || !data.songFile.trim()) {
        ctx.addIssue({
          path: ["songFile"],
          code: z.ZodIssueCode.custom,
          message: "Please upload a file.",
        });
      } else {
        try {
          new URL(data.songFile);
        } catch {
          ctx.addIssue({
            path: ["songFile"],
            code: z.ZodIssueCode.custom,
            message: "Uploaded file must be a valid URL.",
          });
        }
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function SubmitSongPage() {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<
    { name: string; email: string; submissionType: string; detail?: string } | null
  >(null);

  // Convex actions
  const addSong = useAction(api.songs.addSong); 

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      anmerkungen: "",
      submissionType: "search",
      songSearch: "",
      youtubeUrl: "",
      songFile: "",
    },
    mode: "onChange",
  });

  const watchedSubmissionType = form.watch("submissionType");

  useEffect(() => {
    const clearAndValidate = async () => {
      if (watchedSubmissionType === "search") {
        form.setValue("youtubeUrl", undefined, { shouldValidate: true });
        form.setValue("songFile", undefined, { shouldValidate: true });
      } else if (watchedSubmissionType === "youtube") {
        form.setValue("songSearch", undefined, { shouldValidate: true });
        form.setValue("songFile", undefined, { shouldValidate: true });
      } else if (watchedSubmissionType === "file") {
        form.setValue("songSearch", undefined, { shouldValidate: true });
        form.setValue("youtubeUrl", undefined, { shouldValidate: true });
      }

      form.clearErrors(["songSearch", "youtubeUrl", "songFile", "submissionType"]);
    };

    clearAndValidate();
  }, [watchedSubmissionType, form]);

  const onSubmit = async (values: FormValues) => {
    if (!turnstileToken) {
      toast.error("Bitte bestätige das Captcha (Turnstile).");
      return;
    }

    // Build payload for addSong action
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      additionalInfo: values.anmerkungen?.trim() || undefined,
      submissionType: (values.submissionType ?? "search") as "search" | "youtube" | "file",
      songSearch: values.songSearch?.trim() || undefined,
      youtubeUrl: values.youtubeUrl?.trim() || undefined,
      songFile: values.songFile?.trim() || undefined,
      turnstileToken: turnstileToken
    };

    try {
      await toast.promise(
        // call Convex action to add song
        addSong(payload),
        {
          loading: "Anfrage wird versendet...",
          success: () => {
            setIsSubmitted(true);
            form.reset();
            setSelectedFileUrl(null);

            const detail =
              payload.submissionType === "search"
                ? payload.songSearch
                : payload.submissionType === "youtube"
                ? payload.youtubeUrl
                : payload.songFile;

            setLastSubmission({
              name: payload.name,
              email: payload.email,
              submissionType: payload.submissionType,
              detail: detail,
            });

            return "Song erfolgreich hinzugefügt";
          },
          error: (err: unknown) => {
            if (err instanceof ConvexError && typeof err.data === "string") {
              return err.data;
            }
            return "Fehler beim Hinzufügen des Songs";
          },
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Thank-you view after successful submit
  if (isSubmitted && lastSubmission) {
    const { name, email, submissionType, detail } = lastSubmission;
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Danke für deine Einsendung!</CardTitle>
            <CardDescription>
              Wir haben deine Einreichung erhalten und senden dir eine Bestätigung an{" "}
              <strong>{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Hallo <strong>{name}</strong>, danke, dass du deinen Song eingereicht hast.
            </p>

            <div className="mb-4">
              <h4 className="font-medium">Eingabedetails</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <strong>Art der Einsendung:</strong> {submissionType}
                </li>
                {detail && (
                  <li>
                    <strong>Referenz:</strong> <span className="break-all">{detail}</span>
                  </li>
                )}
              </ul>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Falls du etwas ändern möchtest, antworte einfach auf die Bestätigungs-E‑Mail.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setLastSubmission(null);
                }}
              >
                Weitere Einsendung
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Song</CardTitle>
          <CardDescription>
            Submit via search, YouTube URL or upload a file (UploadThing).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@domain.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anmerkungen"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "anmerkungen"> }) => (
                    <FormItem>
                      <FormLabel>Anmerkungen</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes..." {...field} />
                      </FormControl>
                      <FormDescription>Optional additional information</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submission method */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="submissionType"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "submissionType"> }) => (
                    <FormItem>
                      <FormLabel>How would you like to submit your song?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.trigger("submissionType");
                          }}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem disabled={true} value="search" id="search" />
                            <Label htmlFor="search" className="flex items-center gap-2">
                              <Search className="h-4 w-4" /> Song Search
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="youtube" id="youtube" />
                            <Label htmlFor="youtube" className="flex items-center gap-2">
                              <Youtube className="h-4 w-4" /> YouTube URL
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="file" id="file" />
                            <Label htmlFor="file" className="flex items-center gap-2">
                              <Upload className="h-4 w-4" /> File Upload
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional fields */}
                {watchedSubmissionType === "search" && (
                  <FormField
                    control={form.control}
                    name="songSearch"
                    render={({ field }: { field: ControllerRenderProps<FormValues, "songSearch"> }) => (
                      <FormItem>
                        <FormLabel>Song search</FormLabel>
                        <FormControl>
                          <Input placeholder="Title, artist or keywords" {...field} />
                        </FormControl>
                        <FormDescription>Search terms to identify your song</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedSubmissionType === "youtube" && (
                  <FormField
                    control={form.control}
                    name="youtubeUrl"
                    render={({ field }: { field: ControllerRenderProps<FormValues, "youtubeUrl"> }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormDescription>Share URLs like youtube.com/watch?v=, youtu.be/ID, embed/ etc.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedSubmissionType === "file" && (
                  <FormField
                    control={form.control}
                    name="songFile"
                    render={({ field }: { field: ControllerRenderProps<FormValues, "songFile"> }) => (
                      <FormItem>
                        <FormLabel>Upload file</FormLabel>
                        <FormControl>
                          <div>
                            <FileUpload
                              onChange={(url) => {
                                field.onChange(url ?? undefined);
                                setSelectedFileUrl(url ?? null);
                              }}
                              endpoint={"songUploader"}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Allowed: MP3, WAV, FLAC. Max 16MB (≈ 7–18 min)</FormDescription>
                        {selectedFileUrl && (
                          <div className="text-sm text-muted-foreground mt-2 break-all">
                            Uploaded URL: {selectedFileUrl}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Turnstile widget */}
              <div>
                {TURNSTILE_SITE_KEY ? (
                  <div className="mb-2">
                    <Turnstile
                      sitekey={TURNSTILE_SITE_KEY}
                      onVerify={(token: string) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => {
                        setTurnstileToken(null);
                        toast.error("Captcha error, bitte lade die Seite neu");
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      Bitte bestätige das Captcha bevor du sendest.
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-rose-600">
                    Missing TURNSTILE_SITE_KEY. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment to enable Captcha.
                  </div>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting }
                >
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Song"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}