"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { Message, Notification } from "@/types";
import { CURRENT_USER } from "@/lib/mockData";
import { useMessageStore } from "@/store/messageStore";
import { useNotificationStore } from "@/store/notificationStore";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const addMessage = useMessageStore((s) => s.addMessage);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleNewMessage = useCallback(
    (data: any) => {
      const msg = data && data.message ? data.message : data;
      addMessage(msg);
    },
    [addMessage],
  );

  const handleNotification = useCallback(
    (notification: Notification) => {
      addNotification(notification);
    },
    [addNotification],
  );

  const handleUserOnline = useCallback((data: any) => {
    const id = typeof data === "object" && data ? data.userId : data;
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      if (typeof data === "object" && data && Array.isArray(data.onlineUsers)) {
        data.onlineUsers.forEach((u: string) => next.add(u));
      }
      if (id && typeof id === "string") {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleUserOffline = useCallback((data: any) => {
    const id = typeof data === "object" && data ? data.userId : data;
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      if (id && typeof id === "string") {
        next.delete(id);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    let socket: Socket | null = null;

    const connect = async () => {
      try {
        const { io } = await import("socket.io-client");
        const url =
          process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

        socket = io(url, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          timeout: 5000,
        } as any);

        socketRef.current = socket;

        socket.on("connect", () => {
          setIsConnected(true);
          socket?.emit("join-user", CURRENT_USER.id);
        });

        socket.on("disconnect", () => {
          setIsConnected(false);
        });

        socket.on("connect_error", () => {
          // Graceful fallback – demo mode, no crash
          setIsConnected(false);
        });

        socket.on("new-message", handleNewMessage);
        socket.on("notification", handleNotification);
        socket.on("user-online", handleUserOnline);
        socket.on("user-offline", handleUserOffline);

        // Typing events are listened to on the socket but consumed by
        // ChatWindow directly via the socket ref; stub listeners here so
        // the event pipeline is registered.
        socket.on("typing", () => {});
        socket.on("stop-typing", () => {});
      } catch {
        // socket.io-client unavailable or blocked – silently degrade
        socketRef.current = null;
      }
    };

    connect();

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("new-message", handleNewMessage);
        socket.off("notification", handleNotification);
        socket.off("user-online", handleUserOnline);
        socket.off("user-offline", handleUserOffline);
        socket.off("typing");
        socket.off("stop-typing");
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    handleNewMessage,
    handleNotification,
    handleUserOnline,
    handleUserOffline,
  ]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
  };
}
