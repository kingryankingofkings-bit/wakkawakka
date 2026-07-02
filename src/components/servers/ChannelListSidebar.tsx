"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash,
  Volume2,
  MessagesSquare,
  Radio,
  Settings,
  UserPlus,
  Plus,
  Mic,
  MicOff,
  LogOut,
} from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { useVoice } from "@/hooks/useVoice";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";

interface ChannelListSidebarProps {
  serverId: string;
}

export function ChannelListSidebar({ serverId }: ChannelListSidebarProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.activeProfile);
  const {
    server,
    channels,
    createChannel,
    leaveServer,
    activeChannelId,
    setActiveChannelId,
  } = useServer(serverId);
  const { hasPermission } = useServerPermissions(serverId);
  const { isMuted, isDeafened, toggleMute } = useVoice();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<
    "TEXT" | "VOICE" | "FORUM" | "STAGE"
  >("TEXT");
  const [channelTopic, setChannelTopic] = useState("");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    const created = await createChannel(channelName, channelType, channelTopic);
    if (created) {
      setShowCreateModal(false);
      setChannelName("");
      setChannelTopic("");
      setChannelType("TEXT");
      router.push(`/servers/${serverId}/${created.id}`);
    }
  };

  const textChannels = channels.filter((c) => c.type === "TEXT");
  const voiceChannels = channels.filter((c) => c.type === "VOICE");
  const forumChannels = channels.filter((c) => c.type === "FORUM");
  const stageChannels = channels.filter((c) => c.type === "STAGE");

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "VOICE":
        return Volume2;
      case "FORUM":
        return MessagesSquare;
      case "STAGE":
        return Radio;
      default:
        return Hash;
    }
  };

  return (
    <div className="w-60 bg-muted/40 border-r border-border flex flex-col flex-shrink-0 h-full">
      {/* Header drop-down */}
      <div className="relative border-b border-border h-16 flex items-center px-4 justify-between">
        <button
          onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
          className="font-bold text-sm text-foreground flex items-center justify-between w-full hover:bg-muted/50 p-1.5 rounded-lg transition-colors"
        >
          <span className="truncate">
            {server?.name || "Loading Server..."}
          </span>
          <Settings className="h-4 w-4 ml-1.5 flex-shrink-0 text-muted-foreground" />
        </button>

        {showSettingsDropdown && (
          <div className="absolute top-14 left-4 right-4 bg-card border border-border rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => {
                setShowInviteModal(true);
                setShowSettingsDropdown(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors font-medium text-left"
            >
              <UserPlus className="h-4 w-4" />
              Invite Members
            </button>

            {hasPermission("MANAGE_CHANNELS") && (
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setShowSettingsDropdown(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <Plus className="h-4 w-4" />
                Create Channel
              </button>
            )}

            <div className="h-[1px] bg-border my-1" />

            <button
              onClick={() => {
                leaveServer();
                router.push("/servers");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors font-medium text-left"
            >
              <LogOut className="h-4 w-4" />
              Leave Server
            </button>
          </div>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {/* Text Channels */}
        {textChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground uppercase mb-1.5">
              <span>Text Channels</span>
              {hasPermission("MANAGE_CHANNELS") && (
                <button
                  onClick={() => {
                    setChannelType("TEXT");
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="h-3 w-3 hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {textChannels.map((c) => {
                const Icon = getChannelIcon(c.type);
                const isActive = c.id === activeChannelId;
                return (
                  <Link
                    key={c.id}
                    href={`/servers/${serverId}/${c.id}`}
                    onClick={() => setActiveChannelId(c.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground uppercase mb-1.5">
              <span>Voice Channels</span>
              {hasPermission("MANAGE_CHANNELS") && (
                <button
                  onClick={() => {
                    setChannelType("VOICE");
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="h-3 w-3 hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {voiceChannels.map((c) => {
                const Icon = getChannelIcon(c.type);
                const isActive = c.id === activeChannelId;
                return (
                  <Link
                    key={c.id}
                    href={`/servers/${serverId}/${c.id}`}
                    onClick={() => setActiveChannelId(c.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Forum Channels */}
        {forumChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground uppercase mb-1.5">
              <span>Forum Channels</span>
              {hasPermission("MANAGE_CHANNELS") && (
                <button
                  onClick={() => {
                    setChannelType("FORUM");
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="h-3 w-3 hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {forumChannels.map((c) => {
                const Icon = getChannelIcon(c.type);
                const isActive = c.id === activeChannelId;
                return (
                  <Link
                    key={c.id}
                    href={`/servers/${serverId}/${c.id}`}
                    onClick={() => setActiveChannelId(c.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage Channels */}
        {stageChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground uppercase mb-1.5">
              <span>Stage Channels</span>
              {hasPermission("MANAGE_CHANNELS") && (
                <button
                  onClick={() => {
                    setChannelType("STAGE");
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="h-3 w-3 hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {stageChannels.map((c) => {
                const Icon = getChannelIcon(c.type);
                const isActive = c.id === activeChannelId;
                return (
                  <Link
                    key={c.id}
                    href={`/servers/${serverId}/${c.id}`}
                    onClick={() => setActiveChannelId(c.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer User Widget */}
      <div className="bg-muted px-3 py-2 border-t border-border flex items-center justify-between h-14">
        <div className="flex items-center gap-2 max-w-[130px]">
          <Avatar src={currentUser?.avatar || ""} className="h-8 w-8" />
          <div className="truncate text-xs">
            <span className="font-semibold block truncate leading-tight">
              {currentUser?.displayName || "Loading..."}
            </span>
            <span className="text-muted-foreground text-[10px] truncate leading-tight">
              @{currentUser?.username || "user"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            className="p-1.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={`Invite friends to ${server?.name || ""}`}
      >
        <div className="space-y-4 p-5">
          <p className="text-xs text-muted-foreground">
            Share this code with friends so they can join this server.
          </p>
          <div className="flex gap-2 bg-muted p-2 rounded-xl border border-border items-center justify-between">
            <span className="font-mono text-lg font-bold px-2">
              {server?.inviteCode || "GENERATING..."}
            </span>
            <button
              onClick={() => {
                if (server?.inviteCode) {
                  navigator.clipboard.writeText(server.inviteCode);
                }
              }}
              className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-lg font-semibold hover:bg-primary/95 transition-colors active:scale-95"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setShowInviteModal(false)}
            className="w-full py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Create Channel Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Channel"
      >
        <form onSubmit={handleCreateChannelSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  type: "TEXT",
                  icon: Hash,
                  label: "Text",
                  desc: "Post messages, links, files",
                },
                {
                  type: "VOICE",
                  icon: Volume2,
                  label: "Voice",
                  desc: "Talk live with voice/audio",
                },
                {
                  type: "FORUM",
                  icon: MessagesSquare,
                  label: "Forum",
                  desc: "Create structured post topics",
                },
                {
                  type: "STAGE",
                  icon: Radio,
                  label: "Stage",
                  desc: "Run organized discussions",
                },
              ].map((t) => {
                const TIcon = t.icon;
                const isSelected = channelType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setChannelType(t.type as any)}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/30",
                    )}
                  >
                    <TIcon
                      className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground",
                        isSelected && "text-primary",
                      )}
                    />
                    <div>
                      <span
                        className={cn(
                          "text-sm font-semibold block leading-tight",
                          isSelected && "text-primary",
                        )}
                      >
                        {t.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5 leading-tight">
                        {t.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Channel Name
            </label>
            <input
              type="text"
              required
              placeholder="new-channel"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Topic
            </label>
            <input
              type="text"
              placeholder="Topic of the channel..."
              value={channelTopic}
              onChange={(e) => setChannelTopic(e.target.value)}
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
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
