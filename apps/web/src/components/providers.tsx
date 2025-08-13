"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/app/ConvexClientProvider";
import { shadcn } from '@clerk/themes'


const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={{theme: shadcn}}>

      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster richColors />
      </ThemeProvider>
    </ClerkProvider>
  );
}
