"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Music, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileSoundtrackProps {
  url: string;
}

export function ProfileSoundtrack({ url }: ProfileSoundtrackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // In a real application, you would initialize an Audio object or embed a
  // Spotify/SoundCloud iframe. For this demo, we simulate a beautiful visual player!
  // Parse url into song name and actual audio preview url
  let parsedUrl = url;
  let songName = "Profile Soundtrack";
  if (url && url.includes("|")) {
    const parts = url.split("|");
    parsedUrl = parts[1].trim();
    songName = parts[0].trim();
  }

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (parsedUrl) {
      audioRef.current = new Audio(parsedUrl);

      const handleEnded = () => setIsPlaying(false);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener("ended", handleEnded);
        }
      };
    }
  }, [parsedUrl]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      setIsPlaying(true);
      audioRef.current?.play().catch((err) => {
        console.error("Audio playback failed", err);
        setIsPlaying(false);
      });
    }
  };

  if (!url) return null;

  return (
    <div
      className="relative flex items-center justify-center z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-10 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/10 whitespace-nowrap flex items-center gap-1.5"
          >
            <Music className="w-3 h-3 text-primary" />
            {songName}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={togglePlay}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-xl border-2 border-white/20 group relative",
          isPlaying
            ? "bg-primary/90 shadow-primary/30"
            : "bg-black/60 hover:bg-black/80 hover:scale-110",
        )}
      >
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
          <Disc3
            className={cn(
              "w-full h-full text-white/10 absolute",
              isPlaying ? "animate-[spin_3s_linear_infinite]" : "",
            )}
          />
        </div>

        {isPlaying ? (
          <Pause className="w-5 h-5 text-white fill-white relative z-10 animate-pulse" />
        ) : (
          <Play className="w-5 h-5 text-white fill-white ml-1 relative z-10 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Floating music notes animation when playing */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ y: [-10, -40], opacity: [0, 1, 0], x: [0, 15] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute top-0 right-0"
          >
            <Music className="w-3 h-3 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [-5, -35], opacity: [0, 1, 0], x: [0, -15] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5,
            }}
            className="absolute top-0 left-0"
          >
            <Music className="w-4 h-4 text-pink-500" />
          </motion.div>
        </div>
      )}
    </div>
  );
}
