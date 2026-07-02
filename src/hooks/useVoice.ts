import { useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export function useVoice(channelId?: string) {
  const store = useServerStore();
  const { socket } = useSocket();
  const voiceState = store.voice;
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!socket || !voiceState.channelId) return;

    const handleUserJoined = (data: any) => {
      store.setVoiceConnectedUsers([...voiceState.connectedUsers, data.userId]);
    };

    const handleUserLeft = (data: any) => {
      store.setVoiceConnectedUsers(
        voiceState.connectedUsers.filter((id) => id !== data.userId),
      );
    };

    const handleStateChanged = (_data: any) => {
      // Handles remote state updates
    };

    const handleSoundboard = (data: any) => {
      console.log(`Playing soundboard clip: ${data.soundUrl}`);
    };

    socket.on("voice-user-joined", handleUserJoined);
    socket.on("voice-user-left", handleUserLeft);
    socket.on("voice-user-state-changed", handleStateChanged);
    socket.on("soundboard-played", handleSoundboard);

    return () => {
      socket.off("voice-user-joined", handleUserJoined);
      socket.off("voice-user-left", handleUserLeft);
      socket.off("voice-user-state-changed", handleStateChanged);
      socket.off("soundboard-played", handleSoundboard);
    };
  }, [socket, voiceState.channelId, voiceState.connectedUsers, store]);

  const join = useCallback(() => {
    if (!channelId || !socket || !currentUser || !store.activeServerId) return;
    store.joinVoice(store.activeServerId, channelId, currentUser.id);
    socket.emit("join-voice", {
      serverId: store.activeServerId,
      channelId,
      userId: currentUser.id,
    });
  }, [channelId, socket, currentUser, store]);

  const leave = useCallback(() => {
    if (!socket || !voiceState.channelId || !currentUser) return;
    socket.emit("leave-voice", {
      channelId: voiceState.channelId,
      userId: currentUser.id,
    });
    store.leaveVoice(currentUser.id);
  }, [socket, voiceState.channelId, currentUser, store]);

  const toggleMute = useCallback(() => {
    const nextMute = !voiceState.isMuted;
    store.setMute(nextMute);
    socket?.emit("voice-state-update", {
      channelId: voiceState.channelId,
      userId: currentUser?.id,
      isMuted: nextMute,
      isDeafened: voiceState.isDeafened,
      isScreenSharing: voiceState.isScreenSharing,
    });
  }, [socket, voiceState, currentUser, store]);

  const playSound = useCallback(
    (soundUrl: string) => {
      if (!voiceState.channelId || !socket) return;
      socket.emit("play-soundboard", {
        channelId: voiceState.channelId,
        soundUrl,
      });
    },
    [voiceState.channelId, socket],
  );

  return {
    isConnected: !!voiceState.channelId,
    isMuted: voiceState.isMuted,
    isDeafened: voiceState.isDeafened,
    isScreenSharing: voiceState.isScreenSharing,
    join,
    leave,
    toggleMute,
    playSound,
  };
}
