import { useEffect, useState, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";

export function useServer(serverId?: string) {
  const store = useServerStore();
  const targetServerId = serverId || store.activeServerId;
  const [loading, setLoading] = useState(false);

  const server = store.servers.find((s) => s.id === targetServerId) || null;
  const channels = store.channels[targetServerId || ""] || [];
  const members = store.members[targetServerId || ""] || [];
  const roles = store.roles[targetServerId || ""] || [];

  const fetchServerDetails = useCallback(async () => {
    if (!targetServerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${targetServerId}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.data;
        store.setChannels(targetServerId, s.channels || []);
        store.setMembers(targetServerId, s.members || []);
        store.setRoles(targetServerId, s.roles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [targetServerId, store]);

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
        store.addChannel(targetServerId, data.channel);
        return data.channel;
      }
    },
    [targetServerId, store],
  );

  const leaveServer = useCallback(async () => {
    if (!targetServerId) return;
    const res = await fetch(`/api/servers/${targetServerId}/members`, {
      method: "DELETE",
    });
    if (res.ok) store.removeServer(targetServerId);
  }, [targetServerId, store]);

  return {
    server,
    channels,
    members,
    roles,
    createChannel,
    leaveServer,
    loading,
    refresh: fetchServerDetails,
    activeChannelId: store.activeChannelId,
    setActiveChannelId: store.setActiveChannelId,
  };
}
