import { useEffect, useState, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";

export function useServer(serverId?: string) {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const targetServerId = serverId || activeServerId;
  const [loading, setLoading] = useState(false);

  const server = useServerStore((s) => s.servers.find((srv) => srv.id === targetServerId)) || null;
  const channels = useServerStore((s) => s.channels[targetServerId || ""]) || [];
  const members = useServerStore((s) => s.members[targetServerId || ""]) || [];
  const roles = useServerStore((s) => s.roles[targetServerId || ""]) || [];
  
  const activeChannelId = useServerStore((s) => s.activeChannelId);
  const setActiveChannelId = useServerStore((s) => s.setActiveChannelId);

  const fetchServerDetails = useCallback(async () => {
    if (!targetServerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${targetServerId}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.data;
        const store = useServerStore.getState();
        store.setChannels(targetServerId, s.channels || []);
        store.setMembers(targetServerId, s.members || []);
        store.setRoles(targetServerId, s.roles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [targetServerId]);

  useEffect(() => {
    if (targetServerId) {
      fetchServerDetails();
    }
  }, [targetServerId, fetchServerDetails]);

  const createChannel = useCallback(
    async (
      name: string,
      type: "TEXT" | "VOICE" | "FORUM" | "STAGE",
      topic?: string,
    ) => {
      if (!targetServerId) return;
      const res = await fetch(`/api/servers/${targetServerId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, topic }),
      });
      if (res.ok) {
        const data = await res.json();
        useServerStore.getState().addChannel(targetServerId, data.channel);
        return data.channel;
      }
    },
    [targetServerId],
  );

  const leaveServer = useCallback(async () => {
    if (!targetServerId) return;
    const res = await fetch(`/api/servers/${targetServerId}/members`, {
      method: "DELETE",
    });
    if (res.ok) useServerStore.getState().removeServer(targetServerId);
  }, [targetServerId]);

  return {
    server,
    channels,
    members,
    roles,
    createChannel,
    leaveServer,
    loading,
    refresh: fetchServerDetails,
    activeChannelId,
    setActiveChannelId,
  };
}
