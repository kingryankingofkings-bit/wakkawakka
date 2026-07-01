"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForumStore } from "@/store/forumStore";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ForumPostComposer } from "@/components/forums/ForumPostComposer";
import { useForumSocket } from "@/hooks/useForumSocket";
import Link from "next/link";

export default function SubforumCommunityView() {
  const { name } = useParams() as { name: string };
  
  const {
    activeSubforum,
    activeSubforumMembers,
    posts,
    fetchSubforumByName,
    fetchPosts,
    joinSubforum,
    leaveSubforum,
    votePost,
    giveAward,
    moderateUser,
    loading,
  } = useForumStore();

  const authUser = useAuthStore((s) => s.user) ?? CURRENT_USER;

  // Initialize socket syncing for subforum room
  useForumSocket(undefined, activeSubforum?.id);

  const [isJoined, setIsJoined] = useState(false);
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  
  // Moderation state
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [modAction, setModAction] = useState<"BAN_USER" | "MUTE_USER">("BAN_USER");
  const [targetUserId, setTargetUserId] = useState("");
  const [modReason, setModReason] = useState("");
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState("");

  // Award state
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedPostForAward, setSelectedPostForAward] = useState<string | null>(null);

  useEffect(() => {
    if (name) {
      fetchSubforumByName(name);
    }
  }, [name, fetchSubforumByName]);

  useEffect(() => {
    if (activeSubforum) {
      fetchPosts({ subforumId: activeSubforum.id });
      
      // Determine join status
      const member = activeSubforumMembers.find((m) => m.userId === authUser.id);
      setIsJoined(!!member);
    }
  }, [activeSubforum, activeSubforumMembers, fetchPosts, authUser.id]);

  const handleJoinToggle = async () => {
    if (!activeSubforum) return;
    
    if (isJoined) {
      await leaveSubforum(activeSubforum.id);
      setIsJoined(false);
    } else {
      await joinSubforum(activeSubforum.id);
      setIsJoined(true);
    }
    // Refresh membership details
    fetchSubforumByName(name);
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

  const awardOptions = [
    { name: "Silver", price: 50, icon: "🥈" },
    { name: "Gold", price: 100, icon: "🥇" },
    { name: "Platinum", price: 200, icon: "💎" },
  ];

  const handleAwardSelect = async (award: typeof awardOptions[0]) => {
    if (!selectedPostForAward) return;
    try {
      await giveAward(selectedPostForAward, "POST", award);
      setIsAwardModalOpen(false);
      setSelectedPostForAward(null);
      // Reload posts
      if (activeSubforum) {
        fetchPosts({ subforumId: activeSubforum.id });
      }
    } catch (err: any) {
      alert(err.message || "Failed to give award");
    }
  };

  const handleModSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) {
      setModError("Target user ID is required");
      return;
    }
    if (!activeSubforum) return;

    setModLoading(true);
    setModError("");

    try {
      await moderateUser(activeSubforum.id, targetUserId.trim(), modAction, modReason);
      setTargetUserId("");
      setModReason("");
      setIsModModalOpen(false);
      alert(`User moderated successfully!`);
    } catch (err: any) {
      setModError(err.message || "Failed to moderate user");
    } finally {
      setModLoading(false);
    }
  };

  if (loading && !activeSubforum) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activeSubforum) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">r/{name} Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This community does not exist or has been removed.
        </p>
        <Link href="/forum">
          <Button variant="outline">Go back to global feed</Button>
        </Link>
      </div>
    );
  }

  // Parse customTheme
  let parsedTheme: any = {};
  try {
    parsedTheme = activeSubforum.customTheme ? JSON.parse(activeSubforum.customTheme) : {};
  } catch (e) {}

  // Parse rules
  let parsedRules: string[] = [];
  try {
    parsedRules = activeSubforum.rules ? JSON.parse(activeSubforum.rules) : [];
  } catch (e) {}

  // Check if current user is moderator or admin
  const currentUserMember = activeSubforumMembers.find((m) => m.userId === authUser?.id);
  const isModerator =
    activeSubforum.creatorId === authUser?.id ||
    (currentUserMember && (currentUserMember.role === "MODERATOR" || currentUserMember.role === "ADMIN"));

  return (
    <div className="flex flex-col w-full">
      {/* Subforum Banner/Theme Header */}
      <div
        className="h-24 sm:h-36 w-full relative select-none"
        style={{
          backgroundColor: parsedTheme.bannerColor || "#ff4500",
          backgroundImage: parsedTheme.bannerImage ? `url(${parsedTheme.bannerImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-7xl mx-auto w-full px-4 py-4 flex flex-col lg:flex-row gap-6">
        {/* Main Feed Column */}
        <div className="flex-1 space-y-4">
          {/* Header Info Banner */}
          <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-foreground">
                  r/{activeSubforum.name}
                </h1>
                <div className="flex gap-1.5">
                  {activeSubforum.isNSFW && (
                    <span className="bg-destructive/15 text-destructive text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                      NSFW
                    </span>
                  )}
                  {activeSubforum.isSpoiler && (
                    <span className="bg-amber-500/15 text-amber-500 text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                      Spoiler
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                r/{activeSubforum.slug} • {activeSubforum.memberCount} members • {activeSubforum.postCount} posts
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleJoinToggle} variant={isJoined ? "outline" : "primary"}>
                {isJoined ? "Joined" : "Join"}
              </Button>
              
              {isModerator && (
                <Button onClick={() => setIsModModalOpen(true)} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                  🛡️ Mod Tools
                </Button>
              )}
            </div>
          </div>

          {/* Create Post Bar */}
          <div className="bg-card border border-border p-3 rounded-lg shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm select-none">
              {authUser?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <button
              onClick={() => setIsPostComposerOpen(true)}
              className="flex-1 text-left bg-muted border border-border text-xs text-muted-foreground font-semibold px-4 py-2.5 rounded hover:bg-muted/80 transition-all"
            >
              Post inside r/{activeSubforum.name}...
            </button>
          </div>

          {/* Posts List */}
          {posts.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-border">
              <p className="text-muted-foreground text-sm font-semibold mb-2">No posts inside this community yet</p>
              <p className="text-xs text-muted-foreground">Be the first to publish a post!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="p-4 hover:border-border/80 transition-all border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1.5 bg-muted/40 p-1.5 rounded-md min-w-[36px]">
                      <button
                        onClick={() => handleVote(post.id, null, "UPVOTE")}
                        className="text-sm hover:text-orange-500 transition-all"
                      >
                        ▲
                      </button>
                      <span className="text-xs font-bold text-foreground">{post.score}</span>
                      <button
                        onClick={() => handleVote(post.id, null, "DOWNVOTE")}
                        className="text-sm hover:text-blue-500 transition-all"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        Posted by u/{post.author?.username} • {new Date(post.createdAt).toLocaleDateString()}
                      </div>

                      <Link href={`/forum/r/${activeSubforum.slug}/comments/${post.id}`} className="block group mt-1.5">
                        <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-all">
                          {post.title}
                        </h2>
                      </Link>

                      <div className="flex gap-2 mt-1.5">
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

                      {post.type === "TEXT" && post.content && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
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

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40 text-xs font-bold text-muted-foreground">
                        <Link
                          href={`/forum/r/${activeSubforum.slug}/comments/${post.id}`}
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

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Subforum Rules & Details */}
          <Card className="p-4 border border-border shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              ABOUT COMMUNITY
            </h3>
            <p className="text-sm text-foreground mb-4 leading-relaxed">
              {activeSubforum.description || "No description provided."}
            </p>

            {parsedRules.length > 0 && (
              <div className="border-t border-border pt-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  COMMUNITY RULES
                </h4>
                <ol className="list-decimal pl-4 text-xs space-y-2 text-foreground font-semibold">
                  {parsedRules.map((rule, idx) => (
                    <li key={idx} className="pl-1">
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Post Composer Modal */}
      <ForumPostComposer
        isOpen={isPostComposerOpen}
        onClose={() => setIsPostComposerOpen(false)}
        defaultSubforumId={activeSubforum.id}
        onPostCreated={() => fetchPosts({ subforumId: activeSubforum.id })}
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

      {/* Mod Actions Modal */}
      <Modal isOpen={isModModalOpen} onClose={() => setIsModModalOpen(false)} title="Subforum Moderator Actions">
        <form onSubmit={handleModSubmit} className="space-y-4">
          {modError && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {modError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              CHOOSE ACTION
            </label>
            <select
              value={modAction}
              onChange={(e) => setModAction(e.target.value as any)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="BAN_USER">Ban User</option>
              <option value="MUTE_USER">Mute User</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              TARGET USER ID
            </label>
            <Input
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. u1"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              REASON FOR ACTION
            </label>
            <textarea
              value={modReason}
              onChange={(e) => setModReason(e.target.value)}
              placeholder="Rule violations, trolling, spam..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModModalOpen(false)} disabled={modLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={modLoading}>
              {modLoading ? "Executing..." : "Apply Action"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
