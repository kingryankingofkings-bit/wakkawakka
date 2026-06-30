"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { Mic, MicOff, Hand, LogOut, Users, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCount, cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";

function SpeakerAvatar({
  user,
  isSpeaking,
}: {
  user: any;
  isSpeaking: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative rounded-full transition-all",
          isSpeaking && !user.isMuted &&
            "ring-4 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        {isSpeaking && !user.isMuted && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
        <Avatar src={user.avatar} name={user.displayName} size="lg" />
        {user.isMuted ? (
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
            <MicOff className="h-2.5 w-2.5 text-white" />
          </span>
        ) : (
          isSpeaking && (
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
              <Mic className="h-2.5 w-2.5 text-white" />
            </span>
          )
        )}
      </div>
      <span className="text-xs font-medium text-center max-w-[60px] truncate">
        {user.displayName ? user.displayName.split(" ")[0] : "Speaker"}
      </span>
    </div>
  );
}

export default function AudioRoomsPage() {
  return (
    <Suspense>
      <AudioRoomsInner />
    </Suspense>
  );
}

function AudioRoomsInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"SPEAKER" | "LISTENER" | null>(null);
  const [speakingUserId, setSpeakingUserId] = useState<string>("");

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/audio-rooms");
      if (res.ok) {
        const json = await res.json();
        const roomsList = json.rooms || [];
        setRooms(roomsList);

        // Auto join if room query param is present
        if (roomId && !activeRoom) {
          const roomToJoin = roomsList.find((r: any) => r.id === roomId);
          if (roomToJoin) {
            joinRoom(roomToJoin);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load audio rooms", e);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [roomId]);

  // Join Room
  const joinRoom = async (room: any) => {
    if (!currentUser) return;
    try {
      const isHost = room.hostId === currentUser.id;
      const endpoint = isHost
        ? `/api/audio-rooms/${room.id}/speakers`
        : `/api/audio-rooms/${room.id}/listeners`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
      });

      if (res.ok) {
        const role = isHost ? "SPEAKER" : "LISTENER";
        setCurrentUserRole(role);
        setIsMuted(isHost ? false : true);
        setHandRaised(false);
        setActiveRoom(room);

        // Emit Socket Join
        if (socket) {
          socket.emit("join-audio-room", room.id);
          socket.emit("audio-join", {
            roomId: room.id,
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName,
              avatar: currentUser.avatar,
              isMuted: isHost ? false : true,
              handRaised: false,
            },
            isSpeaker: isHost,
          });
        }
      }
    } catch (e) {
      console.error("Failed to join room", e);
    }
  };

  // Leave Room
  const leaveRoom = async () => {
    if (!activeRoom || !currentUser) return;
    try {
      const endpoint =
        currentUserRole === "SPEAKER"
          ? `/api/audio-rooms/${activeRoom.id}/speakers?userId=${currentUser.id}`
          : `/api/audio-rooms/${activeRoom.id}/listeners?userId=${currentUser.id}`;

      await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (socket) {
        socket.emit("audio-leave", { roomId: activeRoom.id, userId: currentUser.id });
        socket.emit("leave-audio-room", activeRoom.id);
      }

      setActiveRoom(null);
      setCurrentUserRole(null);
      fetchRooms();
    } catch (e) {
      console.error("Failed to leave room", e);
    }
  };

  // Toggle Mute
  const toggleMute = async () => {
    if (!activeRoom || !currentUser) return;
    const newMuted = !isMuted;
    try {
      const res = await fetch(`/api/audio-rooms/${activeRoom.id}/speakers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ isMuted: newMuted, userId: currentUser.id }),
      });

      if (res.ok) {
        setIsMuted(newMuted);
        if (socket) {
          socket.emit("audio-state-update", {
            roomId: activeRoom.id,
            userId: currentUser.id,
            isMuted: newMuted,
            handRaised,
            isSpeaker: currentUserRole === "SPEAKER",
          });
        }
      }
    } catch (e) {
      console.error("Failed to toggle mute", e);
    }
  };

  // Toggle Hand Raise
  const toggleHand = async () => {
    if (!activeRoom || !currentUser) return;
    const newHand = !handRaised;
    try {
      const res = await fetch(`/api/audio-rooms/${activeRoom.id}/hand`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ handRaised: newHand }),
      });

      if (res.ok) {
        setHandRaised(newHand);
        if (socket) {
          socket.emit("audio-state-update", {
            roomId: activeRoom.id,
            userId: currentUser.id,
            isMuted,
            handRaised: newHand,
            isSpeaker: currentUserRole === "SPEAKER",
          });
        }
      }
    } catch (e) {
      console.error("Failed to toggle hand", e);
    }
  };

  // Promote Listener to Speaker
  const promoteListener = async (targetUserId: string) => {
    if (!activeRoom || !currentUser) return;
    try {
      const res = await fetch(`/api/audio-rooms/${activeRoom.id}/speakers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ userId: targetUserId }),
      });

      if (res.ok) {
        if (socket) {
          socket.emit("audio-state-update", {
            roomId: activeRoom.id,
            userId: targetUserId,
            isSpeaker: true,
            isMuted: true,
            handRaised: false,
          });
        }
      }
    } catch (e) {
      console.error("Failed to promote listener", e);
    }
  };

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/audio-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });

      if (res.ok) {
        const json = await res.json();
        const createdRoom = json.room;

        setActiveRoom(createdRoom);
        setCurrentUserRole("SPEAKER");
        setIsMuted(false);
        setHandRaised(false);
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDesc("");

        if (socket) {
          socket.emit("join-audio-room", createdRoom.id);
          socket.emit("audio-join", {
            roomId: createdRoom.id,
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName,
              avatar: currentUser.avatar,
              isMuted: false,
              handRaised: false,
            },
            isSpeaker: true,
          });
        }

        fetchRooms();
      }
    } catch (e) {
      console.error("Failed to create room", e);
    }
  };

  // Cycle through speakers "speaking"
  useEffect(() => {
    if (!activeRoom) return;
    const interval = setInterval(() => {
      const speakers = activeRoom.speakers || [];
      const unmutedSpeakers = speakers.filter((s: any) => !s.isMuted);
      if (unmutedSpeakers.length === 0) {
        setSpeakingUserId("");
        return;
      }
      setSpeakingUserId(
        unmutedSpeakers[Math.floor(Math.random() * unmutedSpeakers.length)].id,
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  // Real-time socket events connection
  useEffect(() => {
    if (!socket || !activeRoom) return;

    const handleUserJoined = (data: { userId: string; user: any; isSpeaker: boolean }) => {
      setActiveRoom((prev: any) => {
        if (!prev) return null;
        const updatedSpeakers = data.isSpeaker
          ? [...prev.speakers.filter((s: any) => s.id !== data.userId), data.user]
          : prev.speakers.filter((s: any) => s.id !== data.userId);
        const updatedListeners = !data.isSpeaker
          ? [...prev.listeners.filter((l: any) => l.id !== data.userId), data.user]
          : prev.listeners.filter((l: any) => l.id !== data.userId);

        return {
          ...prev,
          speakers: updatedSpeakers,
          listeners: updatedListeners,
          listenerCount: updatedListeners.length,
        };
      });
    };

    const handleUserLeft = (data: { userId: string }) => {
      setActiveRoom((prev: any) => {
        if (!prev) return null;
        const updatedSpeakers = prev.speakers.filter((s: any) => s.id !== data.userId);
        const updatedListeners = prev.listeners.filter((l: any) => l.id !== data.userId);
        return {
          ...prev,
          speakers: updatedSpeakers,
          listeners: updatedListeners,
          listenerCount: updatedListeners.length,
        };
      });
    };

    const handleStateChanged = (data: {
      userId: string;
      isMuted?: boolean;
      handRaised?: boolean;
      isSpeaker?: boolean;
    }) => {
      if (currentUser && data.userId === currentUser.id) {
        if (data.isSpeaker !== undefined) {
          setCurrentUserRole(data.isSpeaker ? "SPEAKER" : "LISTENER");
        }
        if (data.isMuted !== undefined) {
          setIsMuted(data.isMuted);
        }
        if (data.handRaised !== undefined) {
          setHandRaised(data.handRaised);
        }
      }

      setActiveRoom((prev: any) => {
        if (!prev) return null;

        let updatedSpeakers = [...(prev.speakers || [])];
        let updatedListeners = [...(prev.listeners || [])];

        let user = updatedSpeakers.find((s: any) => s.id === data.userId) ||
                   updatedListeners.find((l: any) => l.id === data.userId);

        if (!user && currentUser && data.userId === currentUser.id) {
          user = {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
            isMuted: data.isMuted ?? false,
            handRaised: data.handRaised ?? false,
          };
        }

        if (user) {
          const updatedUser = { ...user };
          if (data.isMuted !== undefined) updatedUser.isMuted = data.isMuted;
          if (data.handRaised !== undefined) updatedUser.handRaised = data.handRaised;

          if (data.isSpeaker !== undefined) {
            updatedSpeakers = updatedSpeakers.filter((s: any) => s.id !== data.userId);
            updatedListeners = updatedListeners.filter((l: any) => l.id !== data.userId);
            if (data.isSpeaker) {
              updatedSpeakers.push(updatedUser);
            } else {
              updatedListeners.push(updatedUser);
            }
          } else {
            updatedSpeakers = updatedSpeakers.map((s: any) => s.id === data.userId ? updatedUser : s);
            updatedListeners = updatedListeners.map((l: any) => l.id === data.userId ? updatedUser : l);
          }
        }

        return {
          ...prev,
          speakers: updatedSpeakers,
          listeners: updatedListeners,
          listenerCount: updatedListeners.length,
        };
      });
    };

    socket.on("audio-user-joined", handleUserJoined);
    socket.on("audio-user-left", handleUserLeft);
    socket.on("audio-state-changed", handleStateChanged);

    return () => {
      socket.off("audio-user-joined", handleUserJoined);
      socket.off("audio-user-left", handleUserLeft);
      socket.off("audio-state-changed", handleStateChanged);
    };
  }, [socket, activeRoom, currentUser]);

  if (activeRoom) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Room header */}
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold">{activeRoom.title}</h1>
              {activeRoom.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeRoom.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  Live · {formatCount(activeRoom.listenerCount)} listening
                </span>
              </div>
            </div>
            <button
              onClick={leaveRoom}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
              title="Leave room"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Speakers */}
        <div className="flex-1 overflow-y-auto p-5">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Speakers ({(activeRoom.speakers || []).length})
            </h2>
            <div className="flex flex-wrap gap-6">
              {(activeRoom.speakers || []).map((speaker: any) => (
                <SpeakerAvatar
                  key={speaker.id}
                  user={speaker}
                  isSpeaking={speakingUserId === speaker.id}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Listeners ({(activeRoom.listeners || []).length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {(activeRoom.listeners || []).map((listener: any) => (
                <div
                  key={listener.id}
                  className={cn(
                    "flex flex-col items-center gap-1 relative p-1 rounded-xl hover:bg-muted cursor-pointer transition-colors"
                  )}
                  onClick={() => {
                    if (activeRoom.hostId === currentUser?.id) {
                      promoteListener(listener.id);
                    }
                  }}
                  title={activeRoom.hostId === currentUser?.id ? "Click to promote to speaker" : undefined}
                >
                  <div className="relative">
                    <Avatar
                      src={listener.avatar}
                      name={listener.displayName}
                      size="sm"
                    />
                    {listener.handRaised && (
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 border border-background flex items-center justify-center">
                        <Hand className="h-2 w-2 text-white" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[48px]">
                    {listener.displayName ? listener.displayName.split(" ")[0] : "Listener"}
                  </span>
                </div>
              ))}
              {/* Ghost listeners */}
              {Array.from({
                length: Math.max(
                  0,
                  activeRoom.listenerCount - (activeRoom.listeners || []).length
                ),
              }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-border px-4 py-5 flex items-center justify-around">
          <button
            onClick={toggleMute}
            disabled={currentUserRole === "LISTENER"}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-colors",
              isMuted ? "text-muted-foreground" : "text-primary",
              currentUserRole === "LISTENER" && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center",
                isMuted ? "bg-muted" : "bg-primary",
              )}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-xs font-medium">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          <button
            onClick={toggleHand}
            disabled={currentUserRole === "SPEAKER"}
            className={cn(
              "flex flex-col items-center gap-1.5",
              handRaised ? "text-yellow-500" : "text-muted-foreground",
              currentUserRole === "SPEAKER" && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center",
                handRaised ? "bg-yellow-500/20" : "bg-muted",
              )}
            >
              <Hand className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">
              {handRaised ? "Lower Hand" : "Raise Hand"}
            </span>
          </button>

          <button
            onClick={leaveRoom}
            className="flex flex-col items-center gap-1.5 text-destructive"
          >
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Leave</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Audio Rooms</h1>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {rooms.filter((r) => r.isActive).length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Mic className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-semibold">No active rooms</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a room to start talking
            </p>
          </div>
        ) : (
          rooms.filter((r) => r.isActive).map((room) => (
            <Card
              key={room.id}
              padding="md"
              hover
              onClick={() => joinRoom(room)}
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{room.title}</p>
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Live
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex -space-x-2">
                      {(room.speakers || []).slice(0, 4).map((s: any) => (
                        <Avatar
                          key={s.id}
                          src={s.avatar}
                          name={s.displayName}
                          size="xs"
                          className="ring-1 ring-background"
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(room.speakers || []).length} speaking ·{" "}
                      {formatCount(room.listenerCount)} listening
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Start an Audio Room"
      >
        <form
          className="p-5 flex flex-col gap-4"
          onSubmit={handleCreateRoom}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Room Topic</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you want to talk about?"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Add some details..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none h-20"
            />
          </div>
          <Button type="submit" className="w-full mt-2">
            Start Broadcasting
          </Button>
        </form>
      </Modal>
    </div>
  );
}
