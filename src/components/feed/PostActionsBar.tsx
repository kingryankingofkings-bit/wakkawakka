"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
} from "lucide-react";
import { cn, formatCount, REACTION_EMOJIS } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import type { ReactionType } from "@/types";

interface PostActionsBarProps {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  currentReaction: ReactionType | null | undefined;
  showComments: boolean;
  onLikeClick: () => void;
  onReact: (type: ReactionType) => void;
  onToggleComments: () => void;
  onShareClick: () => void;
}

export function PostActionsBar({
  likesCount,
  commentsCount,
  sharesCount,
  viewsCount,
  currentReaction,
  showComments,
  onLikeClick,
  onReact,
  onToggleComments,
  onShareClick,
}: PostActionsBarProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    onLikeClick();
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 1300);
  };

  const handleReact = (type: ReactionType) => {
    onReact(type);
    setShowReactionPicker(false);
  };

  return (
    <div className="px-4 py-2 border-t border-border/50">
      {/* Stats row */}
      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {likesCount > 0 && (
            <span className="flex items-center gap-1">
              <span>{REACTION_EMOJIS.LIKE}</span>
              {currentReaction && currentReaction !== "LIKE" && (
                <span>{REACTION_EMOJIS[currentReaction]}</span>
              )}
              <span>{formatCount(likesCount)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {commentsCount > 0 && (
            <span>{formatCount(commentsCount)} comments</span>
          )}
          {sharesCount > 0 && (
            <span>{formatCount(sharesCount)} shares</span>
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
            currentReaction={currentReaction ?? undefined}
          />
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLikeClick}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              currentReaction
                ? "text-red-500 bg-red-500/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {currentReaction ? (
              <span
                className={cn(
                  "text-base leading-none",
                  isLikeAnimating && "animate-heart-beat",
                )}
              >
                {REACTION_EMOJIS[currentReaction]}
              </span>
            ) : (
              <Heart
                className={cn(
                  "w-5 h-5",
                  isLikeAnimating && "animate-heart-beat",
                )}
              />
            )}
            <span>
              {currentReaction
                ? currentReaction.charAt(0) +
                  currentReaction.slice(1).toLowerCase()
                : "Like"}
            </span>
          </motion.button>
        </div>

        {/* Comment button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onToggleComments}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
            showComments
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <MessageCircle
            className={cn("w-5 h-5", showComments && "fill-primary/20")}
          />
          <span>Comment</span>
        </motion.button>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onShareClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </motion.button>

        {/* View count */}
        <div className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span>{formatCount(viewsCount)}</span>
        </div>
      </div>
    </div>
  );
}
