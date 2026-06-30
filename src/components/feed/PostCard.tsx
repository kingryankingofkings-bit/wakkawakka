'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  MoreHorizontal,
  BadgeCheck,
  Shield,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShoppingBag,
  Music2,
  Users,
  Flag,
  UserX,
  Pencil,
  Trash2,
  Link2,
  Repeat2,
} from 'lucide-react';
import { Post, ReactionType } from '@/types';
import { CURRENT_USER } from '@/lib/mockData';
import {
  cn,
  formatRelativeTime,
  formatCount,
  highlightText,
  REACTION_EMOJIS,
} from '@/lib/utils';
import { useFeedStore } from '@/store/feedStore';
import { useSafetyStore, type ReportReason } from '@/store/safetyStore';
import { ReactionPicker } from './ReactionPicker';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
}

// Verification badge component
function VerificationBadge({ tier }: { tier: string }) {
  if (tier === 'NONE') return null;
  if (tier === 'GOLD') {
    return <Shield className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
  }
  if (tier === 'GOVERNMENT') {
    return <Shield className="w-4 h-4 text-gray-500 fill-gray-500" />;
  }
  return <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />;
}

// Media grid component
function MediaGrid({ urls, type }: { urls: string[]; type: string }) {
  const [activeVideo, setActiveVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoToggle = useCallback(() => {
    if (!videoRef.current) return;
    if (activeVideo) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setActiveVideo(!activeVideo);
  }, [activeVideo]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  if (type === 'VIDEO') {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black group">
        {/* Video placeholder (no actual video URL in mock data) */}
        <div
          className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer"
          onClick={handleVideoToggle}
        >
          {urls[0] && (
            <img
              src={urls[0]}
              alt="Video thumbnail"
              className="w-full h-full object-cover opacity-80"
            />
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              {activeVideo ? (
                <Pause className="w-7 h-7 text-white fill-white" />
              ) : (
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              )}
            </motion.div>
          </div>
          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              {/* Progress bar */}
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Mute button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <video
          ref={videoRef}
          src={urls[0]}
          muted={isMuted}
          loop
          className="hidden"
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    );
  }

  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden">
        <img
          src={urls[0]}
          alt="Post media"
          className="w-full object-cover max-h-[500px]"
          loading="lazy"
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Media ${i + 1}`}
            className="w-full h-64 object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        <img
          src={urls[0]}
          alt="Media 1"
          className="w-full h-72 object-cover row-span-2"
          loading="lazy"
        />
        <img
          src={urls[1]}
          alt="Media 2"
          className="w-full h-[142px] object-cover"
          loading="lazy"
        />
        <img
          src={urls[2]}
          alt="Media 3"
          className="w-full h-[142px] object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (urls.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Media ${i + 1}`}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  // 5+ images: mosaic
  return (
    <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
      <img
        src={urls[0]}
        alt="Media 1"
        className="col-span-2 row-span-2 w-full h-64 object-cover"
        loading="lazy"
      />
      {urls.slice(1, 5).map((url, i) => (
        <div key={i} className="relative">
          <img
            src={url}
            alt={`Media ${i + 2}`}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
          {i === 3 && urls.length > 5 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">+{urls.length - 5}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PostCard({ post }: PostCardProps) {
  const { updatePost, removePost } = useFeedStore();
  const { blockUser, addReport } = useSafetyStore();

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | undefined>(
    post.userReaction
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Block & Report States
  const [isHidden, setIsHidden] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportText, setReportText] = useState('');

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (isHidden) return null;

  const isOwnPost = post.authorId === CURRENT_USER.id;

  const handleReactionMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 300);
  };

  const handleReactionMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setTimeout(() => setShowReactionPicker(false), 200);
  };

  const handleLikeClick = () => {
    if (currentReaction) {
      // Remove reaction
      setCurrentReaction(undefined);
      setLikesCount((prev) => prev - 1);
    } else {
      // Default like
      handleReact('LIKE');
    }
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 1300);
  };

  const handleReact = (type: ReactionType) => {
    if (currentReaction === type) {
      setCurrentReaction(undefined);
      setLikesCount((prev) => prev - 1);
    } else {
      if (!currentReaction) setLikesCount((prev) => prev + 1);
      setCurrentReaction(type);
    }
    setShowReactionPicker(false);
    updatePost(post.id, {
      userReaction: currentReaction === type ? undefined : type,
      likesCount: currentReaction === type ? likesCount - 1 : !currentReaction ? likesCount + 1 : likesCount,
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    updatePost(post.id, { isBookmarked: !isBookmarked });
  };

  const handleDelete = () => {
    removePost(post.id);
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    } catch {}
    setShowCopied(true);
    setShowMenu(false);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleShare = () => {
    updatePost(post.id, { sharesCount: post.sharesCount + 1 });
  };

  const handleBlockUser = () => {
    blockUser({ id: post.author.id, username: post.author.username, displayName: post.author.displayName });
    setIsHidden(true);
    setShowMenu(false);
    toast.success(`Blocked @${post.author.username}. Hiding their posts.`);
  };

  const handleReportSubmit = () => {
    addReport({
      targetType: 'post',
      targetId: post.id,
      targetLabel: `Post by @${post.author.username}`,
      reason: reportReason as ReportReason,
      detail: reportText.trim() || undefined,
    });
    toast.success('Thank you for reporting. Our moderators will review this post shortly.');
    setShowReportModal(false);
    setReportText('');
  };

  const handleVote = (optionId: string) => {
    if (!post.poll) return;
    const hasVoted = post.poll.userVotes && post.poll.userVotes.length > 0;
    if (hasVoted) return;

    const updatedOptions = post.poll.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, votesCount: opt.votesCount + 1 };
      }
      return opt;
    });

    const updatedPoll = {
      ...post.poll,
      options: updatedOptions,
      userVotes: [optionId]
    };

    updatePost(post.id, { poll: updatedPoll });
    toast.success('Vote submitted!');
  };

  // Close menu on outside click
  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {post.author.displayName[0]}
                </div>
              )}
            </div>
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
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.visibility !== 'PUBLIC' && (
                <>
                  <span>·</span>
                  <span className="capitalize">{post.visibility.toLowerCase()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: bookmark + menu */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBookmark}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isBookmarked
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Bookmark
              className={cn('w-4 h-4', isBookmarked && 'fill-primary')}
            />
          </motion.button>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMenuToggle}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 z-50 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1"
                  >
                    {isOwnPost && (
                      <>
                        <button
                          onClick={() => setShowMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                          Edit post
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete post
                        </button>
                        <div className="h-px bg-border mx-2 my-1" />
                      </>
                    )}
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      {showCopied ? (
                        <>
                          <span className="w-4 h-4 text-green-500">✓</span>
                          Link copied!
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 text-muted-foreground" />
                          Copy link
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowShareModal(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Repeat2 className="w-4 h-4 text-muted-foreground" />
                      Repost
                    </button>
                    {!isOwnPost && (
                      <>
                        <div className="h-px bg-border mx-2 my-1" />
                        <button
                          onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Flag className="w-4 h-4 text-muted-foreground" />
                          Report post
                        </button>
                        <button
                          onClick={handleBlockUser}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                          Block @{post.author.username}
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Collaborators pill */}
      {post.collaborators.length > 0 && (
        <div className="px-4 pb-2">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            Created with{' '}
            {post.collaborators.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ' & '}
                <span className="font-semibold">@{c.username}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p
            className="text-foreground text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightText(post.content) }}
          />
        </div>
      )}

      {/* Poll Visual Widget */}
      {post.poll && (() => {
        const poll = post.poll;
        const hasVoted = poll.userVotes && poll.userVotes.length > 0;
        const totalVotes = poll.options.reduce((sum, o) => sum + o.votesCount, 0) || 1;
        
        return (
          <div className="px-4 pb-4">
            <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">{poll.question}</h4>
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const percent = Math.round((opt.votesCount / totalVotes) * 100);
                  const isUserChoice = poll.userVotes?.includes(opt.id);
                  
                  return (
                    <button
                      key={opt.id}
                      disabled={hasVoted || poll.isClosed}
                      onClick={() => handleVote(opt.id)}
                      className={cn(
                        "w-full text-left relative overflow-hidden rounded-xl h-10 border transition-all text-xs font-semibold px-4 flex items-center justify-between",
                        hasVoted 
                          ? "border-border/60 bg-transparent cursor-default" 
                          : "border-border hover:bg-muted active:scale-[0.99] cursor-pointer"
                      )}
                    >
                      {/* Voted progress indicator bar */}
                      {hasVoted && (
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 z-0 transition-all duration-500",
                            isUserChoice ? "bg-primary/15" : "bg-muted/80"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      )}
                      
                      <span className="relative z-10 flex items-center gap-2 text-foreground">
                        {opt.text}
                        {isUserChoice && <span className="text-primary text-[10px] bg-primary/10 rounded px-1 py-0.5">Your Vote</span>}
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
                <span>{poll.options.reduce((sum, o) => sum + o.votesCount, 0)} total votes</span>
                {poll.isClosed && <span className="text-destructive font-semibold">Closed</span>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Media */}
      {(post.mediaUrls.length > 0 || post.type === 'VIDEO') && (
        <div className="px-3 pb-3">
          <MediaGrid urls={post.mediaUrls} type={post.type} />
        </div>
      )}

      {/* Music track */}
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
            <p className="text-sm font-semibold text-foreground truncate">{post.musicTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{post.musicTrack.artist}</p>
          </div>
          <Music2 className="w-4 h-4 text-primary animate-bounce-subtle flex-shrink-0" />
        </div>
      )}

      {/* Reaction bar */}
      <div className="px-4 py-2 border-t border-border/50">
        {/* Stats row */}
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {likesCount > 0 && (
              <span className="flex items-center gap-1">
                <span>{REACTION_EMOJIS.LIKE}</span>
                {currentReaction && currentReaction !== 'LIKE' && (
                  <span>{REACTION_EMOJIS[currentReaction]}</span>
                )}
                <span>{formatCount(likesCount)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.commentsCount > 0 && (
              <span>{formatCount(post.commentsCount)} comments</span>
            )}
            {post.sharesCount > 0 && (
              <span>{formatCount(post.sharesCount)} shares</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          {/* Like button with reaction picker */}
          <div
            className="relative"
            onMouseEnter={handleReactionMouseEnter}
            onMouseLeave={handleReactionMouseLeave}
          >
            <ReactionPicker
              isVisible={showReactionPicker}
              onReact={handleReact}
              currentReaction={currentReaction}
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLikeClick}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                currentReaction
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {currentReaction ? (
                <span
                  className={cn(
                    'text-base leading-none',
                    isLikeAnimating && 'animate-heart-beat'
                  )}
                >
                  {REACTION_EMOJIS[currentReaction]}
                </span>
              ) : (
                <Heart
                  className={cn(
                    'w-5 h-5',
                    isLikeAnimating && 'animate-heart-beat'
                  )}
                />
              )}
              <span>
                {currentReaction
                  ? currentReaction.charAt(0) + currentReaction.slice(1).toLowerCase()
                  : 'Like'}
              </span>
            </motion.button>
          </div>

          {/* Comment button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowComments(!showComments)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              showComments
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <MessageCircle className={cn('w-5 h-5', showComments && 'fill-primary/20')} />
            <span>Comment</span>
          </motion.button>

          {/* Share button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </motion.button>

          {/* View count */}
          <div className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{formatCount(post.viewsCount)}</span>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="px-4">
        <CommentsSection post={post} isExpanded={showComments} />
      </div>

      {/* Product tag */}
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
                <p className="text-sm font-semibold text-foreground">{post.productTag.name}</p>
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

      {/* Share modal */}
      <ShareModal
        post={post}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
      />

      {/* Report Post Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Post" size="md">
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">Select a reason for reporting this post. We review all reports within 24 hours.</p>
          <div className="space-y-2">
            {['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER'].map(reason => (
              <label
                key={reason}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                  reportReason === reason ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                )}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={reportReason === reason}
                  onChange={() => setReportReason(reason)}
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm font-semibold capitalize text-foreground">{reason.toLowerCase()}</span>
              </label>
            ))}
          </div>

          <textarea
            placeholder="Add details (optional)..."
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button onClick={handleReportSubmit} variant="destructive">Submit Report</Button>
          </div>
        </div>
      </Modal>
    </motion.article>
  );
}
