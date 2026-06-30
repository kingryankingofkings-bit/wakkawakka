'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Reply, Trash2, ChevronDown, ChevronUp, Send, Pin, Pencil, ArrowUpDown, Check, X } from 'lucide-react';
import { Comment, Post } from '@/types';
import { CURRENT_USER } from '@/lib/mockData';
import { formatRelativeTime, cn } from '@/lib/utils';

interface CommentsSectionProps {
  post: Post;
  isExpanded: boolean;
}

// Generate mock comments for a post
function generateMockComments(postId: string): Comment[] {
  return [
    {
      id: `${postId}-c1`,
      postId,
      author: {
        id: 'u2',
        username: 'tech_sam',
        email: 'sam@example.com',
        displayName: 'Sam Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
        isVerified: true,
        verificationTier: 'BLUE',
        isPremium: false,
        isPrivate: false,
        twoFactorEnabled: false,
        theme: 'system',
        accentColor: 'blue',
        language: 'en',
        followersCount: 28400,
        followingCount: 1240,
        postsCount: 456,
        streakDays: 12,
        badges: [],
        createdAt: '2024-03-20',
        updatedAt: '2025-06-27',
      },
      authorId: 'u2',
      content: 'This is absolutely incredible! The detail work is stunning 🔥',
      likesCount: 47,
      userLiked: false,
      replies: [
        {
          id: `${postId}-c1-r1`,
          postId,
          author: {
            id: 'u3',
            username: 'maya_lifestyle',
            email: 'maya@example.com',
            displayName: 'Maya Johnson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya',
            isVerified: false,
            verificationTier: 'NONE',
            isPremium: true,
            isPrivate: false,
            twoFactorEnabled: false,
            theme: 'light',
            accentColor: 'green',
            language: 'en',
            followersCount: 8920,
            followingCount: 2100,
            postsCount: 892,
            streakDays: 5,
            badges: [],
            createdAt: '2024-05-10',
            updatedAt: '2025-06-27',
          },
          authorId: 'u3',
          parentId: `${postId}-c1`,
          content: 'Totally agree! The composition is chef\'s kiss 😍',
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
        id: 'u4',
        username: 'jordan_music',
        email: 'jordan@example.com',
        displayName: 'Jordan Blake',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
        isVerified: true,
        verificationTier: 'BLUE',
        isPremium: true,
        isPrivate: false,
        twoFactorEnabled: true,
        theme: 'dark',
        accentColor: 'orange',
        language: 'en',
        followersCount: 67300,
        followingCount: 450,
        postsCount: 723,
        streakDays: 89,
        badges: [],
        createdAt: '2024-02-14',
        updatedAt: '2025-06-27',
      },
      authorId: 'u4',
      content: 'How long did this take? The colors are insane! 🎨',
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
      content: 'This just made my day! Following for more 🙌',
      likesCount: 5,
      userLiked: false,
      replies: [],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, authorName: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onPin?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  isPinned?: boolean;
  isReply?: boolean;
}

function CommentItem({ comment, onReply, onDelete, onLike, onPin, onEdit, isPinned = false, isReply = false }: CommentItemProps) {
  const isOwn = comment.authorId === CURRENT_USER.id;
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const replyCount = comment.replies?.length ?? 0;

  function saveEdit() {
    const v = draft.trim();
    if (v && v !== comment.content) onEdit?.(comment.id, v);
    setEditing(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn('flex gap-2.5', isReply && 'ml-10')}
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
        <div className={cn('rounded-2xl px-3 py-2', isPinned ? 'bg-primary/5 border border-primary/20' : 'bg-muted')}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-foreground">
              {comment.author.displayName}
            </span>
            {comment.author.isVerified && (
              <span className="text-xs text-blue-500">✓</span>
            )}
            {isPinned && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-primary">
                <Pin className="h-3 w-3 fill-current" /> Pinned
              </span>
            )}
          </div>
          {editing ? (
            <div className="space-y-1.5">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <Check className="h-3 w-3" /> Save
                </button>
                <button onClick={() => { setEditing(false); setDraft(comment.content); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-1 ml-1">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          <button
            onClick={() => onLike(comment.id)}
            className={cn(
              'flex items-center gap-1 text-xs font-medium transition-colors',
              comment.userLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart
              className={cn('w-3 h-3', comment.userLiked && 'fill-red-500')}
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
          {isOwn && !editing && (
            <button
              onClick={() => { setEditing(true); setDraft(comment.content); }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
          {!isReply && onPin && (
            <button
              onClick={() => onPin(comment.id)}
              className={cn(
                'text-xs font-medium transition-colors flex items-center gap-1',
                isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Pin className={cn('w-3 h-3', isPinned && 'fill-current')} />
              {isPinned ? 'Unpin' : 'Pin'}
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
                View {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </>
            )}
          </button>
        )}

        {/* Replies */}
        <AnimatePresence>
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
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
  const [comments, setComments] = useState<Comment[]>(() => generateMockComments(post.id));
  const [showAll, setShowAll] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [sortMode, setSortMode] = useState<'top' | 'newest'>('top');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Order: pinned first, then by the selected sort mode.
  const orderedComments = useMemo(() => {
    const score = (c: Comment) =>
      sortMode === 'top' ? c.likesCount : +new Date(c.createdAt);
    return [...comments].sort((a, b) => {
      const ap = pinnedIds.has(a.id) ? 1 : 0;
      const bp = pinnedIds.has(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return score(b) - score(a);
    });
  }, [comments, sortMode, pinnedIds]);

  const displayedComments = showAll ? orderedComments : orderedComments.slice(0, 2);

  const handlePin = (commentId: string) => {
    setPinnedIds(prev => {
      const n = new Set(prev);
      n.has(commentId) ? n.delete(commentId) : n.add(commentId);
      return n;
    });
  };

  const handleEdit = (commentId: string, content: string) => {
    const apply = (c: Comment): Comment =>
      c.id === commentId
        ? { ...c, content }
        : { ...c, replies: c.replies?.map(apply) ?? [] };
    setComments(prev => prev.map(apply));
  };

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
        }))
    );
    setPinnedIds((prev) => {
      if (!prev.has(commentId)) return prev;
      const n = new Set(prev);
      n.delete(commentId);
      return n;
    });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newComment: Comment = {
      id: `${post.id}-c${Date.now()}`,
      postId: post.id,
      author: CURRENT_USER,
      authorId: CURRENT_USER.id,
      parentId: replyingTo?.id,
      content: inputValue.trim(),
      likesCount: 0,
      userLiked: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    if (replyingTo) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyingTo.id
            ? { ...c, replies: [...(c.replies ?? []), newComment] }
            : c
        )
      );
      setReplyingTo(null);
    } else {
      setComments((prev) => [...prev, newComment]);
    }

    setInputValue('');
    setShowAll(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
      setInputValue('');
    }
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="pt-3 pb-1 border-t border-border space-y-3">
            {/* Sort control */}
            {comments.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{comments.length} comments</span>
                <button
                  onClick={() => setSortMode(m => (m === 'top' ? 'newest' : 'top'))}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortMode === 'top' ? 'Top' : 'Newest'}
                </button>
              </div>
            )}

            {/* Comment list */}
            <AnimatePresence mode="popLayout">
              {displayedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onLike={handleLike}
                  onPin={handlePin}
                  onEdit={handleEdit}
                  isPinned={pinnedIds.has(comment.id)}
                />
              ))}
            </AnimatePresence>

            {/* View all / collapse */}
            {comments.length > 2 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm font-semibold text-primary hover:underline ml-10.5"
              >
                {showAll
                  ? 'Show less'
                  : `View all ${comments.length} comments`}
              </button>
            )}

            {/* Reply indicator */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5 mx-0"
                >
                  <span className="text-xs text-muted-foreground">
                    Replying to <span className="text-primary font-medium">{replyingTo.name}</span>
                  </span>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setInputValue('');
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
