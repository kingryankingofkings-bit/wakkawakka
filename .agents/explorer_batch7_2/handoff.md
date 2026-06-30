# Handoff Report: State & Real-Time Exploration (Batch 7: Server/Channel Architecture)

## 1. Observation

During read-only exploration of the `wakkawakka` repository, the following structures, files, and patterns were identified:

- **Zustand Store Patterns (`src/store/`)**:
  - `authStore.ts` (lines 23-77) utilizes `zustand/middleware` `persist` with `localStorage` to save user credentials and token across page reloads.
  - `messageStore.ts` (lines 175-225) manages a list of `conversations`, an `activeConversationId`, and a record of `messages` mapped by `conversationId`.
  - `notificationStore.ts` (lines 28-64) calculates unread message counts dynamically (`unreadCount` and `dmUnreadCount`) whenever a notification is added.
- **Socket.IO Server Event Pipeline (`server.ts`)**:
  - `server.ts` handles the Socket.IO setup (lines 33-40) and manages user connection lifecycles via rooms (e.g., joining room `user:${userId}` on line 46, emitting `user-online` on line 48).
  - Existing direct message chat events are registered on the server: `join-conversation` (line 51), `leave-conversation` (line 55), `send-message` (line 59), `typing` (line 72), and `stop-typing` (line 76).
  - Live streaming features use events like `join-live`, `live-comment`, `live-gift`, etc. (lines 93-115).
  - Simple audio-room channels use `join-audio-room` and `audio-speak` events (lines 117-123).
- **Client Socket Connection Hook (`src/hooks/useSocket.ts`)**:
  - Exposes `socket`, `isConnected`, and a set of `onlineUsers` (lines 10-14).
  - Subscribes to server-emitted events on connection, e.g. `new-message`, `notification`, `user-online`, and `user-offline`, merging payload data directly into Zustand stores via callbacks (`handleNewMessage`, `handleNotification`).
- **Message Synchronization Protocol (`src/components/messaging/ChatWindow.tsx`)**:
  - Lines 335-381 demonstrate a **REST-then-Socket Broadcast pattern**:
    1. A client triggers a HTTP `POST` to `/api/messages/conversations/${conversationId}/messages`.
    2. Upon success, the client updates the local Zustand store state immediately via `addMessage(newMsg)` and appends it to its own local array.
    3. The client then emits `send-message` to the socket so other connected clients in the conversation room receive the message and update their own state.

---

## 2. Logic Chain

Based on these observations, the architectural proposals for **Batch 7: Server/Channel Architecture** are derived as follows:

1.  **Zustand Store Expansion (`serverStore.ts`)**:
    - To mirror existing stores (like `messageStore.ts`), we will design a dedicated Zustand state store: `serverStore.ts`.
    - It will manage active server/channel selections, list of servers, channel lists, member lists, server roles, and soundboard/emoji directories.
    - It must use local state lists keyed by `serverId` and `channelId` to allow fast random-access retrieval without redundant API fetching.
2.  **Voice and Stage Channel State**:
    - Voice and Stage features have transient state (e.g., who is currently speaking, who is deafened, who is queued to speak in a Stage presentation).
    - We will store this transient state directly inside `serverStore.ts` and sync it via Socket.IO events, bypassing database calls for high-frequency actions (like "user starts speaking"), while using REST APIs for persistent actions (like "assign speaker role").
3.  **Socket.IO Server Updates**:
    - To isolate server and channel communications, clients must join room spaces scoped by server and channel. We will define rooms like `server:${serverId}` and `channel:${channelId}` (modeled after the existing `conversation:${conversationId}` room pattern at line 52 of `server.ts`).
    - Specific events must be registered to broadcast server message updates, channel configurations, typing states, and soundboard plays.
4.  **Custom Hooks for Clean State Consumption**:
    - To keep React page components clean and separation of concerns high:
      - `useServer`: Wraps server configurations, listings, and membership.
      - `useChannel`: Encapsulates message streaming, typing, and thread trees.
      - `useServerPermissions`: Implements a client-side permission evaluation engine that checks role objects to gate UI actions.
      - `useVoice`: Abstracts audio connection status, media device controls (mute/deafen), and screenshare feeds.
      - `useStage`: Handles speaker/listener queues, request-to-speak flows, and speaker demotions/promotions.

---

## 3. Proposed Store Interfaces (`serverStore.ts`)

Create `src/store/serverStore.ts` using the following schema definitions:

### A. Data Models and Types

```typescript
import type { User } from "@/types";

export type ChannelType = "TEXT" | "VOICE" | "FORUM" | "STAGE";

export interface Server {
  id: string;
  name: string;
  iconUrl?: string;
  bannerUrl?: string;
  description?: string;
  inviteCode: string;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  user: User;
  nickname?: string;
  roles: ServerRole[];
  joinedAt: string;
}

export interface ServerRole {
  id: string;
  serverId: string;
  name: string;
  color: string; // Hex color code
  hoist: boolean; // Display members separately in sidebar
  mentionable: boolean;
  permissions: string[]; // List of permission name strings (e.g., 'ADMINISTRATOR', 'SEND_MESSAGES')
  position: number;
}

export interface ServerChannel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  categoryId?: string; // Parent category for layout categorization
  position: number;
  parentId?: string; // Null for top-level channels; set to channel ID if it's a thread
  createdAt: string;
}

export interface ServerMessage {
  id: string;
  channelId: string;
  senderId: string;
  sender: User;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "file";
  replyToId?: string;
  replyTo?: ServerMessage;
  reactions?: Record<string, number>;
  createdAt: string;
}

export interface ServerBoost {
  id: string;
  serverId: string;
  userId: string;
  createdAt: string;
}

export interface SoundboardSound {
  id: string;
  serverId: string;
  name: string;
  soundUrl: string;
  emoji?: string;
  volume: number; // Float value between 0.0 and 1.0
  createdAt: string;
}

export interface CustomEmoji {
  id: string;
  serverId: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

export interface VoiceState {
  serverId: string | null;
  channelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  activeSpeakers: string[]; // List of User IDs
  connectedUsers: string[]; // List of User IDs in the voice room
}

export interface StageState {
  serverId: string | null;
  channelId: string | null;
  speakers: string[]; // User IDs of active speakers
  listeners: string[]; // User IDs of listeners
  requestedToSpeak: string[]; // User IDs in the speaker request queue
}
```

### B. Zustand Store State and Actions

```typescript
export interface ServerStoreState {
  servers: Server[];
  activeServerId: string | null;
  activeChannelId: string | null;
  publicServers: Server[];

  // Scoped Data Caches
  messages: Record<string, ServerMessage[]>; // Keyed by channelId
  members: Record<string, ServerMember[]>; // Keyed by serverId
  roles: Record<string, ServerRole[]>; // Keyed by serverId
  channels: Record<string, ServerChannel[]>; // Keyed by serverId
  soundboardSounds: Record<string, SoundboardSound[]>; // Keyed by serverId
  customEmojis: Record<string, CustomEmoji[]>; // Keyed by serverId

  // Transient Connection States
  voice: VoiceState;
  stage: StageState;

  isLoading: boolean;
}

export interface ServerStoreActions {
  setServers: (servers: Server[]) => void;
  setActiveServerId: (id: string | null) => void;
  setActiveChannelId: (id: string | null) => void;
  setPublicServers: (servers: Server[]) => void;
  setLoading: (isLoading: boolean) => void;

  // Server Management
  addServer: (server: Server) => void;
  updateServer: (serverId: string, updates: Partial<Server>) => void;
  removeServer: (serverId: string) => void;

  // Channel Management
  setChannels: (serverId: string, channels: ServerChannel[]) => void;
  addChannel: (serverId: string, channel: ServerChannel) => void;
  updateChannel: (
    serverId: string,
    channelId: string,
    updates: Partial<ServerChannel>,
  ) => void;
  removeChannel: (serverId: string, channelId: string) => void;

  // Member Management
  setMembers: (serverId: string, members: ServerMember[]) => void;
  addMember: (serverId: string, member: ServerMember) => void;
  updateMember: (
    serverId: string,
    userId: string,
    updates: Partial<ServerMember>,
  ) => void;
  removeMember: (serverId: string, userId: string) => void;

  // Role Management
  setRoles: (serverId: string, roles: ServerRole[]) => void;
  addRole: (serverId: string, role: ServerRole) => void;
  updateRole: (
    serverId: string,
    roleId: string,
    updates: Partial<ServerRole>,
  ) => void;
  removeRole: (serverId: string, roleId: string) => void;

  // Message Management
  setMessages: (channelId: string, messages: ServerMessage[]) => void;
  addMessage: (channelId: string, message: ServerMessage) => void;
  updateMessage: (
    channelId: string,
    messageId: string,
    updates: Partial<ServerMessage>,
  ) => void;
  removeMessage: (channelId: string, messageId: string) => void;

  // Transient Voice Actions
  joinVoice: (serverId: string, channelId: string) => void;
  leaveVoice: () => void;
  setMute: (isMuted: boolean) => void;
  setDeafen: (isDeafened: boolean) => void;
  setScreenShare: (isScreenSharing: boolean) => void;
  setSpeakers: (speakers: string[]) => void;
  setVoiceConnectedUsers: (userIds: string[]) => void;

  // Transient Stage Actions
  joinStage: (serverId: string, channelId: string, isSpeaker: boolean) => void;
  leaveStage: () => void;
  setStageQueue: (queue: {
    speakers: string[];
    listeners: string[];
    requestedToSpeak: string[];
  }) => void;
  updateStageUserRole: (
    userId: string,
    role: "SPEAKER" | "LISTENER" | "REQUESTED",
  ) => void;
}
```

---

## 4. Proposed Socket.IO Event Handler Updates (`server.ts`)

Integrate these new event listeners and emitters into the connection pipeline of `server.ts`:

### A. Socket Event Registry List

1.  `join-server`: Joins the socket to `server:${serverId}` to listen to structural updates (roles, channels, memberships).
2.  `leave-server`: Leaves the server room.
3.  `join-server-channel`: Joins the socket to `server-channel:${channelId}` to listen to text chat, typing, and thread events.
4.  `leave-server-channel`: Leaves the channel room.
5.  `send-server-message`: Broadcasts `new-server-message` to all clients in `server-channel:${channelId}`.
6.  `delete-server-message`: Broadcasts `server-message-deleted` to `server-channel:${channelId}`.
7.  `server-typing`/`server-stop-typing`: Broadcasts typing status in a channel.
8.  `join-voice`: Connects to a voice channel room `voice:${channelId}`, broadcasting `voice-user-joined` (updates member audio feeds).
9.  `leave-voice`: Leaves the voice channel room, broadcasting `voice-user-left`.
10. `voice-state-update`: Handles status changes for mute, deafen, and screen sharing. Broadcasts `voice-user-state-changed`.
11. `play-soundboard`: Broadcasts `soundboard-played` (sound clip playback trigger) to other users in `voice:${channelId}`.
12. `join-stage`: Joins the stage room `stage:${channelId}`, registers as speaker or listener, and notifies others via `stage-roster-updated`.
13. `stage-request-speak`/`stage-cancel-request`: Submits/removes the listener's hand-raise in the speaker request queue.
14. `stage-moderate-speaker`: Allows moderators to promote a user to speaker or demote them to listener. Broadcasts `stage-user-role-changed`.

### B. Proposed Implementation Blocks for `server.ts`

```javascript
// Inside io.on('connection', (socket: Socket) => { ... })

// 1. Server Space Management
socket.on("join-server", (serverId) => {
  socket.join(`server:${serverId}`);
});
socket.on("leave-server", (serverId) => {
  socket.leave(`server:${serverId}`);
});

// 2. Channel Message & Chat Management
socket.on("join-server-channel", (channelId) => {
  socket.join(`server-channel:${channelId}`);
});
socket.on("leave-server-channel", (channelId) => {
  socket.leave(`server-channel:${channelId}`);
});
socket.on("send-server-message", (data) => {
  // data: { channelId: string, message: ServerMessage }
  socket
    .to(`server-channel:${data.channelId}`)
    .emit("new-server-message", data.message);
});
socket.on("delete-server-message", (data) => {
  // data: { channelId: string, messageId: string }
  socket
    .to(`server-channel:${data.channelId}`)
    .emit("server-message-deleted", data.messageId);
});
socket.on("server-typing", (data) => {
  // data: { channelId: string, userId: string, displayName: string }
  socket.to(`server-channel:${data.channelId}`).emit("server-typing", data);
});
socket.on("server-stop-typing", (data) => {
  // data: { channelId: string, userId: string }
  socket
    .to(`server-channel:${data.channelId}`)
    .emit("server-stop-typing", data);
});

// 3. Voice Channel Coordination
socket.on("join-voice", (data) => {
  // data: { serverId: string, channelId: string, userId: string }
  socket.join(`voice:${data.channelId}`);
  socket
    .to(`voice:${data.channelId}`)
    .emit("voice-user-joined", { userId: data.userId });
});
socket.on("leave-voice", (data) => {
  // data: { channelId: string, userId: string }
  socket.leave(`voice:${data.channelId}`);
  socket
    .to(`voice:${data.channelId}`)
    .emit("voice-user-left", { userId: data.userId });
});
socket.on("voice-state-update", (data) => {
  // data: { channelId: string, userId: string, isMuted: boolean, isDeafened: boolean, isScreenSharing: boolean }
  socket.to(`voice:${data.channelId}`).emit("voice-user-state-changed", data);
});
socket.on("play-soundboard", (data) => {
  // data: { channelId: string, soundUrl: string, name: string }
  socket.to(`voice:${data.channelId}`).emit("soundboard-played", data);
});

// 4. Stage Channel Interaction
socket.on("join-stage", (data) => {
  // data: { serverId: string, channelId: string, userId: string, isSpeaker: boolean }
  socket.join(`stage:${data.channelId}`);
  socket.to(`stage:${data.channelId}`).emit("stage-user-joined", data);
});
socket.on("stage-request-speak", (data) => {
  // data: { channelId: string, userId: string }
  socket
    .to(`stage:${data.channelId}`)
    .emit("stage-user-requested", data.userId);
});
socket.on("stage-moderate-speaker", (data) => {
  // data: { channelId: string, targetUserId: string, action: 'PROMOTE' | 'DEMOTE' | 'REMOVE' }
  socket.to(`stage:${data.channelId}`).emit("stage-speaker-action", data);
});
```

---

## 5. Custom React Hook Designs

Create these hooks to handle frontend operations:

### Hook A: `useServer(serverId?: string)`

_Purpose_: Manages data, metadata, channel index, and roles for the active or specified server.

```typescript
import { useEffect, useState } from "react";
import { useServerStore } from "@/store/serverStore";

export function useServer(serverId?: string) {
  const store = useServerStore();
  const targetServerId = serverId || store.activeServerId;
  const [loading, setLoading] = useState(false);

  const server = store.servers.find((s) => s.id === targetServerId) || null;
  const channels = store.channels[targetServerId || ""] || [];
  const members = store.members[targetServerId || ""] || [];
  const roles = store.roles[targetServerId || ""] || [];

  const createChannel = async (
    name: string,
    type: "TEXT" | "VOICE" | "FORUM" | "STAGE",
    categoryId?: string,
  ) => {
    if (!targetServerId) return;
    const res = await fetch(`/api/servers/${targetServerId}/channels`, {
      method: "POST",
      body: JSON.stringify({ name, type, categoryId }),
    });
    if (res.ok) {
      const data = await res.json();
      store.addChannel(targetServerId, data.channel);
      return data.channel;
    }
  };

  const leaveServer = async () => {
    if (!targetServerId) return;
    const res = await fetch(`/api/servers/${targetServerId}/members`, {
      method: "DELETE",
    });
    if (res.ok) store.removeServer(targetServerId);
  };

  return {
    server,
    channels,
    members,
    roles,
    createChannel,
    leaveServer,
    activeChannelId: store.activeChannelId,
    setActiveChannelId: store.setActiveChannelId,
  };
}
```

### Hook B: `useChannel(channelId: string)`

_Purpose_: Manages text and forum channel messages, thread trees, and typing indicators.

```typescript
import { useState, useEffect, useCallback } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";

export function useChannel(channelId: string) {
  const store = useServerStore();
  const { socket } = useSocket();
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
    if (channelId) fetchMsgs();
  }, [channelId]);

  // Subscribe to channel sockets
  useEffect(() => {
    if (!socket || !channelId) return;
    socket.emit("join-server-channel", channelId);

    const handleNewMessage = (msg: any) => store.addMessage(channelId, msg);
    const handleMessageDeleted = (msgId: string) =>
      store.removeMessage(channelId, msgId);

    const handleTyping = (data: any) => {
      if (data.userId !== socket.id) {
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
  }, [socket, channelId]);

  const sendMessage = async (content: string, mediaUrl?: string) => {
    const res = await fetch(
      `/api/servers/${store.activeServerId}/channels/${channelId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content, mediaUrl }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      store.addMessage(channelId, data.message);
      if (socket)
        socket.emit("send-server-message", {
          channelId,
          message: data.message,
        });
    }
  };

  return {
    messages,
    typingUsers: Object.values(typingUsers),
    sendMessage,
  };
}
```

### Hook C: `useServerPermissions(serverId: string)`

_Purpose_: Implements permission mapping for gating components based on role settings.

```typescript
import { useServerStore } from "@/store/serverStore";
import { useAuthStore } from "@/store/authStore";

export function useServerPermissions(serverId: string) {
  const store = useServerStore();
  const currentUser = useAuthStore((s) => s.user);

  const server = store.servers.find((s) => s.id === serverId);
  const members = store.members[serverId] || [];
  const member = members.find((m) => m.userId === currentUser?.id);

  const isOwner = server?.ownerId === currentUser?.id;

  const hasPermission = (permission: string): boolean => {
    if (isOwner) return true;
    if (!member) return false;

    // Check if any assigned role contains permission
    return member.roles.some((role) => {
      return (
        role.permissions.includes("ADMINISTRATOR") ||
        role.permissions.includes(permission)
      );
    });
  };

  return {
    hasPermission,
    isOwner,
    member,
  };
}
```

### Hook D: `useVoice(channelId?: string)`

_Purpose_: Handles WebRTC signaling triggers, device configurations, mute/deafen, and soundboard clips.

```typescript
import { useEffect } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";

export function useVoice(channelId?: string) {
  const store = useServerStore();
  const { socket } = useSocket();
  const voiceState = store.voice;

  const join = () => {
    if (!channelId || !socket) return;
    store.joinVoice(store.activeServerId!, channelId);
    socket.emit("join-voice", { serverId: store.activeServerId, channelId });
  };

  const leave = () => {
    if (!socket || !voiceState.channelId) return;
    socket.emit("leave-voice", { channelId: voiceState.channelId });
    store.leaveVoice();
  };

  const toggleMute = () => {
    const nextMute = !voiceState.isMuted;
    store.setMute(nextMute);
    socket?.emit("voice-state-update", {
      channelId: voiceState.channelId,
      isMuted: nextMute,
      isDeafened: voiceState.isDeafened,
      isScreenSharing: voiceState.isScreenSharing,
    });
  };

  const playSound = (soundUrl: string) => {
    if (!voiceState.channelId || !socket) return;
    socket.emit("play-soundboard", {
      channelId: voiceState.channelId,
      soundUrl,
    });
  };

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
```

### Hook E: `useStage(channelId: string)`

_Purpose_: Manages Stage-specific presentation layouts, request queues, and speaker authorization.

```typescript
import { useEffect } from "react";
import { useServerStore } from "@/store/serverStore";
import { useSocket } from "@/hooks/useSocket";

export function useStage(channelId: string) {
  const store = useServerStore();
  const { socket } = useSocket();
  const stage = store.stage;

  useEffect(() => {
    if (!socket || !channelId) return;

    const handleJoined = (data: any) => {
      // Re-fetch stage queue state
    };
    const handleAction = (data: any) => {
      // data: { targetUserId: string, action: 'PROMOTE' | 'DEMOTE' | 'REMOVE' }
      store.updateStageUserRole(
        data.targetUserId,
        data.action === "PROMOTE" ? "SPEAKER" : "LISTENER",
      );
    };

    socket.on("stage-user-joined", handleJoined);
    socket.on("stage-speaker-action", handleAction);

    return () => {
      socket.off("stage-user-joined", handleJoined);
      socket.off("stage-speaker-action", handleAction);
    };
  }, [socket, channelId]);

  const requestToSpeak = () => {
    socket?.emit("stage-request-speak", { channelId });
  };

  const moderateUser = (
    targetUserId: string,
    action: "PROMOTE" | "DEMOTE" | "REMOVE",
  ) => {
    socket?.emit("stage-moderate-speaker", { channelId, targetUserId, action });
  };

  return {
    speakers: stage.speakers,
    listeners: stage.listeners,
    requestedToSpeak: stage.requestedToSpeak,
    requestToSpeak,
    moderateUser,
  };
}
```

---

## 6. Caveats

- **Network Transport Mocking**: The `useVoice` and `useStage` custom hooks provide real-time connection state management and socket signaling, but do not contain full WebRTC peer-to-peer peer connection instantiation (`RTCPeerConnection`). The implementer will need to integrate these hooks with a WebRTC connection manager class or an external system (e.g. Daily.co or LiveKit client libraries) to transmit actual audio streams.
- **Database Constraints**: Role authorization checks assume that assigned roles and permissions reside in SQLite. The implementer must generate migration files using Prisma CLI (`npx prisma db push`) to synchronize model updates with SQLite before attempting to use permission states.
- **Read-Only Scope**: This file was produced under read-only constraints; no files inside `src/` or `server.ts` have been edited.

---

## 7. Verification Method

Once the implementer writes these stores, socket handlers, and custom hooks, they must verify the integration via the following steps:

1.  **Static Types and Compiler Checks**:
    Ensure the new files compile cleanly without TypeScript errors:
    ```bash
    npm run type-check
    ```
2.  **Linting**:
    Ensure code follows formatting requirements:
    ```bash
    npm run lint
    ```
3.  **End-to-End Suite Execution**:
    Run the integration runner script to confirm that standard social feed and DM features did not break:
    ```bash
    node tests/e2e_runner.js
    ```
4.  **Structural Validation**:
    Check that `src/store/serverStore.ts` contains the proposed `ServerStoreState` interface, and `server.ts` is updated with corresponding listeners.
