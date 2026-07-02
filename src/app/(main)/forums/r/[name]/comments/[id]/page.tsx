"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForumStore, SubforumComment } from "@/store/forumStore";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useForumSocket } from "@/hooks/useForumSocket";
import Link from "next/link";

interface CommentNodeProps {
  comment: SubforumComment;
  isAMA: boolean;
  isSubforumMod: boolean;
  onReplySubmit: (_parentId: string, _content: string) => Promise<void>;
  onCommentVote: (_commentId: string, _type: "UPVOTE" | "DOWNVOTE") => void;
  onCommentAward: (_commentId: string) => void;
  onCommentRemove: (_commentId: string) => void;
  depth: number;
}

function CommentNode({
  comment,
  isAMA,
  isSubforumMod,
  onReplySubmit,
  onCommentVote,
  onCommentAward,
  onCommentRemove,
  depth,
}: CommentNodeProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await onReplySubmit(comment.id, replyText.trim());
      setReplyText("");
      setIsReplying(false);
    } catch (err) {
      alert("Failed to submit reply");
    } finally {
      setLoading(false);
    }
  };

  // Highlights AMA answers from the host
  const isHostAnswer = comment.isAMAAnswer;

  return (
    <div className="flex flex-col mt-3 pl-1.5 sm:pl-3 border-l-2 border-border/60 hover:border-primary/30 transition-all">
      {/* Header Info */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="font-bold text-muted-foreground hover:text-foreground text-[10px] select-none"
        >
          {isCollapsed ? "[+]" : "[-]"}
        </button>
        <span className="font-bold text-foreground">u/{comment.author?.username}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
        {isHostAnswer && (
          <span className="bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider select-none">
            AMA Host
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-1">
          {/* Main content body */}
          <div
            className={`p-2.5 rounded-md text-sm whitespace-pre-wrap text-foreground leading-relaxed ${
              isHostAnswer
                ? "bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-amber-500 font-medium"
                : comment.isDeleted
                ? "italic text-muted-foreground bg-muted"
                : ""
            }`}
          >
            {comment.content}
          </div>

          {/* Action Row */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-4 mt-2 text-[11px] font-bold text-muted-foreground select-none">
              {/* Vote controls */}
              <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded">
                <button
                  onClick={() => onCommentVote(comment.id, "UPVOTE")}
                  className="hover:text-orange-500 transition-all text-xs"
                >
                  ▲
                </button>
                <span className="text-[10px] text-foreground">{comment.score}</span>
                <button
                  onClick={() => onCommentVote(comment.id, "DOWNVOTE")}
                  className="hover:text-blue-500 transition-all text-xs"
                >
                  ▼
                </button>
              </div>

              <button
                onClick={() => setIsReplying(!isReplying)}
                className="hover:text-foreground transition-all"
              >
                Reply
              </button>

              <button
                onClick={() => onCommentAward(comment.id)}
                className="hover:text-foreground transition-all"
              >
                Award
              </button>

              {isSubforumMod && (
                <button
                  onClick={() => onCommentRemove(comment.id)}
                  className="text-destructive hover:text-destructive/80 transition-all"
                >
                  Remove
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-2 max-w-lg">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                required
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={loading}>
                {loading ? "..." : "Send"}
              </Button>
            </form>
          )}

          {/* Child replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-1 sm:ml-2 mt-1">
              {comment.replies.map((reply) => (
                <CommentNode
                  key={reply.id}
                  comment={reply}
                  isAMA={isAMA}
                  isSubforumMod={isSubforumMod}
                  onReplySubmit={onReplySubmit}
                  onCommentVote={onCommentVote}
                  onCommentAward={onCommentAward}
                  onCommentRemove={onCommentRemove}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ForumPostDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    activePost,
    comments,
    fetchPostById,
    createComment,
    votePost,
    voteComment,
    giveAward,
    toggleAMA,
    moderatePost,
    moderateComment,
    activeSubforumMembers,
    loading,
    clearActiveData,
  } = useForumStore();

  const authUser = useAuthStore((s) => s.user) ?? CURRENT_USER;

  // Real-time socket sync
  useForumSocket(id, undefined);

  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Award states
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardTarget, setAwardTarget] = useState<{ id: string; type: "POST" | "COMMENT" } | null>(null);

  // Poll state
  const [pollVotedOption, setPollVotedOption] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPostById(id);
    }
    return () => {
      clearActiveData();
    };
  }, [id, fetchPostById, clearActiveData]);

  const handleVote = (type: "UPVOTE" | "DOWNVOTE") => {
    if (!activePost) return;
    votePost(activePost.id, type);
  };

  const handleAddRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activePost) return;

    setCommentLoading(true);
    try {
      await createComment(activePost.id, commentInput.trim());
      setCommentInput("");
    } catch (err) {
      alert("Failed to submit comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReplySubmit = async (parentId: string, content: string) => {
    if (!activePost) return;
    await createComment(activePost.id, content, parentId);
  };

  const handleCommentVote = (commentId: string, type: "UPVOTE" | "DOWNVOTE") => {
    voteComment(commentId, type);
  };

  const handleAwardClick = (targetId: string, type: "POST" | "COMMENT") => {
    setAwardTarget({ id: targetId, type });
    setIsAwardModalOpen(true);
  };

  const awardOptions = [
    { name: "Silver", price: 50, icon: "🥈" },
    { name: "Gold", price: 100, icon: "🥇" },
    { name: "Platinum", price: 200, icon: "💎" },
  ];

  const handleAwardSelect = async (award: typeof awardOptions[0]) => {
    if (!awardTarget) return;
    try {
      await giveAward(awardTarget.id, awardTarget.type, award);
      setIsAwardModalOpen(false);
      setAwardTarget(null);
      // Reload
      fetchPostById(id);
    } catch (err: any) {
      alert(err.message || "Failed to give award");
    }
  };

  const handlePollVote = async (option: string) => {
    if (!activePost) return;
    // Call custom endpoint to submit poll vote
    try {
      const res = await fetch(`/api/forum/posts/${activePost.id}/vote`, {
        method: "POST",
        body: JSON.stringify({ pollOption: option }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPollVotedOption(option);
      fetchPostById(id); // reload
    } catch (e: any) {
      alert(e.message || "Failed to submit poll vote");
    }
  };

  const handleToggleAMA = async () => {
    if (!activePost) return;
    const nextState = !activePost.isAMA;
    await toggleAMA(activePost.id, nextState);
  };

  const handleModLockPost = async () => {
    if (!activePost) return;
    await moderatePost(activePost.id, "LOCK_POST", "Moderator lock", activePost.subforumId);
  };

  const handleModRemovePost = async () => {
    if (!activePost) return;
    if (confirm("Are you sure you want to remove this post?")) {
      await moderatePost(activePost.id, "REMOVE_POST", "Moderator remove", activePost.subforumId);
      router.push(`/forums/r/${activePost.subforum?.slug}`);
    }
  };

  const handleCommentRemove = async (commentId: string) => {
    if (!activePost) return;
    if (confirm("Are you sure you want to remove this comment?")) {
      await moderateComment(commentId, "REMOVE_COMMENT", "Moderator comment remove", activePost.subforumId);
    }
  };

  if (loading && !activePost) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activePost) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Post Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This post does not exist or has been removed by moderation.
        </p>
        <Link href="/forum">
          <Button variant="outline">Back to Global Board</Button>
        </Link>
      </div>
    );
  }

  // Check if current user is moderator or admin in this subforum
  const member = activeSubforumMembers.find((m) => m.userId === authUser.id);
  const isSubforumMod = !!(
    activePost.authorId === authUser.id ||
    (member && (member.role === "MODERATOR" || member.role === "ADMIN"))
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 w-full">
      {/* Back button */}
      <Link href={`/forums/r/${activePost.subforum?.slug}`} className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        ← Back to r/{activePost.subforum?.name}
      </Link>

      {/* Main Post Card */}
      <Card className="p-4 sm:p-6 border border-border shadow-sm">
        <div className="flex items-start gap-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-1.5 bg-muted/40 p-2 rounded-md min-w-[36px]">
            <button
              onClick={() => handleVote("UPVOTE")}
              className="text-sm hover:text-orange-500 transition-all"
            >
              ▲
            </button>
            <span className="text-xs font-black text-foreground">{activePost.score}</span>
            <button
              onClick={() => handleVote("DOWNVOTE")}
              className="text-sm hover:text-blue-500 transition-all"
            >
              ▼
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="font-bold text-foreground">r/{activePost.subforum?.name}</span>
              <span>•</span>
              <span>Posted by u/{activePost.author?.username}</span>
              <span>•</span>
              <span>{new Date(activePost.createdAt).toLocaleDateString()}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black mt-2 text-foreground leading-snug">
              {activePost.title}
            </h1>

            <div className="flex flex-wrap gap-2 mt-2">
              {activePost.isNSFW && (
                <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  NSFW
                </span>
              )}
              {activePost.isSpoiler && (
                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  SPOILER
                </span>
              )}
              {activePost.isAMA && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  AMA Session
                </span>
              )}
            </div>

            {/* Post Content */}
            {activePost.type === "TEXT" && activePost.content && (
              <div className="mt-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {activePost.content}
              </div>
            )}

            {activePost.type === "MEDIA" && activePost.mediaUrls?.[0] && (
              <div className="mt-4 overflow-hidden rounded-md border bg-muted flex items-center justify-center max-h-[450px]">
                <img
                  src={activePost.mediaUrls[0]}
                  alt={activePost.title}
                  className={`max-w-full max-h-[450px] object-contain ${activePost.isSpoiler ? "blur-md" : ""}`}
                />
              </div>
            )}

            {activePost.type === "LINK" && activePost.content && (
              <div className="mt-4">
                <a
                  href={activePost.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  🔗 {activePost.content}
                </a>
              </div>
            )}

            {/* Poll options rendering */}
            {activePost.type === "POLL" && activePost.pollOptions && (
              <div className="mt-4 space-y-2 border border-border/80 p-4 rounded-lg bg-muted/20">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Community Poll
                </h3>
                {activePost.pollOptions.map((opt) => {
                  const votesCount = activePost.pollVotes?.[opt] || 0;
                  return (
                    <button
                      key={opt}
                      onClick={() => handlePollVote(opt)}
                      disabled={!!pollVotedOption}
                      className="w-full text-left p-2.5 rounded border border-border bg-card hover:bg-muted/30 transition-all flex justify-between items-center text-sm font-semibold"
                    >
                      <span>{opt}</span>
                      <span className="text-xs text-muted-foreground">{votesCount} votes</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border/40 text-xs font-bold text-muted-foreground">
              <button
                onClick={() => handleAwardClick(activePost.id, "POST")}
                className="flex items-center gap-1.5 hover:text-foreground transition-all"
              >
                🏆 Give Award
              </button>

              {isSubforumMod && (
                <>
                  <button
                    onClick={handleToggleAMA}
                    className="flex items-center gap-1.5 hover:text-foreground transition-all"
                  >
                    🎤 Toggle AMA
                  </button>

                  <button
                    onClick={handleModLockPost}
                    disabled={activePost.isLocked}
                    className={`flex items-center gap-1.5 hover:text-foreground transition-all ${
                      activePost.isLocked ? "text-muted-foreground/60 cursor-not-allowed" : ""
                    }`}
                  >
                    🔒 {activePost.isLocked ? "Locked" : "Lock Post"}
                  </button>

                  <button
                    onClick={handleModRemovePost}
                    className="flex items-center gap-1.5 text-destructive hover:text-destructive/80 transition-all"
                  >
                    🗑️ Remove Post
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Comment Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-foreground">
          Discussion ({comments.length} comments)
        </h2>

        {/* Comment Form */}
        {!activePost.isLocked ? (
          <form onSubmit={handleAddRootComment} className="flex gap-3">
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Join the discussion..."
              rows={3}
              required
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="md" disabled={commentLoading} className="self-end">
              {commentLoading ? "Sending..." : "Comment"}
            </Button>
          </form>
        ) : (
          <div className="bg-muted text-muted-foreground text-xs p-3 rounded text-center font-bold">
            🔒 This discussion thread has been locked by moderators.
          </div>
        )}

        {/* Recursive Comment Tree */}
        <div className="space-y-2 mt-4">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              isAMA={activePost.isAMA}
              isSubforumMod={isSubforumMod}
              onReplySubmit={handleReplySubmit}
              onCommentVote={handleCommentVote}
              onCommentAward={(cId) => handleAwardClick(cId, "COMMENT")}
              onCommentRemove={handleCommentRemove}
              depth={0}
            />
          ))}
        </div>
      </div>

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
    </div>
  );
}
