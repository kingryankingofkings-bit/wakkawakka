"use client";

import { AlertCircle, Menu, Users } from "lucide-react";
import { useServer } from "@/hooks/useServer";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  ChannelTextView,
  ChannelVoiceView,
  ChannelForumView,
  ChannelStageView,
} from "./views";

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
      {channel.type === "TEXT" && <ChannelTextView channelId={channelId} />}
      {channel.type === "VOICE" && (
        <ChannelVoiceView serverId={serverId} channelId={channelId} />
      )}
      {channel.type === "FORUM" && (
        <ChannelForumView
          serverId={serverId}
          channelId={channelId}
          createChannel={createChannel}
        />
      )}
      {channel.type === "STAGE" && (
        <ChannelStageView
          serverId={serverId}
          channelId={channelId}
          hasMod={hasPermission("MUTE_MEMBERS")}
        />
      )}
    </div>
  );
}
