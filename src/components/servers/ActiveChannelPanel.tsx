"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Paperclip,
  PhoneOff,
  Music,
  Mic,
  MicOff,
  MessageSquarePlus,
  Hand,
  Sparkles,
  Radio,
  MessageSquare,
  AlertCircle,
  Menu,
  Users,
  Volume2 as VolumeIcon,
  X,
} from "lucide-react";
import { useChannel } from "@/hooks/useChannel";
import { useVoice } from "@/hooks/useVoice";
import { useStage } from "@/hooks/useStage";
import { useServer } from "@/hooks/useServer";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { ServerChannel } from "@/store/serverStore";

interface ActiveChannelPanelProps {
  serverId: string;
  channelId: string;
  onOpenLeftDrawer?: () => void;
  onOpenRightDrawer?: () => void;
}

export function ActiveChannelPanel({
  serverId,
  channelId,
  onOpenLeftDrawer,
  onOpenRightDrawer,
}: ActiveChannelPanelProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { channels, createChannel } = useServer(serverId);
  const { hasPermission } = useServerPermissions(serverId);

  const channel = channels.find((c) => c.id === channelId);

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground bg-background">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p className="text-sm">Channel not found or loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center px-6 justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {onOpenLeftDrawer && (
            <button
              onClick={onOpenLeftDrawer}
              aria-label="Open server and channel list"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground md:hidden mr-1"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <span className="text-muted-foreground font-semibold text-lg">
            {channel.type === "VOICE"
              ? "🔊"
              : channel.type === "FORUM"
                ? "💬"
                : channel.type === "STAGE"
                  ? "🎙️"
                  : "#"}
          </span>
          <span className="font-bold text-foreground text-base">
            {channel.name}
          </span>
          {channel.topic && (
            <>
              <div className="w-[1px] h-4 bg-border mx-2" />
              <span className="text-xs text-muted-foreground truncate max-w-sm">
                {channel.topic}
              </span>
            </>
          )}
        </div>
        {onOpenRightDrawer && (
          <button
            onClick={onOpenRightDrawer}
            aria-label="Open member list"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground md:hidden"
          >
            <Users className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* View Content */}
      {channel.type === "TEXT" && <TextView channelId={channelId} />}
      {channel.type === "VOICE" && (
        <VoiceView serverId={serverId} channelId={channelId} />
      )}
      {channel.type === "FORUM" && (
        <ForumView
          serverId={serverId}
          channelId={channelId}
          createChannel={createChannel}
        />
      )}
      {channel.type === "STAGE" && (
        <StageView
          serverId={serverId}
          channelId={channelId}
          hasMod={hasPermission("MUTE_MEMBERS")}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-VIEW COMPONENTS
// =============================================================================

function TextView({ channelId }: { channelId: string }) {
  const { messages, sendMessage, typingUsers } = useChannel(channelId);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-4xl mb-2">👋</span>
            <p className="text-sm font-semibold">
              Welcome to the start of the channel!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-3 hover:bg-muted/10 p-1 rounded transition-colors group"
            >
              <Avatar
                src={msg.sender?.avatar || ""}
                className="h-10 w-10 mt-0.5"
              />
              <div className="flex-1 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground">
                    {msg.sender?.displayName || "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-xs text-muted-foreground italic">
          {typingUsers.join(", ")}{" "}
          {typingUsers.length === 1 ? "is typing..." : "are typing..."}
        </div>
      )}

      {/* Chat Input form */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-border flex items-center gap-3"
      >
        <button
          type="button"
          aria-label="Attach file"
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          placeholder="Message this channel..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="p-2 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

function VoiceView({
  serverId,
  channelId,
}: {
  serverId: string;
  channelId: string;
}) {
  const { isConnected, isMuted, join, leave, toggleMute, playSound } =
    useVoice(channelId);
  const [sounds, setSounds] = useState<any[]>([]);

  useEffect(() => {
    const fetchSounds = async () => {
      try {
        const res = await fetch(`/api/servers/${serverId}/soundboard`);
        if (res.ok) {
          const data = await res.json();
          setSounds(data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSounds();
  }, [serverId]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      {/* Connection Panel */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center shadow-md">
        <VolumeIcon
          className={cn(
            "h-16 w-16 mb-4 text-muted-foreground animate-pulse",
            isConnected && "text-green-500",
          )}
        />
        <h3 className="text-lg font-bold mb-1">Voice Connection</h3>
        <p className="text-xs text-muted-foreground mb-6">
          {isConnected
            ? "You are connected to the voice channel"
            : "Connect to join the voice chat room"}
        </p>
        <div className="flex gap-4">
          {!isConnected ? (
            <button
              onClick={join}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 transition-colors active:scale-95 shadow-md"
            >
              Join Voice
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "p-3 rounded-xl border border-border text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                  isMuted
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={leave}
                className="px-6 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors flex items-center gap-2 active:scale-95 shadow-md shadow-red-500/15"
              >
                <PhoneOff className="h-4 w-4" />
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Soundboard Section */}
      {isConnected && (
        <div className="border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-bold">Soundboard</h3>
          </div>
          {sounds.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No soundboard sounds uploaded to this server yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => playSound(sound.soundUrl)}
                  className="p-3 bg-muted hover:bg-primary hover:text-primary-foreground border border-border hover:border-transparent rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all duration-200"
                >
                  <span className="text-lg">{sound.emoji || "🔊"}</span>
                  <span>{sound.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ForumView({
  serverId,
  channelId,
  createChannel,
}: {
  serverId: string;
  channelId: string;
  createChannel: any;
}) {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");

  // Fetch threads: channels where parentId is this channelId
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/channels`);
      if (res.ok) {
        const data = await res.json();
        const subThreads = (data.data || []).filter(
          (c: any) => c.parentId === channelId,
        );
        setThreads(subThreads);
      }
    } catch (err) {
      console.error(err);
    }
  }, [serverId, channelId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim()) return;

    // Create a thread channel
    const res = await fetch(
      `/api/servers/${serverId}/channels/${channelId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: threadTitle }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      setShowCreateModal(false);
      setThreadTitle("");
      fetchThreads();
      // Redirect to new thread chat page
      router.push(`/servers/${serverId}/${data.data.id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div>
          <h2 className="text-base font-bold">Forum Board</h2>
          <p className="text-xs text-muted-foreground">
            Browse topic discussions or start a new thread
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/95 transition-colors shadow-sm"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Post
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-2xl">
          <MessageSquare className="h-8 w-8 mb-2" />
          <p className="text-sm font-medium">
            No threads created yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/servers/${serverId}/${thread.id}`}
              className="flex items-center justify-between p-4 bg-card hover:bg-muted/10 border border-border hover:border-muted-foreground/20 rounded-xl transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <span className="font-semibold block text-foreground hover:underline text-sm">
                    {thread.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Started recently
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-muted rounded-full font-medium text-muted-foreground">
                View Thread
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">
              Start a Discussion Thread
            </h2>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                  Thread Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="What do you want to talk about?"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-sm font-semibold transition-colors"
                >
                  Start Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StageView({
  serverId,
  channelId,
  hasMod,
}: {
  serverId: string;
  channelId: string;
  hasMod: boolean;
}) {
  const {
    speakers,
    requestedToSpeak,
    requestToSpeak,
    moderateUser,
    fetchStageQueue,
  } = useStage(channelId);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchStageQueue();
  }, [channelId, fetchStageQueue]);

  const isCurrentUserSpeaker = currentUser
    ? speakers.includes(currentUser.id)
    : false;
  const isCurrentUserRequested = currentUser
    ? requestedToSpeak.includes(currentUser.id)
    : false;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      {/* On Stage Speakers */}
      <div>
        <div className="flex items-center gap-2 mb-3 border-b border-border pb-1.5">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-bold uppercase text-muted-foreground">
            On Stage Speakers
          </h3>
        </div>
        {speakers.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pl-2">
            Stage is currently quiet.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pl-2">
            {speakers.map((userId) => (
              <div
                key={userId}
                className="flex flex-col items-center text-center p-2 rounded-xl bg-card border border-border shadow-sm"
              >
                <Avatar className="h-12 w-12 mb-2 border-2 border-primary" />
                <span className="text-xs font-semibold block truncate w-full text-foreground">
                  User {userId.substring(0, 5)}
                </span>
                {hasMod && (
                  <button
                    onClick={() => moderateUser(userId, "DEMOTE")}
                    className="text-[10px] text-red-500 mt-2 hover:underline"
                  >
                    Demote to Audience
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audience Controls */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full shadow-md text-center">
        <Radio className="h-14 w-14 mb-3 text-primary animate-pulse" />
        <h4 className="text-sm font-bold mb-1">Stage Discussion Session</h4>
        <p className="text-xs text-muted-foreground mb-6">
          {isCurrentUserSpeaker
            ? "You are active speaker on stage. Speak freely."
            : isCurrentUserRequested
              ? "Your request to speak is pending approval"
              : "Listen in or request to speak"}
        </p>
        {!isCurrentUserSpeaker && !isCurrentUserRequested && (
          <button
            onClick={requestToSpeak}
            className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition-colors shadow-md active:scale-95"
          >
            <Hand className="h-4 w-4" />
            Request to Speak
          </button>
        )}
      </div>

      {/* Hand Raise queue (Moderators only) */}
      {hasMod && (
        <div className="border border-border rounded-2xl p-6">
          <h4 className="text-sm font-bold mb-3 uppercase text-muted-foreground">
            Speaker Requests
          </h4>
          {requestedToSpeak.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No requests to speak right now.
            </p>
          ) : (
            <div className="space-y-2">
              {requestedToSpeak.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8" />
                    <span className="text-sm font-semibold">
                      User {userId.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderateUser(userId, "PROMOTE")}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg font-semibold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderateUser(userId, "REMOVE")}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
