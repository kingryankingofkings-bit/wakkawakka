"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Repeat2,
  Flag,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";

interface PostMenuProps {
  post: Post;
  isOwnPost: boolean;
  isBookmarked: boolean;
  onBookmark: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export function PostMenu({
  post,
  isOwnPost,
  isBookmarked,
  onBookmark,
  onDelete,
  onCopyLink,
  onShare,
  onReport,
  onBlock,
}: PostMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    onCopyLink();
    setShowCopied(true);
    setShowMenu(false);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onBookmark}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          isBookmarked
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <Bookmark
          className={cn("w-4 h-4", isBookmarked && "fill-primary")}
        />
      </motion.button>

      <div className="relative" ref={menuRef}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMenu(!showMenu)}
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
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
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
                  onClick={() => {
                    onShare();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Repeat2 className="w-4 h-4 text-muted-foreground" />
                  Repost
                </button>
                {!isOwnPost && (
                  <>
                    <div className="h-px bg-border mx-2 my-1" />
                    <button
                      onClick={() => {
                        onReport();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Flag className="w-4 h-4 text-muted-foreground" />
                      Report post
                    </button>
                    <button
                      onClick={() => {
                        onBlock();
                        setShowMenu(false);
                      }}
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
  );
}
