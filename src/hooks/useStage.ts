import { useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export function useStage(channelId: string) {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const stage = useServerStore((s) => s.stage);
  const setStageQueue = useServerStore((s) => s.setStageQueue);
  const joinStage = useServerStore((s) => s.joinStage);
  const updateStageUserRole = useServerStore((s) => s.updateStageUserRole);
  const leaveStageStore = useServerStore((s) => s.leaveStage);
  
  const { socket } = useSocket();
  const currentUser = useAuthStore((s) => s.activeProfile);

  const fetchStageQueue = useCallback(async () => {
    if (!activeServerId || !channelId) return;
    const res = await fetch(
      `/api/servers/${activeServerId}/channels/${channelId}/stage`,
    );
    if (res.ok) {
      const data = await res.json();
      setStageQueue({
        speakers: (data.speakers || []).map((m: any) => m.userId),
        listeners: (data.listeners || []).map((m: any) => m.userId),
        requestedToSpeak: (data.requestedToSpeak || []).map(
          (m: any) => m.userId,
        ),
      });
    }
  }, [channelId, activeServerId, setStageQueue]);

  useEffect(() => {
    if (!socket || !channelId || !currentUser || !activeServerId) return;

    joinStage(activeServerId, channelId, false, currentUser.id);
    socket.emit("join-stage", {
      serverId: activeServerId,
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

      updateStageUserRole(data.targetUserId, role);
    };

    socket.on("stage-user-joined", handleJoined);
    socket.on("stage-speaker-action", handleAction);

    return () => {
      socket.emit("leave-stage", { channelId, userId: currentUser.id });
      leaveStageStore(currentUser.id);
      socket.off("stage-user-joined", handleJoined);
      socket.off("stage-speaker-action", handleAction);
    };
  }, [socket, channelId, currentUser, activeServerId, joinStage, fetchStageQueue, updateStageUserRole, leaveStageStore]);

  const requestToSpeak = useCallback(() => {
    if (!socket || !currentUser) return;
    socket.emit("stage-request-speak", { channelId, userId: currentUser.id });
    updateStageUserRole(currentUser.id, "REQUESTED");
  }, [socket, channelId, currentUser, updateStageUserRole]);

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
      updateStageUserRole(targetUserId, role);
    },
    [socket, channelId, updateStageUserRole],
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
