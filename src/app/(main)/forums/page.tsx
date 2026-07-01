"use client";

import React, { useState, useEffect } from "react";
import { useForumStore, SubforumPost } from "@/store/forumStore";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ForumPostComposer } from "@/components/forums/ForumPostComposer";
import Link from "next/link";

export default function ForumGlobalFeed() {
  const {
    posts,
    subforums,
    fetchPosts,
    fetchSubforums,
    createSubforum,
    joinSubforum,
    leaveSubforum,
    votePost,
    giveAward,
    loading,
  } = useForumStore();

  const authUser = useAuthStore((s) => s.user) ?? CURRENT_USER;

  const [sort, setSort] = useState("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Modals state
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedPostForAward, setSelectedPostForAward] = useState<string | null>(null);

  // New Subforum form state
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subRules, setSubRules] = useState("");
  const [subNSFW, setSubNSFW] = useState(false);
  const [subSpoiler, setSubSpoiler] = useState(false);
  const [subError, setSubError] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  // Debouncing search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load posts and subforums
  useEffect(() => {
    fetchPosts({ sort, query: debouncedQuery });
  }, [fetchPosts, sort, debouncedQuery]);

  useEffect(() => {
    fetchSubforums();
  }, [fetchSubforums]);

  // Award Options
  const awardOptions = [
    { name: "Silver", price: 50, icon: "🥈" },
    { name: "Gold", price: 100, icon: "🥇" },
    { name: "Platinum", price: 200, icon: "💎" },
  ];

  const handleCreateSubforumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      setSubError("Subforum name is required");
      return;
    }
    setSubLoading(true);
    setSubError("");

    try {
      const parsedRules = subRules
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r !== "");
        
      await createSubforum({
        name: subName.trim(),
        description: subDesc,
        rules: parsedRules,
        isNSFW: subNSFW,
        isSpoiler: subSpoiler,
      });

      // Reset
      setSubName("");
      setSubDesc("");
      setSubRules("");
      setSubNSFW(false);
      setSubSpoiler(false);
      setIsCommunityModalOpen(false);
      fetchSubforums(); // Refresh list
    } catch (err: any) {
      setSubError(err.message || "Failed to create community");
    } finally {
      setSubLoading(false);
    }
  };

  const handleVote = (postId: string, currentVote: any, type: "UPVOTE" | "DOWNVOTE") => {
    if (currentVote === type) {
      votePost(postId, null);
    } else {
      votePost(postId, type);
    }
  };

  const handleGiveAwardClick = (postId: string) => {
    setSelectedPostForAward(postId);
    setIsAwardModalOpen(true);
  };

  const handleAwardSelect = async (award: typeof awardOptions[0]) => {
    if (!selectedPostForAward) return;
    try {
      await giveAward(selectedPostForAward, "POST", award);
      setIsAwardModalOpen(false);
      setSelectedPostForAward(null);
      // Reload posts
      fetchPosts({ sort, query: debouncedQuery });
    } catch (err: any) {
      alert(err.message || "Failed to give award");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto w-full">
      {/* Central feed */}
      <div className="flex-1 space-y-4">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-lg shadow-sm">
          <div className="relative w-full sm:max-w-xs">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-muted p-1 rounded-md w-full sm:w-auto">
            {(["hot", "new", "top"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                  sort === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Create Post bar */}
        <div className="bg-card border border-border p-3 rounded-lg shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm select-none">
            {authUser?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <button
            onClick={() => setIsPostComposerOpen(true)}
            className="flex-1 text-left bg-muted border border-border text-xs text-muted-foreground font-semibold px-4 py-2.5 rounded hover:bg-muted/80 transition-all"
          >
            Create a new post...
          </button>
        </div>

        {/* Feed List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-border">
            <p className="text-muted-foreground text-sm font-semibold mb-2">No posts found</p>
            <p className="text-xs text-muted-foreground">Be the first to create a post in the community!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-4 hover:border-border/80 transition-all border border-border">
                <div className="flex items-start gap-3">
                  {/* Vote Column */}
                  <div className="flex flex-col items-center gap-1.5 bg-muted/40 p-1.5 rounded-md min-w-[36px]">
                    <button
                      onClick={() => handleVote(post.id, null, "UPVOTE")}
                      className={`text-sm hover:text-orange-500 transition-all`}
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold text-foreground">{post.score}</span>
                    <button
                      onClick={() => handleVote(post.id, null, "DOWNVOTE")}
                      className={`text-sm hover:text-blue-500 transition-all`}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Main Post Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {post.subforum && (
                        <Link
                          href={`/forum/r/${post.subforum.slug}`}
                          className="font-bold text-foreground hover:underline"
                        >
                          r/{post.subforum.name}
                        </Link>
                      )}
                      <span>•</span>
                      <span>Posted by u/{post.author?.username}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Link href={`/forum/r/${post.subforum?.slug}/comments/${post.id}`} className="block group mt-2">
                      <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-all">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.isNSFW && (
                        <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          NSFW
                        </span>
                      )}
                      {post.isSpoiler && (
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          SPOILER
                        </span>
                      )}
                      {post.isAMA && (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          AMA Session
                        </span>
                      )}
                    </div>

                    {/* Content Preview */}
                    {post.type === "TEXT" && post.content && (
                      <p className="mt-2.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}

                    {post.type === "MEDIA" && post.mediaUrls?.[0] && (
                      <div className="mt-3 overflow-hidden rounded-md max-h-80 border bg-muted flex items-center justify-center">
                        <img
                          src={post.mediaUrls[0]}
                          alt={post.title}
                          className={`max-w-full max-h-80 object-cover ${post.isSpoiler ? "blur-md" : ""}`}
                        />
                      </div>
                    )}

                    {post.type === "LINK" && post.content && (
                      <a
                        href={post.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        🔗 {post.content}
                      </a>
                    )}

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/40 text-xs font-bold text-muted-foreground">
                      <Link
                        href={`/forum/r/${post.subforum?.slug}/comments/${post.id}`}
                        className="flex items-center gap-1.5 hover:text-foreground transition-all"
                      >
                        💬 Comments
                      </Link>
                      
                      <button
                        onClick={() => handleGiveAwardClick(post.id)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-all"
                      >
                        🏆 Give Award
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      <div className="w-full lg:w-80 space-y-6">
        {/* User Karma Widget */}
        <Card className="p-4 border border-border shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            YOUR FORUM PROFILE
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
              {authUser?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">u/{authUser?.username || "Guest"}</p>
              <p className="text-xs text-muted-foreground">Karma: <span className="font-bold text-foreground">{authUser?.forumKarma || 0}</span></p>
              <p className="text-xs text-muted-foreground">Balance: <span className="font-bold text-foreground">{authUser?.channelPoints || 0} pts</span></p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              onClick={() => setIsCommunityModalOpen(true)}
              className="text-xs w-full font-bold"
              variant="outline"
            >
              Create Community
            </Button>
            <Button
              onClick={() => setIsPostComposerOpen(true)}
              className="text-xs w-full font-bold"
            >
              Create Post
            </Button>
          </div>
        </Card>

        {/* Subforum recommendation panel */}
        <Card className="p-4 border border-border shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            POPULAR COMMUNITIES
          </h3>
          <div className="space-y-3">
            {subforums.slice(0, 5).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <Link
                    href={`/forum/r/${sub.slug}`}
                    className="font-bold text-foreground hover:underline block truncate"
                  >
                    r/{sub.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{sub.memberCount} members</span>
                </div>
                {/* Join toggle button */}
                <Button
                  onClick={async () => {
                    await joinSubforum(sub.id);
                    fetchSubforums();
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-3 font-bold"
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Post Composer Modal */}
      <ForumPostComposer
        isOpen={isPostComposerOpen}
        onClose={() => setIsPostComposerOpen(false)}
        onPostCreated={() => fetchPosts({ sort, query: debouncedQuery })}
      />

      {/* Award Modal */}
      <Modal isOpen={isAwardModalOpen} onClose={() => setIsAwardModalOpen(false)} title="Select an Award">
        <div className="grid grid-cols-3 gap-3 p-2">
          {awardOptions.map((award) => (
            <button
              key={award.name}
              onClick={() => handleAwardSelect(award)}
              className="border border-border p-3 rounded-lg hover:border-primary transition-all flex flex-col items-center gap-1 bg-card hover:bg-muted/35"
            >
              <span className="text-3xl">{award.icon}</span>
              <span className="text-xs font-bold">{award.name}</span>
              <span className="text-[10px] text-muted-foreground">{award.price} pts</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Create Community Modal */}
      <Modal isOpen={isCommunityModalOpen} onClose={() => setIsCommunityModalOpen(false)} title="Create a Community">
        <form onSubmit={handleCreateSubforumSubmit} className="space-y-4">
          {subError && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {subError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              COMMUNITY NAME
            </label>
            <Input
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="e.g. programming"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              DESCRIPTION
            </label>
            <textarea
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
              placeholder="Describe your community..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              COMMUNITY RULES (ONE PER LINE)
            </label>
            <textarea
              value={subRules}
              onChange={(e) => setSubRules(e.target.value)}
              placeholder="1. Keep it respectful&#10;2. No spam"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subNSFW}
                onChange={(e) => setSubNSFW(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring"
              />
              NSFW
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subSpoiler}
                onChange={(e) => setSubSpoiler(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring"
              />
              SPOILER BY DEFAULT
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsCommunityModalOpen(false)} disabled={subLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={subLoading}>
              {subLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
