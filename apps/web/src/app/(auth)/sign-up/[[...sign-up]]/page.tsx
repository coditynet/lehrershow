"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Bricolage_Grotesque } from "next/font/google";
import { cn } from "@/lib/utils";
import { Particles } from "@/components/ui/particles";
import { Spotlight } from "@/components/ui/spotlight";
import { SignedOut, SignUp, useAuth } from "@clerk/nextjs";

const brico = Bricolage_Grotesque({
  subsets: ["latin"],
});

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#e60a64");
  }, [resolvedTheme]);

  const session = useAuth()

  if (session.userId) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  }

  return (
    <SignedOut>
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
        <Spotlight />
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          refresh
          color={color}
        />

        <div className="relative z-[100] mx-auto max-w-md px-4 py-16 w-full text-center">
          <motion.img
            src="/logo.png"
            alt="Codity Logo"
            className="mx-auto mb-8 h-16 w-auto filter dark:invert dark:brightness-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn(
              "from-foreground via-foreground/80 to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-4xl font-bold text-transparent sm:text-5xl",
              brico.className
            )}
          >
            Create{" "}
            <span className="bg-primary from-foreground to-primary via-rose-300 bg-clip-text text-transparent dark:bg-gradient-to-b">
              Account
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <SignUp
              appearance={{
                elements: {
                  card: "bg-white/5 backdrop-blur-md",
                  footer: "hidden",
                  formButtonPrimary:
                    "bg-gradient-to-b from-rose-500 to-rose-700 text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300",

                  formFieldInput:
                    "bg-white/5 border border-primary/20 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/30 backdrop-blur-md",
                },
              }}
              afterSignInUrl="/dashboard"
            />
          </motion.div>
        </div>
      </main>
    </SignedOut>
  );
}