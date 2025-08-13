"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SignedOut, SignIn } from "@clerk/nextjs";

export default function LoginForm() {
  return (
    <SignedOut>
      <div className="rose-gradient bg-background relative min-h-screen overflow-hidden">
        <div className="from-background absolute -top-10 left-0 h-1/2 w-full rounded-b-full bg-gradient-to-b to-transparent blur"></div>
        <div className="from-primary/80 absolute -top-64 left-0 h-1/2 w-full rounded-full bg-gradient-to-b to-transparent blur-3xl"></div>
        <div className="relative z-10 grid min-h-screen grid-cols-1 md:grid-cols-2 w-full max-w-6xl mx-auto">
          <motion.div
            className="hidden flex-1 items-center justify-center space-y-8 p-8 text-center md:flex"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <img
                  src="/logo-full.png"
                  alt="Illustration"
                  className="mx-auto h-auto w-full md:w-90 filter dark:invert dark:brightness-200"
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-1 items-center justify-center p-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <SignIn
                appearance={{
                  elements: {
                    logoBox: { display: "none" },
                  },
                }}
                afterSignInUrl={"/dashboard"}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SignedOut>
  );
}