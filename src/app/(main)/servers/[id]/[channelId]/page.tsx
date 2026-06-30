"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ServerListSidebar } from "@/components/servers/ServerListSidebar";
import { ChannelListSidebar } from "@/components/servers/ChannelListSidebar";
import { ActiveChannelPanel } from "@/components/servers/ActiveChannelPanel";
import { MemberListSidebar } from "@/components/servers/MemberListSidebar";
import { useServerStore } from "@/store/serverStore";
import { cn } from "@/lib/utils";

export default function ServerChannelWorkspacePage() {
  const params = useParams();
  const serverId = params?.id as string;
  const channelId = params?.channelId as string;

  const { setActiveServerId, setActiveChannelId } = useServerStore();

  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Set active context on route changes
  useEffect(() => {
    if (serverId) setActiveServerId(serverId);
    if (channelId) setActiveChannelId(channelId);

    // Auto-close drawers on navigation
    setIsLeftDrawerOpen(false);
    setIsRightDrawerOpen(false);
  }, [serverId, channelId, setActiveServerId, setActiveChannelId]);

  if (!serverId || !channelId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground text-sm">
        Loading channel workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {/* 1. Left Drawer: Holds ServerIcon list + Channel list */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex transform transition-transform duration-300 md:translate-x-0 md:static md:z-auto h-full flex-shrink-0 border-r border-border md:border-r-0",
          isLeftDrawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ServerListSidebar />
        <ChannelListSidebar serverId={serverId} />
      </div>

      {/* 2. Middle Panel: Chat/Voice/Stage Workspace */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-background">
        <ActiveChannelPanel
          serverId={serverId}
          channelId={channelId}
          onOpenLeftDrawer={() => setIsLeftDrawerOpen(true)}
          onOpenRightDrawer={() => setIsRightDrawerOpen(true)}
        />
      </div>

      {/* 3. Right Drawer: Member Directory */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:z-auto h-full flex-shrink-0 border-l border-border md:border-l-0 bg-background",
          isRightDrawerOpen ? "translate-x-0" : "translate-x-full md:block",
        )}
      >
        <MemberListSidebar serverId={serverId} />
      </div>

      {/* Backdrop for Mobile View */}
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div
          className="fixed inset-0 bg-black/55 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => {
            setIsLeftDrawerOpen(false);
            setIsRightDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}
