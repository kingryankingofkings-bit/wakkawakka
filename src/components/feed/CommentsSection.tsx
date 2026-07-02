"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Reply,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { Comment, Post } from "@/types";
import { CURRENT_USER } from "@/lib/mockData";
import { formatRelativeTime, cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiClient";

interface CommentsSectionProps {
  post: Post;
  isExpanded: boolean;
}

// Generate mock comments for a post
function _generateMockComments(postId: string): Comment[] {
  return [
    {
      id: `${postId}-c1`,
      postId,
      author: {
        id: "u2",
        username: "tech_sam",
        email: "sam@example.com",
        displayName: "Sam Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
        isVerified: true,
        verificationTier: "BLUE",
        isPremium: false,
        isPrivate: false,
        twoFactorEnabled: false,
        theme: "system",
        accentColor: "blue",
        language: "en",
        followersCount: 28400,
        followingCount: 1240,
        postsCount: 456,
        streakDays: 12,
        badges: [],
        createdAt: "2024-03-20",
        updatedAt: "2025-06-27",
        professionalTier: "NONE",
        idVerificationStatus: "UNVERIFIED",
        freeCoursesCreatedThisMonth: 0,
        paidCoursesCreatedThisMonth: 0,
        averageCourseRating: 0,
      },
      authorId: "u2",
      content: "This is absolutely incredible! The detail work is stunning 🔥",
      likesCount: 47,
      userLiked: false,
      replies: [
        {
          id: `${postId}-c1-r1`,
          postId,
          author: {
            id: "u3",
            username: "maya_lifestyle",
            email: "maya@example.com",
            displayName: "Maya Johnson",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
            isVerified: false,
            verificationTier: "NONE",
            isPremium: true,
            isPrivate: false,
            twoFactorEnabled: false,
            theme: "light",
            accentColor: "green",
            language: "en",
            followersCount: 8920,
            followingCount: 2100,
            postsCount: 892,
            streakDays: 5,
            badges: [],
            createdAt: "2024-04-10",
            updatedAt: "2025-06-28",
            professionalTier: "NONE",
            idVerificationStatus: "UNVERIFIED",
            freeCoursesCreatedThisMonth: 0,
            paidCoursesCreatedThisMonth: 0,
            averageCourseRating: 0,
          },
          authorId: "u3",
          parentId: `${postId}-c1`,
          content: "Totally agree! The composition is chef's kiss 😍",
          likesCount: 12,
          userLiked: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${postId}-c2`,
      postId,
      author: {
        id: "u4",
        username: "jordan_music",
        email: "jordan@example.com",
        displayName: "Jordan Blake",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
        isVerified: true,
        verificationTier: "BLUE",
        isPremium: true,
        isPrivate: false,
        twoFactorEnabled: true,
        theme: "dark",
        accentColor: "orange",
        language: "en",
        followersCount: 67300,
        followingCount: 450,
        postsCount: 723,
        streakDays: 89,
        badges: [],
        createdAt: "2024-02-15",
        updatedAt: "2025-06-28",
        professionalTier: "NONE",
        idVerificationStatus: "UNVERIFIED",
        freeCoursesCreatedThisMonth: 0,
        paidCoursesCreatedThisMonth: 0,
        averageCourseRating: 0,
      },
      authorId: "u4",
      content: "How long did this take? The colors are insane! 🎨",
      likesCount: 23,
      userLiked: true,
      replies: [],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${postId}-c3`,
      postId,
      author: CURRENT_USER,
      authorId: CURRENT_USER.id,
      content: "This just made my day! Following for more 🙌",
      likesCount: 5,
      userLiked: false,
      replies: [],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

interface CommentItemProps {
  comment: Comment;
  onReply: (_commentId: string, _authorName: string) => void;
  onDelete: (_commentId: string) => void;
  onLike: (_commentId: string) => void;
  isReply?: boolean;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  onLike,
  isReply = false,
}: CommentItemProps) {
  const isOwn = comment.authorId === CURRENT_USER.id;
  const [showReplies, setShowReplies] = useState(false);
  const replyCount = comment.replies?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn("flex gap-2.5", isReply && "ml-10")}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {comment.author.displayName[0]}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-2xl px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-foreground">
              {comment.author.displayName}
            </span>
            {comment.author.isVerified && (
              <span className="text-xs text-blue-500">✓</span>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-1 ml-1">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          <button
            onClick={() => onLike(comment.id)}
            className={cn(
              "flex items-center gap-1 text-xs font-medium transition-colors",
              comment.userLiked
                ? "text-red-500"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart
              className={cn("w-3 h-3", comment.userLiked && "fill-red-500")}
            />
            {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
          </button>
          {!isReply && (
            <button
              onClick={() => onReply(comment.id, comment.author.displayName)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>

        {/* Replies toggle */}
        {!isReply && replyCount > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 mt-1.5 ml-1 text-xs font-semibold text-primary hover:underline"
          >
            {showReplies ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide replies
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                View {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </>
            )}
          </button>
        )}

        {/* Replies */}
        <AnimatePresence>
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-2 space-y-2"
            >
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onDelete={onDelete}
                  onLike={onLike}
                  isReply
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function CommentsSection({ post, isExpanded }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      const loadComments = async () => {
        try {
          const res = await apiFetch(`/api/posts/${post.id}/comments`);
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              setComments(json.data);
            }
          }
        } catch (err) {
          console.error("Failed to load comments:", err);
        }
      };
      loadComments();
    }
  }, [isExpanded, post.id]);

  const displayedComments = showAll ? comments : comments.slice(0, 2);

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    setInputValue(`@${authorName} `);
    inputRef.current?.focus();
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== commentId) ?? [],
        })),
    );
  };

  const handleLike = (commentId: string) => {
    const toggleLike = (c: Comment): Comment => {
      if (c.id === commentId) {
        return {
          ...c,
          userLiked: !c.userLiked,
          likesCount: c.userLiked ? c.likesCount - 1 : c.likesCount + 1,
        };
      }
      return {
        ...c,
        replies: c.replies?.map(toggleLike) ?? [],
      };
    };
    setComments((prev) => prev.map(toggleLike));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const response = await apiFetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: inputValue.trim(),
          parentId: replyingTo?.id || null,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const newComment = json.data;

        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies ?? []), newComment] }
                : c,
            ),
          );
          setReplyingTo(null);
        } else {
          setComments((prev) => [...prev, newComment]);
        }
        setInputValue("");
        setShowAll(true);
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
    if (e.key === "Escape") {
      setReplyingTo(null);
      setInputValue("");
    }
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-3 pb-1 border-t border-border space-y-3">
            {/* Comment list */}
            <AnimatePresence mode="popLayout">
              {displayedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onLike={handleLike}
                />
              ))}
            </AnimatePresence>

            {/* View all / collapse */}
            {comments.length > 2 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm font-semibold text-primary hover:underline ml-10.5"
              >
                {showAll ? "Show less" : `View all ${comments.length} comments`}
              </button>
            )}

            {/* Reply indicator */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5 mx-0"
                >
                  <span className="text-xs text-muted-foreground">
                    Replying to{" "}
                    <span className="text-primary font-medium">
                      {replyingTo.name}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setInputValue("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                {CURRENT_USER.avatar ? (
                  <img
                    src={CURRENT_USER.avatar}
                    alt={CURRENT_USER.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {CURRENT_USER.displayName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a comment..."
                  className="w-full bg-muted rounded-full px-4 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:text-muted-foreground transition-colors"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
