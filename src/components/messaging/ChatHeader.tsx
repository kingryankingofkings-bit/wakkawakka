"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationAvatar } from "./ConversationAvatar";
import type { Conversation } from "@/types";

interface ChatHeaderProps {
  conversation: Conversation;
  displayName: string;
  otherUser: Conversation["members"][number] | null;
  onlineUsers: Set<string>;
  showSearch: boolean;
  onToggleSearch: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function ChatHeader({
  conversation,
  displayName,
  otherUser,
  onlineUsers,
  showSearch,
  onToggleSearch,
  showSidebar,
  onToggleSidebar,
  searchQuery,
  onSearchQueryChange,
}: ChatHeaderProps) {
  return (
    <>
      {/* ── Header bar ── */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/60 backdrop-blur-sm flex-shrink-0">
        <Link
          href="/messages"
          className="md:hidden rounded-full p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <ConversationAvatar
          conversation={conversation}
          onlineUsers={onlineUsers}
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          {!conversation.isGroup && otherUser && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              @{otherUser.username}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-border" />
              <span className="font-medium text-[10px]">
                {onlineUsers.has(otherUser.id) ? "Online" : "Offline"}
              </span>
            </p>
          )}
          {conversation.isGroup && (
            <p className="text-xs text-muted-foreground">
              {conversation.members.length} members
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSearch}
            className={cn(
              "rounded-full p-2 transition-colors",
              showSearch
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Search messages"
          >
            <Search className="h-5 w-5" />
          </button>
          <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Phone className="h-5 w-5" />
          </button>
          <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Video className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleSidebar}
            className={cn(
              "rounded-full p-2 transition-colors",
              showSidebar
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Chat Info"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center gap-2 flex-shrink-0">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search messages in this chat..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
