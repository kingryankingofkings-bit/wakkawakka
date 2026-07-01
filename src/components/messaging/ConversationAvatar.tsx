"use client";

import React from "react";
import Image from "next/image";
import { CURRENT_USER } from "@/lib/mockData";
import type { Conversation } from "@/types";

interface ConversationAvatarProps {
  conversation: Conversation;
  onlineUsers: Set<string>;
}

export function ConversationAvatar({
  conversation,
  onlineUsers,
}: ConversationAvatarProps) {
  if (!conversation.isGroup) {
    const other = conversation.members.find((m) => m.id !== CURRENT_USER.id);
    const isOnline = other?.id ? onlineUsers.has(other.id) : false;
    return (
      <div className="relative h-9 w-9 rounded-full bg-muted flex-shrink-0">
        <div className="relative h-full w-full rounded-full overflow-hidden">
          {other?.avatar ? (
            <Image
              src={other.avatar}
              alt={other.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
              {other?.displayName?.[0] ?? "?"}
            </span>
          )}
        </div>
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${isOnline ? "bg-green-500" : "bg-muted-foreground/40"}`}
        />
      </div>
    );
  }

  // Group avatar — show first 2 members
  const first = conversation.members.slice(0, 2);
  return (
    <div className="relative h-9 w-9 flex-shrink-0">
      {first.map((m, i) => (
        <div
          key={m.id}
          className="absolute h-6 w-6 rounded-full overflow-hidden bg-muted border-2 border-background"
          style={{ top: i === 0 ? 0 : 12, left: i === 0 ? 0 : 12, zIndex: i }}
        >
          {m.avatar ? (
            <Image
              src={m.avatar}
              alt={m.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">
              {m.displayName[0]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
