"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Plus, Mic, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationAvatar } from "./ConversationAvatar";
import type { Conversation, Message } from "@/types";

interface ChatSidebarProps {
  conversation: Conversation;
  displayName: string;
  messages: Message[];
  onlineUsers: Set<string>;
  onClose: () => void;
  onSearchMembers: (_query: string) => void;
  searchResults: Array<{ id: string; displayName: string; username: string }>;
  onAddMember: (_userId: string) => void;
  isAddingMember: boolean;
  searchQuery: string;
}

export function ChatSidebar({
  conversation,
  displayName,
  messages,
  onlineUsers,
  onClose,
  onSearchMembers,
  searchResults,
  onAddMember,
  isAddingMember,
  searchQuery,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"details" | "media">("details");

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="h-full border-l border-border bg-card flex flex-col flex-shrink-0 overflow-hidden"
    >
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <h2 className="font-semibold text-sm">Details</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border bg-muted/20 flex-shrink-0">
        <button
          onClick={() => setActiveTab("details")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold border-b-2 transition-all",
            activeTab === "details"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold border-b-2 transition-all",
            activeTab === "media"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Shared Media
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "details" ? (
          <>
            {/* Conversation info */}
            <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-border/50">
              <ConversationAvatar
                conversation={conversation}
                onlineUsers={onlineUsers}
              />
              <div>
                <p className="font-bold text-base">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  Created on{" "}
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Members ({conversation.members.length})
              </p>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {conversation.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="relative h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.displayName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                          {member.displayName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {member.displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        @{member.username}
                      </p>
                    </div>
                    {conversation.isGroup &&
                      conversation.admins?.some(
                        (a) => a.id === member.id,
                      ) && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium">
                          Admin
                        </span>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Member widget (Group only) */}
            {conversation.isGroup && (
              <div className="pt-4 border-t border-border/50 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Add Member
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => onSearchMembers(e.target.value)}
                    className="flex-1 bg-muted/50 border border-input rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border border-border rounded-lg bg-muted/10 divide-y divide-border max-h-32 overflow-y-auto">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="p-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate flex-1 font-medium">
                          {u.displayName} (@{u.username})
                        </span>
                        <button
                          onClick={() => onAddMember(u.id)}
                          disabled={isAddingMember}
                          className="p-1 bg-primary text-primary-foreground hover:bg-primary/95 rounded flex items-center justify-center flex-shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Media Gallery tab */
          <MediaGallery messages={messages} />
        )}
      </div>
    </motion.div>
  );
}

// --- Media Gallery sub-component ---

function MediaGallery({ messages }: { messages: Message[] }) {
  const mediaMsgs = messages.filter((m) => m.mediaUrl && !m.isDeleted);

  if (mediaMsgs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        No shared media found
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {mediaMsgs.map((m) => {
        const isVoice = m.type === "VOICE" || m.mediaType === "audio";
        const isVideo = m.mediaType === "video";

        if (isVoice) {
          return (
            <div
              key={m.id}
              className="col-span-3 p-2 bg-muted/40 rounded-lg flex items-center gap-2 border border-border/50"
            >
              <Mic className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-[10px] truncate flex-1 font-medium">
                Voice Note
              </span>
              <span className="text-[8px] text-muted-foreground flex-shrink-0">
                {new Date(m.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        }

        if (isVideo) {
          return (
            <div
              key={m.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-black flex items-center justify-center group cursor-pointer"
              onClick={() => window.open(m.mediaUrl, "_blank")}
            >
              <video
                src={m.mediaUrl}
                className="object-cover w-full h-full opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <Play className="h-5 w-5 text-white fill-current" />
              </div>
            </div>
          );
        }

        return (
          <div
            key={m.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(m.mediaUrl, "_blank")}
          >
            <Image
              src={m.mediaUrl!}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
