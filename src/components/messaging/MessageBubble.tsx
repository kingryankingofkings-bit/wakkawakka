import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  CornerUpLeft,
  Play,
  Pause,
  Shield,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/mockData";
import type { Message } from "@/types";
import toast from "react-hot-toast";

// =============================================================================
// WhatsApp Flows (Structured interactive forms)
// =============================================================================
function WhatsAppFlow({ flowData }: { flowData: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  let config: any = null;
  try {
    config = JSON.parse(flowData);
  } catch {
    config = {
      title: "Flow Survey",
      questions: [
        {
          id: "1",
          label: "Are you enjoying Batch 5?",
          options: ["Yes, absolutely!", "It is great!"],
        },
      ],
    };
  }

  const handleToggle = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Flow form submitted successfully!");
  };

  return (
    <div className="bg-card text-foreground border border-border rounded-2xl p-3 my-1.5 max-w-[260px] space-y-2 text-xs shadow-sm">
      <div className="font-bold flex items-center gap-1.5 text-green-600">
        <span>💬</span> {config.title}
      </div>
      {submitted ? (
        <div className="text-green-500 font-semibold flex items-center gap-1 py-1">
          <Check className="h-4 w-4" /> Submission Confirmed!
        </div>
      ) : (
        <div className="space-y-2">
          {config.questions?.map((q: any) => (
            <div key={q.id} className="space-y-1">
              <p className="font-semibold text-muted-foreground">{q.label}</p>
              {q.options?.map((opt: string) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => handleToggle(opt)}
                    className="rounded border-border text-green-600 focus:ring-green-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors mt-2"
          >
            Submit Flow Form
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Telegram Mini Apps / WebApps
// =============================================================================
function TelegramMiniApp({ appData }: { appData: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [calcVal, setCalcVal] = useState("0");

  const handleCalcClick = (char: string) => {
    if (char === "C") setCalcVal("0");
    else if (char === "=") {
      try {
        setCalcVal(String(eval(calcVal)));
      } catch {
        setCalcVal("Error");
      }
    } else {
      setCalcVal((prev) => (prev === "0" ? char : prev + char));
    }
  };

  return (
    <div className="bg-card text-foreground border border-border rounded-2xl p-3 my-1.5 max-w-[260px] space-y-2 text-xs shadow-sm">
      <div className="font-bold text-sky-500 flex items-center gap-1.5">
        <span>🤖</span> {appData || "Inline Utility app"}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Launch tool instantly inside a modal webview container.
      </p>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors"
      >
        Open Mini WebApp
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl w-72 p-4 space-y-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="font-bold text-sm text-sky-500">
                Calculator WebApp
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-muted p-3 rounded-2xl text-right font-mono text-xl truncate text-foreground">
              {calcVal}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                "7",
                "8",
                "9",
                "/",
                "4",
                "5",
                "6",
                "*",
                "1",
                "2",
                "3",
                "-",
                "C",
                "0",
                "=",
                "+",
              ].map((char) => (
                <button
                  key={char}
                  onClick={() => handleCalcClick(char)}
                  className="p-2.5 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-colors"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Discord Activities (Social Gaming)
// =============================================================================
function DiscordActivity({ activityData }: { activityData: string }) {
  const [joined, setJoined] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <div className="bg-card text-foreground border border-border rounded-2xl p-3 my-1.5 max-w-[260px] space-y-2 text-xs shadow-sm">
      <div className="font-bold text-purple-500 flex items-center gap-1.5">
        <span>🎮</span> Discord Activity: {activityData || "Social Room"}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Launch in-channel games and screenshares.
      </p>

      {joined ? (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
              Live Players
            </span>
            <div className="flex -space-x-1.5">
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="avatar"
                className="h-5 w-5 rounded-full border border-background"
              />
              <img
                src="https://i.pravatar.cc/100?img=47"
                alt="avatar"
                className="h-5 w-5 rounded-full border border-background"
              />
            </div>
          </div>
          <div className="bg-muted p-2.5 rounded-xl text-center space-y-1.5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground">
              Clicker Activity
            </p>
            <p className="font-black text-lg text-purple-500">
              {clicks} Clicks
            </p>
            <button
              onClick={() => setClicks((c) => c + 1)}
              className="px-3 py-1 bg-purple-500 text-white rounded-lg text-[10px] font-bold hover:bg-purple-600 transition-colors"
            >
              Click Here!
            </button>
          </div>
          <button
            onClick={() => setJoined(false)}
            className="w-full py-1 text-muted-foreground hover:text-foreground text-[10px] font-semibold"
          >
            Leave Room
          </button>
        </div>
      ) : (
        <button
          onClick={() => setJoined(true)}
          className="w-full py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors"
        >
          Join Activity
        </button>
      )}
    </div>
  );
}

function AudioPlayer({ url, isOwn }: { url: string; isOwn: boolean }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .catch((e) => console.error("Audio play failed:", e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-xl min-w-[240px]",
        isOwn
          ? "bg-primary-foreground/10 text-primary-foreground"
          : "bg-muted text-foreground",
      )}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
          isOwn
            ? "bg-white text-primary hover:bg-white/90"
            : "bg-primary text-white hover:bg-primary/90",
        )}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-current bg-current/25"
        />
        <div className="flex justify-between text-[10px] opacity-75">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
}

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
