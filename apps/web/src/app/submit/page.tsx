"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Upload, Youtube, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Bricolage_Grotesque } from "next/font/google";
import { cn } from "@/lib/utils";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Particles } from "@/components/ui/particles";
import { Spotlight } from "@/components/ui/spotlight";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useAction } from "convex/react";
import { api } from "@ls/backend/convex/_generated/api";
import Turnstile from "react-turnstile";

const brico = Bricolage_Grotesque({
  subsets: ["latin"],
});

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
    songFile: z.string().optional(),
    songName: z.string().optional()
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    setColor(resolvedTheme === 'dark' ? '#ffffff' : '#e60a64');
  }, [resolvedTheme]);

  const addSong = useAction(api.songs.addSong);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      anmerkungen: "",
      submissionType: "youtube",
      songSearch: "",
      youtubeUrl: "",
      songFile: "",
      songName: ""
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

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      additionalInfo: values.anmerkungen?.trim() || undefined,
      submissionType: (values.submissionType ?? "search") as "search" | "youtube" | "file",
      songSearch: values.songSearch?.trim() || undefined,
      youtubeUrl: values.youtubeUrl?.trim() || undefined,
      songFile: values.songFile?.trim() || undefined,
      songName: values.songName?.trim() || undefined,
      turnstileToken: turnstileToken
    };

    try {
      await toast.promise(
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
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden xl:h-screen">
        <Spotlight />
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          refresh
          color={color}
        />

        <div className="relative z-[100] mx-auto max-w-2xl px-4 py-16 text-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn(
              'from-foreground via-foreground/80 to-foreground/40 mb-4 cursor-crosshair bg-gradient-to-b bg-clip-text text-4xl font-bold text-transparent sm:text-7xl',
              brico.className,
            )}
          >
            Thank you{' '}
            <span className="bg-primary from-foreground to-primary via-rose-300 bg-clip-text text-transparent dark:bg-gradient-to-b">
              {name}!
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-muted-foreground mt-2 mb-12 sm:text-lg"
          >
            We've received your submission and will send a confirmation to
            <br className="hidden sm:block" />
            <strong>{email}</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={cn(
              'border-primary/20 from-primary/10 to-primary/10 text-primary mx-auto mb-8 max-w-md rounded-xl border bg-gradient-to-r via-transparent px-6 py-4 backdrop-blur-md',
              resolvedTheme === 'dark' ? 'glass' : 'glass2',
            )}
          >
            <div className="space-y-2 text-sm">
              <div><strong>Submission type:</strong> {submissionType}</div>
              {detail && <div className="break-all"><strong>Reference:</strong> {detail}</div>}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={() => {
              setIsSubmitted(false);
              setLastSubmission(null);
            }}
            className="group text-primary-foreground focus:ring-primary/50 relative overflow-hidden rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 px-8 py-4 font-semibold text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] focus:ring-2 focus:outline-none active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Submit Another Song
              <Sparkles className="h-4 w-4 transition-all duration-300 group-hover:rotate-12" />
            </span>
            <span className="to-primary absolute inset-0 z-0 bg-gradient-to-r from-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
          </motion.button>
        </div>
      </main>
    );
  }

  // Main form
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <Spotlight />
      <Particles
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        refresh
        color={color}
      />

      <div className="relative z-[100] mx-auto max-w-2xl px-4 py-16">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-primary/10 from-primary/15 to-primary/5 mb-8 inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-4 py-2 backdrop-blur-sm"
          >
            <img
              src="/logo.png"
              alt="logo"
              className="spin h-6 w-6 filter dark:invert dark:brightness-200"
            />
            <span className="text-sm font-medium">Codity</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn(
              'from-foreground via-foreground/80 to-foreground/40 mb-4 cursor-crosshair bg-gradient-to-b bg-clip-text text-4xl font-bold text-transparent sm:text-7xl',
              brico.className,
            )}
          >
            Submit Your{' '}
            <span className="bg-primary from-foreground to-primary via-rose-300 bg-clip-text text-transparent dark:bg-gradient-to-b">
              Song
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-muted-foreground mt-2 mb-12 sm:text-lg"
          >
            Submit via search, YouTube URL or upload a file
            <br className="hidden sm:block" />
            We'll process your submission quickly
          </motion.p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Name</FormLabel>
                      <FormControl>
                        <input
                          placeholder="Your name"
                          {...field}
                          className="border-primary/20 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 w-full rounded-xl border bg-white/5 px-6 py-4 backdrop-blur-md transition-all focus:ring-2 focus:outline-none"
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <input
                          placeholder="you@domain.com"
                          {...field}
                          className="border-primary/20 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 w-full rounded-xl border bg-white/5 px-6 py-4 backdrop-blur-md transition-all focus:ring-2 focus:outline-none"
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="anmerkungen"
                render={({ field }: { field: ControllerRenderProps<FormValues, "anmerkungen"> }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Additional Notes</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Optional notes..."
                        {...field}
                        rows={3}
                        className="border-primary/20 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 w-full rounded-xl border bg-white/5 px-6 py-4 backdrop-blur-md transition-all focus:ring-2 focus:outline-none resize-none"
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground/70 text-sm">
                      Optional additional information
                    </FormDescription>
                    <FormMessage className="text-destructive text-sm" />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Submission method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="submissionType"
                render={({ field }: { field: ControllerRenderProps<FormValues, "submissionType"> }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">How would you like to submit your song?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.trigger("submissionType");
                        }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      >
                        <div className={cn(
                          "border-primary/20 hover:border-primary/40 relative rounded-xl border bg-white/5 p-4 backdrop-blur-md transition-all cursor-pointer",
                          field.value === "search" && "border-primary/60 bg-primary/10"
                        )}>
                          <RadioGroupItem disabled={true} value="search" id="search" className="sr-only" />
                          <Label htmlFor="search" className="flex flex-col items-center gap-2 cursor-pointer opacity-50">
                            <Search className="h-6 w-6" />
                            <span className="font-medium">Song Search</span>
                            <span className="text-xs text-muted-foreground text-center">Coming Soon</span>
                          </Label>
                        </div>

                        <div className={cn(
                          "border-primary/20 hover:border-primary/40 relative rounded-xl border bg-white/5 p-4 backdrop-blur-md transition-all cursor-pointer",
                          field.value === "youtube" && "border-primary/60 bg-primary/10"
                        )}>
                          <RadioGroupItem value="youtube" id="youtube" className="sr-only" />
                          <Label htmlFor="youtube" className="flex flex-col items-center gap-2 cursor-pointer">
                            <Youtube className="h-6 w-6" />
                            <span className="font-medium">YouTube URL</span>
                            <span className="text-xs text-muted-foreground text-center">Paste a YouTube link</span>
                          </Label>
                        </div>

                        <div className={cn(
                          "border-primary/20 hover:border-primary/40 relative rounded-xl border bg-white/5 p-4 backdrop-blur-md transition-all cursor-pointer",
                          field.value === "file" && "border-primary/60 bg-primary/10"
                        )}>
                          <RadioGroupItem value="file" id="file" className="sr-only" />
                          <Label htmlFor="file" className="flex flex-col items-center gap-2 cursor-pointer">
                            <Upload className="h-6 w-6" />
                            <span className="font-medium">File Upload</span>
                            <span className="text-xs text-muted-foreground text-center">Upload audio file</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-destructive text-sm" />
                  </FormItem>
                )}
              />

              {/* Conditional fields */}
              <AnimatePresence mode="wait">
                {watchedSubmissionType === "search" && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="songSearch"
                      render={({ field }: { field: ControllerRenderProps<FormValues, "songSearch"> }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Suche</FormLabel>
                          <FormControl>
                            <input
                              placeholder="Title, artist or keywords"
                              {...field}
                              className="border-primary/20 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 w-full rounded-xl border bg-white/5 px-6 py-4 backdrop-blur-md transition-all focus:ring-2 focus:outline-none"
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground/70 text-sm">
                            Suche nach einem Spoitfy Song
                          </FormDescription>
                          <FormMessage className="text-destructive text-sm" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {watchedSubmissionType === "youtube" && (
                  <motion.div
                    key="youtube"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="youtubeUrl"
                      render={({ field }: { field: ControllerRenderProps<FormValues, "youtubeUrl"> }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">YouTube URL</FormLabel>
                          <FormControl>
                            <input
                              placeholder="https://www.youtube.com/watch?v=..."
                              {...field}
                              className="border-primary/20 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 w-full rounded-xl border bg-white/5 px-6 py-4 backdrop-blur-md transition-all focus:ring-2 focus:outline-none"
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground/70 text-sm">
                            Youtube URLs wie z.b. youtube.com/watch?v=, youtu.be/ID, embed/ etc.
                          </FormDescription>
                          <FormMessage className="text-destructive text-sm" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {watchedSubmissionType === "file" && (
                  <>
                    <motion.div
                      key="songName"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FormField
                        control={form.control}
                        name="songName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Song Name</FormLabel>
                            <FormControl>
                              <input
                                placeholder="Enter the song title"
                                {...field}
                                className="border-primary/20 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 w-full rounded-xl border bg-white/5 px-6 py-4 backdrop-blur-md transition-all focus:ring-2 focus:outline-none"
                              />
                            </FormControl>
                            <FormDescription className="text-muted-foreground/70 text-sm">
                              The title of your uploaded song
                            </FormDescription>
                            <FormMessage className="text-destructive text-sm" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FormField
                        control={form.control}
                        name="songFile"
                        render={({ field }: { field: ControllerRenderProps<FormValues, "songFile"> }) => {
                          const getFileName = (url?: string | null) => {
                            if (!url) return "Uploaded file";
                            try {
                              const pathname = new URL(url).pathname;
                              const name = decodeURIComponent(pathname.split("/").pop() ?? url);
                              return name;
                            } catch {
                              return url;
                            }
                          };

                          return (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Upload File</FormLabel>
                              <FormControl>
                                <div className="border-primary/20 rounded-xl border bg-white/5 p-6 backdrop-blur-md">
                                  {!selectedFileUrl ? (
                                    <FileUpload
                                      onChange={(url) => {
                                        field.onChange(url ?? undefined);
                                        setSelectedFileUrl(url ?? null);
                                      }}
                                      endpoint={"songUploader"}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                          <a
                                            href={selectedFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-foreground underline-offset-2 hover:underline break-all"
                                          >
                                            {getFileName(selectedFileUrl)}
                                          </a>
                                          <span className="text-xs text-muted-foreground">Uploaded file</span>
                                        </div>
                                      </div>

                                      <div className="flex-shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // clear the form field and local state so user can upload again
                                            field.onChange(undefined);
                                            setSelectedFileUrl(null);
                                            // also clear any validation errors related to songFile
                                            form.clearErrors("songFile");
                                          }}
                                          className="rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormDescription className="text-muted-foreground/70 text-sm">
                                Erlaubte formate: MP3, Max 16MB
                              </FormDescription>
                              <FormMessage className="text-destructive text-sm" />
                            </FormItem>
                          );
                        }}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {TURNSTILE_SITE_KEY ? (
                <div className="flex justify-center">
                  <div className="border-primary/20 rounded-xl border bg-white/5 p-4 backdrop-blur-md">
                    <Turnstile
                      sitekey={TURNSTILE_SITE_KEY}
                      onVerify={(token: string) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => {
                        setTurnstileToken(null);
                        toast.error("Captcha error, bitte lade die Seite neu");
                      }}
                    />
                    <div className="text-xs text-muted-foreground/70 mt-2 text-center">
                      Löse die Captcha um deinen Song einzureichen
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-rose-600 text-center">
                  Missing TURNSTILE_SITE_KEY. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment to enable Captcha.
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="group text-primary-foreground focus:ring-primary/50 relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 px-8 py-4 font-semibold text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] focus:ring-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {form.formState.isSubmitting ? 'Submitting...' : 'Submit Song'}
                  <Sparkles className="h-4 w-4 transition-all duration-300 group-hover:rotate-12" />
                </span>
                <span className="to-primary absolute inset-0 z-0 bg-gradient-to-r from-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              </button>
            </motion.div>
          </form>
        </Form>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>
    </main>
  );
}