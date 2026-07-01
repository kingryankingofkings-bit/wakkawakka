"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { RefreshCw, ChevronUp, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/feed/PostCard";
import { SponsoredAd } from "@/components/ads/SponsoredAd";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { useFeedStore } from "@/store/feedStore";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

const MUSIC_TABS = [
  { id: "all", label: "All Music" },
  { id: "pop", label: "Pop" },
  { id: "rock", label: "Rock" },
  { id: "hiphop", label: "Hip Hop" },
  { id: "rnb", label: "R&B" },
  { id: "country", label: "Country" },
  { id: "jazz", label: "Jazz" },
  { id: "classical", label: "Classical" },
  { id: "electronic", label: "Electronic" },
] as const;

export default function MusicPage() {
  return (
    <Suspense>
      <MusicPageInner />
    </Suspense>
  );
}

function MusicPageInner() {
  const { posts, setPosts } = useFeedStore();
  const [activeGenre, setActiveGenre] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewPosts, setShowNewPosts] = useState(false);
  const [hideLabels, setHideLabels] = useState<string[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Fetch actual posts from the API on mount
  useEffect(() => {
    let active = true;
    async function loadPosts() {
      let url = "/api/posts?type=MUSIC";
      if (activeGenre !== "all") {
        url += `&genre=${activeGenre}`;
      }
      try {
        const response = await apiFetch(url);
        if (response.ok) {
          const json = await response.json();
          if (active && json.data) {
            setPosts(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load posts:", err);
      }
    }
    loadPosts();
    return () => {
      active = false;
    };
  }, [activeGenre, setPosts]);

  // Simulate new posts arriving (Disabled: fake pill)
  // useEffect(() => {
  //   const t = setTimeout(() => setShowNewPosts(true), 15000);
  //   return () => clearTimeout(t);
  // }, []);

  const filteredPosts = posts.filter((post) => {
    // Demo: pretend some posts are music if they have the word 'music' or we just show them all in this view for demo purposes
    // since the backend might not return type: "MUSIC" yet. But we filter out hidden labels anyway.
    if (!post.labels) return true;
    try {
      const parsedLabels: string[] = JSON.parse(post.labels);
      return !parsedLabels.some((l) => hideLabels.includes(l));
    } catch {
      return true;
    }
  });

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-1 overflow-x-auto no-scrollbar">
            {MUSIC_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGenre(tab.id)}
                className={cn(
                  "px-4 py-3.5 text-sm font-semibold transition-colors relative whitespace-nowrap",
                  activeGenre === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {activeGenre === tab.id && (
                  <motion.div
                    layoutId="music-tab-indicator"
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Moderation Labels Filter Row */}
      <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center gap-3 overflow-x-auto scrollbar-hide text-xs shrink-0">
        {["NSFW", "Clickbait", "Misinformation"].map((label) => {
          const isActive = hideLabels.includes(label);
          const displayLabel = label === "NSFW" ? "Site Restrictions/Community Acceptability Content" : `Hide ${label}`;
          return (
            <button
              key={label}
              onClick={() =>
                setHideLabels((prev) =>
                  prev.includes(label)
                    ? prev.filter((l) => l !== label)
                    : [...prev, label],
                )
              }
              className={cn(
                "px-2.5 py-1 rounded-xl border text-[10px] font-bold active:scale-95 transition-all whitespace-nowrap",
                isActive
                  ? "bg-red-500 text-white border-red-500 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted",
              )}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* New posts notification */}
      <AnimatePresence>
        {showNewPosts && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-[49px] z-20 flex justify-center py-2 bg-background/0"
          >
            <button
              onClick={() => setShowNewPosts(false)}
              className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg hover:bg-primary/90 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />3 new posts
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories - hidden for music feed to match design pattern
      <div className="border-b border-border bg-card/30">
        <StoriesRow />
      </div>
      */}

      {/* Create post quick composer */}
      <div className="border-b border-border">
        <CreatePostCard onOpenModal={() => setShowCreateModal(true)} />
      </div>

      {/* Posts feed */}
      <div>
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, i) => (
              <div key={post.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <PostCard post={post} />
                </motion.div>
                {(i + 1) % 5 === 0 && <SponsoredAd />}
              </div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 flex flex-col items-center justify-center text-center px-4"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Sliders className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No music here yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Be the first to share your favorite tracks and beats with your friends!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load more */}
        {filteredPosts.length > 0 && (
          <div className="py-8 flex justify-center">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="h-4 w-4" />
              Load more posts
            </button>
          </div>
        )}
      </div>

      {/* Create post modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
