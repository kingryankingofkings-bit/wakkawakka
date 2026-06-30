"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Clock,
  Sparkles,
  Share2,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { apiGet } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Memory {
  id: string;
  content?: string;
  mediaUrls: string; // JSON serialized array
  createdAt: string;
  yearsAgo: number;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
}

function parseMedia(m: string): string[] {
  try {
    const a = JSON.parse(m);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

const MOCK_MEMORIES: Memory[] = [
  {
    id: "m1",
    content: "Cozy morning workspace vibes. Ready to push some commits 💻☕",
    mediaUrls: JSON.stringify([
      "https://picsum.photos/seed/workspace1/800/800",
    ]),
    createdAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    yearsAgo: 1,
    author: {
      id: "u_current",
      displayName: "You",
      username: "you",
      avatar: "https://picsum.photos/seed/you/100/100",
    },
  },
  {
    id: "m2",
    content: "Finally visited the Grand Canyon! Breathtaking views 🏔️✨",
    mediaUrls: JSON.stringify([
      "https://picsum.photos/seed/grandcanyon1/800/800",
      "https://picsum.photos/seed/grandcanyon2/800/800",
    ]),
    createdAt: new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000).toISOString(),
    yearsAgo: 3,
    author: {
      id: "u_current",
      displayName: "You",
      username: "you",
      avatar: "https://picsum.photos/seed/you/100/100",
    },
  },
];

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlideshowIndex, setActiveSlideshowIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    apiGet<Memory[]>("/api/memories", [])
      .then((m) => {
        if (m && m.length > 0) {
          setMemories(m);
        } else {
          setMemories(MOCK_MEMORIES);
        }
        setLoading(false);
      })
      .catch(() => {
        setMemories(MOCK_MEMORIES);
        setLoading(false);
      });
  }, []);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  }, []);

  const handleShareMemory = (m: Memory) => {
    toast.success(
      `Memory from ${m.yearsAgo} year${m.yearsAgo > 1 ? "s" : ""} ago reposted to your feed!`,
    );
  };

  const handlePrevSlide = () => {
    if (activeSlideshowIndex === null) return;
    setActiveSlideshowIndex((prev) =>
      prev === 0 ? memories.length - 1 : (prev || 0) - 1,
    );
  };

  const handleNextSlide = () => {
    if (activeSlideshowIndex === null) return;
    setActiveSlideshowIndex((prev) =>
      prev === memories.length - 1 ? 0 : (prev || 0) + 1,
    );
  };

  const activeMemory =
    activeSlideshowIndex !== null ? memories[activeSlideshowIndex] : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" /> On This Day
          </h1>
          <p className="text-xs text-muted-foreground">
            Looking back at {today}
          </p>
        </div>
        {memories.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveSlideshowIndex(0)}
            className="flex items-center gap-1 font-semibold"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Play Slideshow
          </Button>
        )}
      </div>

      {/* Main Grid */}
      <div className="p-4 space-y-4">
        {loading && (
          <p className="text-center text-muted-foreground py-12">
            Loading memories…
          </p>
        )}
        {!loading && memories.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center bg-card border border-border border-dashed rounded-3xl space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">
                No memories found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No memories from this day yet. As you post over time, they’ll
                resurface here.
              </p>
            </div>
          </div>
        )}

        {memories.map((m) => {
          const imgs = parseMedia(m.mediaUrls);
          return (
            <Card
              key={m.id}
              padding="md"
              className="hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {m.yearsAgo} year{m.yearsAgo > 1 ? "s" : ""} ago today
                  </span>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleShareMemory(m)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={m.author.avatar}
                  name={m.author.displayName}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {m.author.displayName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {m.content && (
                <p className="text-sm text-foreground leading-relaxed mb-3">
                  {m.content}
                </p>
              )}

              {imgs.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden bg-muted/20">
                  {imgs.slice(0, 4).map((u, i) => (
                    <img
                      key={i}
                      src={u}
                      alt=""
                      className="w-full h-40 object-cover hover:scale-102 transition-transform duration-300"
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Story Slideshow Overlay */}
      {activeMemory && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-md flex flex-col items-center justify-center p-4">
          {/* Top Header */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-extrabold text-sm">
                {activeMemory.yearsAgo} Year
                {activeMemory.yearsAgo > 1 ? "s" : ""} Ago Today
              </span>
            </div>
            <button
              onClick={() => setActiveSlideshowIndex(null)}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress indicators */}
          <div className="absolute top-16 left-6 right-6 flex gap-1 z-10">
            {memories.map((m, idx) => (
              <div
                key={m.id}
                className={cn(
                  "h-1 rounded-full flex-1 transition-all duration-300",
                  idx <= (activeSlideshowIndex || 0)
                    ? "bg-primary"
                    : "bg-white/20",
                )}
              />
            ))}
          </div>

          {/* Main Visual Slide Card */}
          <div className="relative w-full max-w-lg aspect-[3/4] flex flex-col justify-between bg-card/5 border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl">
            {/* Background blurred cover */}
            {parseMedia(activeMemory.mediaUrls)[0] && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-xl scale-110 pointer-events-none"
                style={{
                  backgroundImage: `url(${parseMedia(activeMemory.mediaUrls)[0]})`,
                }}
              />
            )}

            {/* Slide Navigation Controls */}
            {memories.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors z-20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors z-20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Author info */}
            <div className="flex items-center gap-3 relative z-10">
              <Avatar
                src={activeMemory.author.avatar}
                name={activeMemory.author.displayName}
                size="sm"
                className="ring-2 ring-primary"
              />
              <div>
                <p className="text-sm font-bold text-white">
                  {activeMemory.author.displayName}
                </p>
                <p className="text-[10px] text-white/60">
                  {new Date(activeMemory.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Image content */}
            <div className="flex-1 flex items-center justify-center py-4 relative z-10 overflow-hidden">
              {parseMedia(activeMemory.mediaUrls)[0] ? (
                <img
                  src={parseMedia(activeMemory.mediaUrls)[0]}
                  alt=""
                  className="max-w-full max-h-[45vh] object-contain rounded-2xl shadow-xl border border-white/5"
                />
              ) : (
                <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Sparkles className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Text description */}
            <div className="space-y-4 relative z-10">
              {activeMemory.content && (
                <p className="text-sm text-white font-medium text-center px-4 leading-relaxed">
                  &quot;{activeMemory.content}&quot;
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleShareMemory(activeMemory)}
                  className="w-full flex items-center justify-center gap-1.5 font-bold"
                >
                  <Share2 className="h-4 w-4" /> Share Story
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
