"use client";

import React, { useState } from "react";
import { motion, _AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  Shield,
  ShoppingBag,
  Music2,
  Users,
} from "lucide-react";
import { Post, ReactionType } from "@/types";
import { CURRENT_USER } from "@/lib/mockData";
import {
  cn,
  formatRelativeTime,
  highlightText,
} from "@/lib/utils";
import { useFeedStore } from "@/store/feedStore";
import { usePosts } from "@/hooks/usePosts";
import { CommentsSection } from "./CommentsSection";
import { ShareModal } from "./ShareModal";
import { MediaGrid } from "./MediaGrid";
import { PostMenu } from "./PostMenu";
import { PostActionsBar } from "./PostActionsBar";
import { ReportPostModal } from "./ReportPostModal";
import { EditPostModal } from "./EditPostModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Verification badge (inline — tiny component, not worth a separate file)
// ---------------------------------------------------------------------------

function VerificationBadge({ tier }: { tier: string }) {
  if (tier === "NONE") return null;
  if (tier === "GOLD") {
    return <Shield className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
  }
  if (tier === "GOVERNMENT") {
    return <Shield className="w-4 h-4 text-gray-500 fill-gray-500" />;
  }
  return <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />;
}

// ---------------------------------------------------------------------------
// PostCard — orchestrator
// ---------------------------------------------------------------------------

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const isSpotlightThread =
    post.likesCount * 1.5 + post.commentsCount * 3.0 > 15 ||
    post.likesCount > 4;
  const { updatePost, removePost } = useFeedStore();
  const { reactToPost } = usePosts();

  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);
  const [isEditing, setIsEditing] = useState(false);

  // Block & Report States
  const [isHidden, setIsHidden] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBtsModal, setShowBtsModal] = useState(false);

  if (isHidden) return null;

  const isOwnPost = post.authorId === CURRENT_USER.id;

  const handleLikeClick = () => {
    if (post.userReaction) {
      reactToPost(post.id, post.userReaction);
    } else {
      reactToPost(post.id, "LIKE");
    }
  };

  const handleReact = (type: ReactionType) => {
    reactToPost(post.id, type);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    updatePost(post.id, { isBookmarked: !isBookmarked });
  };

  const handleDelete = () => {
    removePost(post.id);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.id}`,
      );
    } catch {}
  };

  const handleShare = () => {
    updatePost(post.id, { sharesCount: post.sharesCount + 1 });
  };

  const handleBlockUser = () => {
    setIsHidden(true);
    toast.success(`Blocked @${post.author.username}. Hiding post.`);
  };

  const handleVote = (optionId: string) => {
    if (!post.poll) return;
    const hasVoted = post.poll.userVotes && post.poll.userVotes.length > 0;
    if (hasVoted) return;

    const updatedOptions = post.poll.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, votesCount: opt.votesCount + 1 };
      }
      return opt;
    });

    const updatedPoll = {
      ...post.poll,
      options: updatedOptions,
      userVotes: [optionId],
    };

    updatePost(post.id, { poll: updatedPoll });
    toast.success("Vote submitted!");
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 relative",
        isSpotlightThread
          ? "ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)] bg-gradient-to-b from-amber-500/5 via-card to-card"
          : (post.likesCount > 3 || post.isPinned) &&
              "ring-2 ring-primary/60 shadow-[0_0_15px_rgba(59,130,246,0.25)] bg-gradient-to-b from-primary/5 to-transparent",
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0 cursor-pointer">
            <Avatar 
              src={post.author.avatar} 
              name={post.author.displayName} 
              size="md" 
            />
          </div>

          {/* Author info */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">
                {post.author.displayName}
              </span>
              <VerificationBadge tier={post.author.verificationTier} />
              {post.author.isPremium && (
                <span className="text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  PRO
                </span>
              )}
              {isSpotlightThread && (
                <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/35 rounded-full select-none">
                  ✨ Spotlight Thread
                </span>
              )}
              {post.btsUrl && (
                <button
                  onClick={() => setShowBtsModal(true)}
                  className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full hover:bg-rose-500/20 active:scale-95 transition-all select-none"
                >
                  🎬 BTS PLAYBACK
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.visibility !== "PUBLIC" && (
                <>
                  <span>·</span>
                  <span className="capitalize">
                    {post.visibility.toLowerCase()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bookmark + Menu */}
        <PostMenu
          post={post}
          isOwnPost={isOwnPost}
          isBookmarked={isBookmarked}
          onBookmark={handleBookmark}
          onDelete={handleDelete}
          onCopyLink={handleCopyLink}
          onShare={() => setShowShareModal(true)}
          onReport={() => setShowReportModal(true)}
          onBlock={handleBlockUser}
          onEdit={() => setIsEditing(true)}
        />
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-2">
        {post.content && (
          <p
            className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: highlightText(post.content),
            }}
          />
        )}
      </div>

      <EditPostModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        post={post}
      />

      {/* ── Collaborators pill ── */}
      {post.collaborators.length > 0 && (
        <div className="px-4 pb-2">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            Created with{" "}
            {post.collaborators.map((c, i) => (
              <span key={c.id}>
                {i > 0 && " & "}
                <span className="font-semibold">@{c.username}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {post.content && (
        <div className="px-4 pb-3">
          <p
            className="text-foreground text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightText(post.content) }}
          />
        </div>
      )}

      {/* ── Poll Widget ── */}
      {post.poll && <PollWidget poll={post.poll} onVote={handleVote} />}

      {/* ── Media ── */}
      {(post.mediaUrls.length > 0 || post.type === "VIDEO") && (
        <div className="px-3 pb-3 relative">
          {post.greenScreenBg && (
            <div className="absolute top-5 left-5 z-10 bg-green-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md select-none uppercase">
              🌴 Green Screen: {post.greenScreenBg}
            </div>
          )}
          <MediaGrid urls={post.mediaUrls} type={post.type} />
        </div>
      )}

      {/* ── Music track ── */}
      {post.musicTrack && (
        <div className="mx-4 mb-3 flex items-center gap-3 bg-muted rounded-xl p-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary/20">
            {post.musicTrack.coverArt ? (
              <img
                src={post.musicTrack.coverArt}
                alt={post.musicTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {post.musicTrack.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {post.musicTrack.artist}
            </p>
          </div>
          <Music2 className="w-4 h-4 text-primary animate-bounce-subtle flex-shrink-0" />
        </div>
      )}

      {/* ── Actions Bar ── */}
      <PostActionsBar
        likesCount={post.likesCount}
        commentsCount={post.commentsCount}
        sharesCount={post.sharesCount}
        viewsCount={post.viewsCount}
        currentReaction={post.userReaction}
        showComments={showComments}
        onLikeClick={handleLikeClick}
        onReact={handleReact}
        onToggleComments={() => setShowComments(!showComments)}
        onShareClick={() => setShowShareModal(true)}
      />

      {/* ── Comments ── */}
      <div className="px-4">
        <CommentsSection post={post} isExpanded={showComments} />
      </div>

      {/* ── Product tag ── */}
      {post.productTag && (
        <div className="mx-4 mb-4 mt-2">
          <div className="flex items-center justify-between border border-border rounded-xl p-3">
            <div className="flex items-center gap-3">
              {post.productTag.images[0] && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={post.productTag.images[0]}
                    alt={post.productTag.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {post.productTag.name}
                </p>
                <p className="text-sm text-primary font-bold">
                  ${post.productTag.price.toFixed(2)}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Now
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <ShareModal
        post={post}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
      />

      <ReportPostModal
        postId={post.id}
        authorUsername={post.author.username}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {post.btsUrl && (
        <Modal
          isOpen={showBtsModal}
          onClose={() => setShowBtsModal(false)}
          title="Behind-the-Scenes snippet"
          size="md"
        >
          <div className="p-4 flex flex-col items-center justify-center space-y-3">
            <p className="text-xs text-muted-foreground">
              3-second Behind-The-Scenes snippet attached by @
              {post.author.username}
            </p>
            <div className="relative rounded-2xl overflow-hidden bg-black border border-border w-full aspect-[9/16] max-w-[280px]">
              <video
                src={post.btsUrl}
                autoPlay
                controls
                loop
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <Button size="sm" onClick={() => setShowBtsModal(false)}>
              Close Player
            </Button>
          </div>
        </Modal>
      )}
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Poll Widget — co-located (only used by PostCard)
// ---------------------------------------------------------------------------

function PollWidget({
  poll,
  onVote,
}: {
  poll: NonNullable<Post["poll"]>;
  onVote: (_optionId: string) => void;
}) {
  const hasVoted = poll.userVotes && poll.userVotes.length > 0;
  const totalVotes =
    poll.options.reduce((sum, o) => sum + o.votesCount, 0) || 1;

  return (
    <div className="px-4 pb-4">
      <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          {poll.question}
        </h4>
        <div className="space-y-2">
          {poll.options.map((opt) => {
            const percent = Math.round((opt.votesCount / totalVotes) * 100);
            const isUserChoice = poll.userVotes?.includes(opt.id);

            return (
              <button
                key={opt.id}
                disabled={hasVoted || poll.isClosed}
                onClick={() => onVote(opt.id)}
                className={cn(
                  "w-full text-left relative overflow-hidden rounded-xl h-10 border transition-all text-xs font-semibold px-4 flex items-center justify-between",
                  hasVoted
                    ? "border-border/60 bg-transparent cursor-default"
                    : "border-border hover:bg-muted active:scale-[0.99] cursor-pointer",
                )}
              >
                {hasVoted && (
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 z-0 transition-all duration-500",
                      isUserChoice ? "bg-primary/15" : "bg-muted/80",
                    )}
                    style={{ width: `${percent}%` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 text-foreground">
                  {opt.text}
                  {isUserChoice && (
                    <span className="text-primary text-[10px] bg-primary/10 rounded px-1 py-0.5">
                      Your Vote
                    </span>
                  )}
                </span>
                {hasVoted && (
                  <span className="relative z-10 text-muted-foreground font-mono">
                    {percent}% ({opt.votesCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground pt-1 flex justify-between">
          <span>
            {poll.options.reduce((sum, o) => sum + o.votesCount, 0)} total
            votes
          </span>
          {poll.isClosed && (
            <span className="text-destructive font-semibold">Closed</span>
          )}
        </div>
      </div>
    </div>
  );
}
