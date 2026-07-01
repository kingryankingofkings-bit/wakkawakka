"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { RefreshCw, ChevronUp, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StoriesRow } from "@/components/feed/StoriesRow";
import { PostCard } from "@/components/feed/PostCard";
import { SponsoredAd } from "@/components/ads/SponsoredAd";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { useFeedStore } from "@/store/feedStore";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

const FEED_TABS = [
  { id: "forYou", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
] as const;

export default function FeedPage() {
  return (
    <Suspense>
      <FeedPageInner />
    </Suspense>
  );
}

import { useUIStore } from "@/store/uiStore";

function FeedPageInner() {
  const { posts, feedType, setFeedType, setPosts } = useFeedStore();
  const [showNewPosts, setShowNewPosts] = useState(false);
  const [hideLabels, setHideLabels] = useState<string[]>([]);
  const setActiveModal = useUIStore((s) => s.setActiveModal);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setActiveModal("createPost");
    }
  }, [searchParams, setActiveModal]);

  // Fetch actual posts from the API on mount and when feedType changes
  useEffect(() => {
    let active = true;
    async function loadPosts() {
      let url = "/api/posts";
      if (feedType === "following") {
        url += "?feed=following";
      } else if (feedType === "trending") {
        url += "?feed=trending";
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
  }, [feedType, setPosts]);

  // Simulate new posts arriving (Disabled as per user feedback: fake pill)
  // useEffect(() => {
  //   const t = setTimeout(() => setShowNewPosts(true), 15000);
  //   return () => clearTimeout(t);
  // }, []);

  const filteredPosts = posts.filter((post) => {
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
          <div className="flex flex-1">
            {FEED_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFeedType(tab.id)}
                className={cn(
                  "flex-1 py-3.5 text-sm font-semibold transition-colors relative",
                  feedType === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {feedType === tab.id && (
                  <motion.div
                    layoutId="feed-tab-indicator"
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

      {/* Stories */}
      <div className="border-b border-border bg-card/30">
        <StoriesRow />
      </div>

      {/* Create post quick composer */}
      <div className="border-b border-border">
        <CreatePostCard onOpenModal={() => setActiveModal("createPost")} />
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
              <h3 className="text-xl font-bold mb-2">No posts here yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                {feedType === "following"
                  ? "Follow more people to see their posts in your feed."
                  : feedType === "trending"
                    ? "Check back later for trending conversations."
                    : "Be the first to share something with your friends!"}
              </p>
              {feedType === "following" && (
                <button
                  onClick={() => setFeedType("forYou")}
                  className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition"
                >
                  Explore For You
                </button>
              )}
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
    </div>
  );
}
