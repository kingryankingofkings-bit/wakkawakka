import { useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export function useStage(channelId: string) {
  const store = useServerStore();
  const { socket } = useSocket();
  const stage = store.stage;
  const currentUser = useAuthStore((s) => s.user);

  const fetchStageQueue = useCallback(async () => {
    if (!store.activeServerId || !channelId) return;
    const res = await fetch(
      `/api/servers/${store.activeServerId}/channels/${channelId}/stage`,
    );
    if (res.ok) {
      const data = await res.json();
      store.setStageQueue({
        speakers: (data.speakers || []).map((m: any) => m.userId),
        listeners: (data.listeners || []).map((m: any) => m.userId),
        requestedToSpeak: (data.requestedToSpeak || []).map(
          (m: any) => m.userId,
        ),
      });
    }
  }, [channelId, store]);

  useEffect(() => {
    if (!socket || !channelId || !currentUser || !store.activeServerId) return;

    store.joinStage(store.activeServerId, channelId, false, currentUser.id);
    socket.emit("join-stage", {
      serverId: store.activeServerId,
      channelId,
      userId: currentUser.id,
    });

    const handleJoined = (_data: any) => {
      fetchStageQueue();
    };

    const handleAction = (data: any) => {
      let role: "SPEAKER" | "LISTENER" | "REQUESTED" = "LISTENER";
      if (data.action === "PROMOTE") role = "SPEAKER";
      else if (data.action === "DEMOTE") role = "LISTENER";
      else if (data.action === "REQUESTED") role = "REQUESTED";

      store.updateStageUserRole(data.targetUserId, role);
    };

    socket.on("stage-user-joined", handleJoined);
    socket.on("stage-speaker-action", handleAction);

    return () => {
      socket.emit("leave-stage", { channelId, userId: currentUser.id });
      store.leaveStage(currentUser.id);
      socket.off("stage-user-joined", handleJoined);
      socket.off("stage-speaker-action", handleAction);
    };
  }, [socket, channelId, currentUser, store, fetchStageQueue]);

  const requestToSpeak = useCallback(() => {
    if (!socket || !currentUser) return;
    socket.emit("stage-request-speak", { channelId, userId: currentUser.id });
    store.updateStageUserRole(currentUser.id, "REQUESTED");
  }, [socket, channelId, currentUser, store]);

  const moderateUser = useCallback(
    (targetUserId: string, action: "PROMOTE" | "DEMOTE" | "REMOVE") => {
      if (!socket) return;
      socket.emit("stage-moderate-speaker", {
        channelId,
        targetUserId,
        action,
      });
      let role: "SPEAKER" | "LISTENER" | "REQUESTED" = "LISTENER";
      if (action === "PROMOTE") role = "SPEAKER";
      store.updateStageUserRole(targetUserId, role);
    },
    [socket, channelId, store],
  );

  return {
    speakers: stage.speakers,
    listeners: stage.listeners,
    requestedToSpeak: stage.requestedToSpeak,
    requestToSpeak,
    moderateUser,
    fetchStageQueue,
  };
}
