import { useState, useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export function useChannel(channelId: string) {
  const store = useServerStore();
  const { socket } = useSocket();
  const currentUser = useAuthStore((s) => s.user);
  const messages = store.messages[channelId] || [];
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> displayName

  // Fetch initial messages
  useEffect(() => {
    const fetchMsgs = async () => {
      const res = await fetch(
        `/api/servers/${store.activeServerId}/channels/${channelId}/messages`,
      );
      if (res.ok) {
        const data = await res.json();
        store.setMessages(channelId, data.messages);
      }
    };
    if (channelId && store.activeServerId) fetchMsgs();
  }, [channelId, store]);

  // Subscribe to channel sockets
  useEffect(() => {
    if (!socket || !channelId) return;
    socket.emit("join-server-channel", channelId);

    const handleNewMessage = (msg: any) => {
      store.addMessage(channelId, msg);
    };
    const handleMessageDeleted = (msgId: string) => {
      store.removeMessage(channelId, msgId);
    };

    const handleTyping = (data: any) => {
      if (data.userId !== currentUser?.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.displayName,
        }));
      }
    };
    const handleStopTyping = (data: any) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    socket.on("new-server-message", handleNewMessage);
    socket.on("server-message-deleted", handleMessageDeleted);
    socket.on("server-typing", handleTyping);
    socket.on("server-stop-typing", handleStopTyping);

    return () => {
      socket.emit("leave-server-channel", channelId);
      socket.off("new-server-message", handleNewMessage);
      socket.off("server-message-deleted", handleMessageDeleted);
      socket.off("server-typing", handleTyping);
      socket.off("server-stop-typing", handleStopTyping);
    };
  }, [socket, channelId, currentUser, store]);

  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!store.activeServerId || !channelId) return;
      const res = await fetch(
        `/api/servers/${store.activeServerId}/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, attachments }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        store.addMessage(channelId, data.message);
        if (socket) {
          socket.emit("send-server-message", {
            channelId,
            message: data.message,
          });
        }
      }
    },
    [channelId, socket, store],
  );

  return {
    messages,
    typingUsers: Object.values(typingUsers),
    sendMessage,
  };
}
