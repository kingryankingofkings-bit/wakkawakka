import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  CornerUpLeft,
  Shield,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/mockData";
import type { Message } from "@/types";
import toast from "react-hot-toast";
import {
  WhatsAppFlow,
  TelegramMiniApp,
  DiscordActivity,
  AudioPlayer,
} from "./embeds";


interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isGroup: boolean;
  onReply: (message: Message) => void;
  onReact: (message: Message) => void;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

function DeliveryIcon({ status }: { status: DeliveryStatus }) {
  if (status === "sending") {
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
  if (status === "sent") {
    return <Check className="h-3 w-3 text-muted-foreground" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  }
  return <CheckCheck className="h-3 w-3 text-primary" />;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(
    new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-300 dark:bg-yellow-800 text-black dark:text-white px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isGroup,
  onReply,
  onReact,
  onCopy,
  onDelete,
  searchQuery = "",
}: MessageBubbleProps) {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const deliveryStatus: DeliveryStatus = isOwn
    ? message.isRead
      ? "read"
      : "delivered"
    : "sent";

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      // Position near the center of screen on mobile
      setContextMenu({
        x: window.innerWidth / 2 - 80,
        y: window.innerHeight / 2 - 60,
      });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  React.useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close);
    };
  }, [contextMenu]);

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex gap-2 px-4 py-0.5",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div className="italic text-xs text-muted-foreground px-3 py-1.5">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-0.5 group",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar slot – only shown in groups on last message in sequence */}
      <div className="w-8 flex-shrink-0 self-end">
        {isGroup && !isOwn && showAvatar ? (
          <div className="relative h-7 w-7 rounded-full overflow-hidden bg-muted">
            {message.sender.avatar ? (
              <Image
                src={message.sender.avatar}
                alt={message.sender.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                {message.sender.displayName[0]}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name (group only, not own) */}
        {isGroup && !isOwn && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground mb-0.5 ml-1">
            {message.sender.displayName}
          </span>
        )}

        {/* Reply-to indicator */}
        {message.replyTo && !message.replyTo.isDeleted && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs text-muted-foreground mb-1 px-2 py-1 rounded-md border border-border/50 bg-muted/40 max-w-full",
              isOwn ? "flex-row-reverse" : "flex-row",
            )}
          >
            <CornerUpLeft className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium">
              {message.replyTo.sender.displayName}
            </span>
            <span className="truncate max-w-[160px]">
              {message.replyTo.content}
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          className={cn(
            "relative rounded-2xl px-3.5 py-2 text-sm select-none cursor-pointer",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border text-foreground rounded-bl-sm",
          )}
        >
          {/* Media content */}
          {message.mediaUrl &&
            (message.type === "VOICE" || message.mediaType === "audio") && (
              <div className="mb-1">
                <AudioPlayer url={message.mediaUrl} isOwn={isOwn} />
              </div>
            )}

          {message.mediaUrl && message.mediaType === "image" && (
            <div className="relative mb-1 rounded-lg overflow-hidden max-w-[280px]">
              <Image
                src={message.mediaUrl}
                alt="Shared image"
                width={280}
                height={200}
                className="object-cover w-full h-auto rounded-lg"
              />
            </div>
          )}

          {message.mediaUrl && message.mediaType === "video" && (
            <div className="mb-1 rounded-lg overflow-hidden max-w-[280px]">
              <video
                src={message.mediaUrl}
                controls
                className="w-full rounded-lg"
                preload="metadata"
              />
            </div>
          )}

          {message.mediaUrl && message.mediaType === "file" && (
            <div
              className={cn(
                "flex items-center gap-2 mb-1 px-2 py-1 rounded-lg",
                isOwn ? "bg-primary-foreground/10" : "bg-muted",
              )}
            >
              <span className="text-xs font-medium truncate max-w-[200px]">
                {message.mediaUrl.split("/").pop()}
              </span>
            </div>
          )}

          {/* Text content */}
          {(() => {
            const isE2EE =
              message.content && message.content.startsWith("[E2EE-AES-GCM]:");
            let displayContent = message.content || "";
            if (isE2EE) {
              try {
                const payload = message.content!.substring(
                  "[E2EE-AES-GCM]:".length,
                );
                displayContent = decodeURIComponent(escape(atob(payload)));
              } catch (err) {
                displayContent = "[Decryption Error]";
              }
            }

            return (
              <>
                {isE2EE && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-semibold mb-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 w-fit",
                      isOwn ? "ml-auto" : "mr-auto",
                    )}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Simulated End-to-End Encrypted (AES-GCM)</span>
                  </div>
                )}
                {displayContent && (
                  <div>
                    {displayContent.startsWith("[FLOW]:") ? (
                      <WhatsAppFlow flowData={displayContent.substring(7)} />
                    ) : displayContent.startsWith("[MINIAPP]:") ? (
                      <TelegramMiniApp appData={displayContent.substring(10)} />
                    ) : displayContent.startsWith("[ACTIVITY]:") ? (
                      <DiscordActivity
                        activityData={displayContent.substring(11)}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words leading-snug">
                        <HighlightedText
                          text={displayContent}
                          query={searchQuery}
                        />
                      </p>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* Timestamp */}
          <span
            className={cn(
              "text-[10px] mt-0.5 block",
              isOwn
                ? "text-primary-foreground/60 text-right"
                : "text-muted-foreground text-right",
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div
              className={cn(
                "absolute -bottom-2 flex items-center gap-1 bg-card border border-border shadow-sm rounded-full px-1.5 py-0.5",
                isOwn ? "right-2" : "left-2",
              )}
            >
              {Object.entries(message.reactions).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="text-[10px] text-foreground font-medium flex items-center gap-0.5"
                >
                  {emoji} {count > 1 && count}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Delivery status & read receipt (own messages only) */}
        {isOwn && (
          <div className="flex items-center gap-1 mt-0.5 pr-1">
            {message.isRead && (
              <span className="text-[10px] text-muted-foreground">
                Read {formatRelativeTime(message.createdAt)}
              </span>
            )}
            <DeliveryIcon status={deliveryStatus} />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[140px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              label: "Reply",
              icon: "↩",
              action: () => {
                onReply(message);
                setContextMenu(null);
              },
            },
            {
              label: "React",
              icon: "😊",
              action: () => {
                onReact(message);
                setContextMenu(null);
              },
            },
            {
              label: "Copy",
              icon: "📋",
              action: () => {
                onCopy(message.content);
                setContextMenu(null);
              },
            },
            ...(isOwn
              ? [
                  {
                    label: "Delete",
                    icon: "🗑",
                    action: () => {
                      onDelete(message.id);
                      setContextMenu(null);
                    },
                    destructive: true,
                  },
                ]
              : []),
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors",
                "destructive" in item &&
                  item.destructive &&
                  "text-destructive hover:bg-destructive/10",
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
