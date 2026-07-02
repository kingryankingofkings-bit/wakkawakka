import { useState, useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export function useChannel(channelId: string) {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const messages = useServerStore((s) => s.messages[channelId]) || [];
  const setMessages = useServerStore((s) => s.setMessages);
  const addMessage = useServerStore((s) => s.addMessage);
  const removeMessage = useServerStore((s) => s.removeMessage);

  const { socket } = useSocket();
  const currentUser = useAuthStore((s) => s.user);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> displayName

  // Fetch initial messages
  useEffect(() => {
    const fetchMsgs = async () => {
      const res = await fetch(
        `/api/servers/${activeServerId}/channels/${channelId}/messages`,
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(channelId, data.messages);
      }
    };
    if (channelId && activeServerId) fetchMsgs();
  }, [channelId, activeServerId, setMessages]);

  // Subscribe to channel sockets
  useEffect(() => {
    if (!socket || !channelId) return;
    socket.emit("join-server-channel", channelId);

    const handleNewMessage = (msg: any) => {
      addMessage(channelId, msg);
    };
    const handleMessageDeleted = (msgId: string) => {
      removeMessage(channelId, msgId);
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
  }, [socket, channelId, currentUser, addMessage, removeMessage]);

  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!activeServerId || !channelId) return;
      const res = await fetch(
        `/api/servers/${activeServerId}/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, attachments }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        addMessage(channelId, data.message);
        if (socket) {
          socket.emit("send-server-message", {
            channelId,
            message: data.message,
          });
        }
      }
    },
    [channelId, socket, activeServerId, addMessage],
  );

  return {
    messages,
    typingUsers: Object.values(typingUsers),
    sendMessage,
  };
}
