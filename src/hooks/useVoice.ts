import { useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export function useVoice(channelId?: string) {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const voiceState = useServerStore((s) => s.voice);
  const setVoiceConnectedUsers = useServerStore((s) => s.setVoiceConnectedUsers);
  const joinVoice = useServerStore((s) => s.joinVoice);
  const leaveVoiceStore = useServerStore((s) => s.leaveVoice);
  const setMute = useServerStore((s) => s.setMute);
  
  const { socket } = useSocket();
  const currentUser = useAuthStore((s) => s.activeProfile);

  useEffect(() => {
    if (!socket || !voiceState.channelId) return;

    const handleUserJoined = (data: any) => {
      setVoiceConnectedUsers([...voiceState.connectedUsers, data.userId]);
    };

    const handleUserLeft = (data: any) => {
      setVoiceConnectedUsers(
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
  }, [socket, voiceState.channelId, voiceState.connectedUsers, setVoiceConnectedUsers]);

  const join = useCallback(() => {
    if (!channelId || !socket || !currentUser || !activeServerId) return;
    joinVoice(activeServerId, channelId, currentUser.id);
    socket.emit("join-voice", {
      serverId: activeServerId,
      channelId,
      userId: currentUser.id,
    });
  }, [channelId, socket, currentUser, activeServerId, joinVoice]);

  const leave = useCallback(() => {
    if (!socket || !voiceState.channelId || !currentUser) return;
    socket.emit("leave-voice", {
      channelId: voiceState.channelId,
      userId: currentUser.id,
    });
    leaveVoiceStore(currentUser.id);
  }, [socket, voiceState.channelId, currentUser, leaveVoiceStore]);

  const toggleMute = useCallback(() => {
    const nextMute = !voiceState.isMuted;
    setMute(nextMute);
    socket?.emit("voice-state-update", {
      channelId: voiceState.channelId,
      userId: currentUser?.id,
      isMuted: nextMute,
      isDeafened: voiceState.isDeafened,
      isScreenSharing: voiceState.isScreenSharing,
    });
  }, [socket, voiceState, currentUser, setMute]);

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
