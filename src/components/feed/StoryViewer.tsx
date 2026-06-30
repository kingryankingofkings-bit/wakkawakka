"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";
import { Story } from "@/types";
import { apiFetch } from "@/lib/apiClient";

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reply, setReply] = useState("");
  const intervalRef = useRef<NodeJS.Timeout>();

  const current = stories[currentIndex];
  const DURATION = (current?.duration || 5) * 1000;

  useEffect(() => {
    if (current?.id) {
      apiFetch(`/api/stories/${current.id}/view`, {
        method: "POST",
      }).catch((err) => {
        console.error("Failed to post story view:", err);
      });
    }
  }, [current?.id]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          goNext();
          return 100;
        }
        return p + 100 / (DURATION / 50);
      });
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [currentIndex, isPaused, goNext, DURATION]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (!current || typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
      >
        {/* Story container */}
        <div className="relative h-full max-h-[100dvh] w-full max-w-sm mx-auto">
          {/* Progress bars */}
          <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
            {stories.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-3 right-3 z-10 flex items-center gap-3">
            <Avatar
              src={current.author.avatar}
              name={current.author.displayName}
              size="sm"
            />
            <div>
              <p className="text-white text-sm font-semibold">
                {current.author.displayName}
              </p>
              <p className="text-white/70 text-xs">
                {formatRelativeTime(current.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Story content */}
          {current.type === "TEXT" ? (
            <div
              className="h-full w-full flex items-center justify-center px-8"
              style={{
                background:
                  (current as any).backgroundColor ||
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <p className="text-white text-2xl font-bold text-center leading-relaxed">
                {(current as any).textContent}
              </p>
            </div>
          ) : current.type === "VIDEO" ? (
            <video
              src={current.mediaUrl}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <img
              src={current.mediaUrl}
              alt="Story"
              className="h-full w-full object-cover"
            />
          )}

          {/* Navigation areas */}
          <button
            className="absolute left-0 top-0 h-full w-1/3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          />
          <button
            className="absolute right-0 top-0 h-full w-1/3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          />

          {/* Nav arrows (visible on desktop) */}
          {currentIndex > 0 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white hidden sm:block"
              onClick={goPrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white hidden sm:block"
              onClick={goNext}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Reply input */}
          <div className="absolute bottom-6 left-3 right-3 z-10 flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              placeholder="Reply to story..."
              className="flex-1 h-10 rounded-full bg-white/20 border border-white/30 px-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/30 backdrop-blur-sm"
            />
            <button
              onClick={() => {
                setReply("");
              }}
              className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
