'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Music,
  Star,
  Calendar,
  MapPin,
  Clock,
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Particles } from '@/components/ui/particles';
import { Spotlight } from '@/components/ui/spotlight';
import { useTheme } from 'next-themes';
import { Bricolage_Grotesque } from 'next/font/google';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const brico = Bricolage_Grotesque({
  subsets: ['latin'],
});


export default function LehrershowPage() {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    setColor(resolvedTheme === 'dark' ? '#ffffff' : '#e60a64');
  }, [resolvedTheme]);

  return (
    <>
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden xl:h-screen">
        <Spotlight />
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          refresh
          color={color}
        />

        <div className="relative z-[100] mx-auto max-w-4xl px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-primary/10 from-primary/15 to-primary/5 mb-8 inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-4 py-2 backdrop-blur-sm"
          >
            <Music className="h-6 w-6 animate-pulse text-primary" />
            <span className="text-sm font-medium">Lehrershow 2025</span>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Star className="h-4 w-4 text-yellow-500" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn(
              'from-foreground via-foreground/80 to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-4xl font-bold text-transparent sm:text-7xl',
              brico.className,
            )}
          >
            Die große{' '}
            <span className="bg-primary from-foreground to-primary via-rose-300 bg-clip-text text-transparent dark:bg-gradient-to-b">
              Lehrershow
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-12 grid gap-4 sm:grid-cols-3"
          >
            <div className="border-primary/20 rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-4 backdrop-blur-sm">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Datum</p>
              <p className="text-muted-foreground text-xs">Ende Schuljahr 2025</p>
            </div>
            <div className="border-primary/20 rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-4 backdrop-blur-sm">
              <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Uhrzeit</p>
              <p className="text-muted-foreground text-xs">--:--</p>
            </div>
            <div className="border-primary/20 rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-4 backdrop-blur-sm">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Ort</p>
              <p className="text-muted-foreground text-xs">Schulaula</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-8"
          >
            <h3 className="mb-4 text-xl font-semibold">
              Reiche deinen Song für die Show ein
            </h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-xl mx-auto">
              Du kannst einen eigenen Song hochladen, einen Spotify-Link teilen oder ein YouTube-Video vorschlagen.  
              Die besten Songs werden für die Auftritte der Lehrer ausgewählt – mach mit und gestalte den Abend mit!
            </p>

            <Link href="/submit">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 px-12 py-4 font-semibold text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] focus:ring-2 focus:ring-primary/50 focus:outline-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Song einreichen
                  <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1" />
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}