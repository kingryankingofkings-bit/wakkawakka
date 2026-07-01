"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Link2,
  BookOpen,
  Repeat2,
  Send,
  Twitter,
  Check,
  Search,
} from "lucide-react";
import { Post, User } from "@/types";
import { MOCK_USERS, CURRENT_USER } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
}

export function ShareModal({
  post,
  isOpen,
  onClose,
  onShare,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [sharedToStory, setSharedToStory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const suggestedUsers: User[] = MOCK_USERS.filter(
    (u) => u.id !== CURRENT_USER.id,
  ).slice(0, 4);

  const filteredUsers = suggestedUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
    }
    setCopied(true);
    onShare?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRepost = () => {
    setReposted(true);
    onShare?.();
    setTimeout(() => {
      setReposted(false);
      onClose();
    }, 1500);
  };

  const handleShareToStory = () => {
    setSharedToStory(true);
    onShare?.();
    setTimeout(() => {
      setSharedToStory(false);
      onClose();
    }, 1500);
  };

  const handleSendDM = (userId: string) => {
    setSentTo((prev) => new Set(prev).add(userId));
    onShare?.();
  };

  const handleShareMicroblog = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`;
    const text = encodeURIComponent(
      `Check out this post: ${post.content.slice(0, 80)}...`,
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
    onShare?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Share</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    copied
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : "border-border hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      copied ? "bg-green-500/20" : "bg-muted",
                    )}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {copied ? "Copied!" : "Copy link"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareToStory}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    sharedToStory
                      ? "border-purple-500 bg-purple-500/10 text-purple-600"
                      : "border-border hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      sharedToStory ? "bg-purple-500/20" : "bg-muted",
                    )}
                  >
                    {sharedToStory ? (
                      <Check className="w-4 h-4 text-purple-600" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {sharedToStory ? "Shared!" : "Add to story"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRepost}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    reposted
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : "border-border hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      reposted ? "bg-green-500/20" : "bg-muted",
                    )}
                  >
                    {reposted ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Repeat2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {reposted ? "Reposted!" : "Repost"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareMicroblog}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <Twitter className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Share to X</span>
                </motion.button>
              </div>

              {/* Send in DM */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send to people
                </h3>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* User list */}
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {user.displayName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendDM(user.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          sentTo.has(user.id)
                            ? "bg-green-500/20 text-green-600 cursor-default"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                        disabled={sentTo.has(user.id)}
                      >
                        {sentTo.has(user.id) ? "Sent" : "Send"}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
