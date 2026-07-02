import { create } from "zustand";
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
  roles: { role: ServerRole }[];
  joinedAt: string;
}

export interface ServerRole {
  id: string;
  serverId: string;
  name: string;
  color: string;
  hoist: boolean;
  position: number;
  permissions: string[]; // parsed array
  createdAt: string;
  updatedAt: string;
}

export interface ServerChannel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  position: number;
  parentId?: string;
  createdAt: string;
}

export interface ServerMessage {
  id: string;
  channelId: string;
  senderId: string;
  sender: User;
  content: string;
  attachments?: string; // stringified JSON
  replyToId?: string;
  replyTo?: ServerMessage;
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
  volume: number;
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
  activeSpeakers: string[]; // List of user IDs
  connectedUsers: string[]; // List of user IDs
}

export interface StageState {
  serverId: string | null;
  channelId: string | null;
  speakers: string[]; // List of user IDs
  listeners: string[]; // List of user IDs
  requestedToSpeak: string[]; // List of user IDs
}

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
  setServers: (_servers: Server[]) => void;
  setActiveServerId: (_id: string | null) => void;
  setActiveChannelId: (_id: string | null) => void;
  setPublicServers: (_servers: Server[]) => void;
  setLoading: (_isLoading: boolean) => void;

  // Server Management
  addServer: (_server: Server) => void;
  updateServer: (_serverId: string, _updates: Partial<Server>) => void;
  removeServer: (_serverId: string) => void;

  // Channel Management
  setChannels: (_serverId: string, _channels: ServerChannel[]) => void;
  addChannel: (_serverId: string, _channel: ServerChannel) => void;
  updateChannel: (
    _serverId: string,
    _channelId: string,
    _updates: Partial<ServerChannel>,
  ) => void;
  removeChannel: (_serverId: string, _channelId: string) => void;

  // Member Management
  setMembers: (_serverId: string, _members: ServerMember[]) => void;
  addMember: (_serverId: string, _member: ServerMember) => void;
  updateMember: (
    _serverId: string,
    _userId: string,
    _updates: Partial<ServerMember>,
  ) => void;
  removeMember: (_serverId: string, _userId: string) => void;

  // Role Management
  setRoles: (_serverId: string, _roles: ServerRole[]) => void;
  addRole: (_serverId: string, _role: ServerRole) => void;
  updateRole: (
    _serverId: string,
    _roleId: string,
    _updates: Partial<ServerRole>,
  ) => void;
  removeRole: (_serverId: string, _roleId: string) => void;

  // Message Management
  setMessages: (_channelId: string, _messages: ServerMessage[]) => void;
  addMessage: (_channelId: string, _message: ServerMessage) => void;
  updateMessage: (
    _channelId: string,
    _messageId: string,
    _updates: Partial<ServerMessage>,
  ) => void;
  removeMessage: (_channelId: string, _messageId: string) => void;

  // Transient Voice Actions
  joinVoice: (_serverId: string, _channelId: string, _userId: string) => void;
  leaveVoice: (_userId: string) => void;
  setMute: (_isMuted: boolean) => void;
  setDeafen: (_isDeafened: boolean) => void;
  setScreenShare: (_isScreenSharing: boolean) => void;
  setSpeakers: (_speakers: string[]) => void;
  setVoiceConnectedUsers: (_userIds: string[]) => void;

  // Transient Stage Actions
  joinStage: (
    _serverId: string,
    _channelId: string,
    _isSpeaker: boolean,
    _userId: string,
  ) => void;
  leaveStage: (_userId: string) => void;
  setStageQueue: (_queue: {
    speakers: string[];
    listeners: string[];
    requestedToSpeak: string[];
  }) => void;
  updateStageUserRole: (
    _userId: string,
    _role: "SPEAKER" | "LISTENER" | "REQUESTED",
  ) => void;
}

type ServerStore = ServerStoreState & ServerStoreActions;

export const useServerStore = create<ServerStore>((set, _get) => ({
  // Initial state
  servers: [],
  activeServerId: null,
  activeChannelId: null,
  publicServers: [],
  messages: {},
  members: {},
  roles: {},
  channels: {},
  soundboardSounds: {},
  customEmojis: {},

  voice: {
    serverId: null,
    channelId: null,
    isMuted: false,
    isDeafened: false,
    isScreenSharing: false,
    activeSpeakers: [],
    connectedUsers: [],
  },

  stage: {
    serverId: null,
    channelId: null,
    speakers: [],
    listeners: [],
    requestedToSpeak: [],
  },

  isLoading: false,

  // Actions
  setServers: (servers) => set({ servers }),
  setActiveServerId: (activeServerId) => set({ activeServerId }),
  setActiveChannelId: (activeChannelId) => set({ activeChannelId }),
  setPublicServers: (publicServers) => set({ publicServers }),
  setLoading: (isLoading) => set({ isLoading }),

  // Server Management
  addServer: (server) =>
    set((state) => ({ servers: [...state.servers, server] })),
  updateServer: (serverId, updates) =>
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId ? { ...s, ...updates } : s,
      ),
    })),
  removeServer: (serverId) =>
    set((state) => ({
      servers: state.servers.filter((s) => s.id !== serverId),
      activeServerId:
        state.activeServerId === serverId ? null : state.activeServerId,
      activeChannelId:
        state.activeServerId === serverId ? null : state.activeChannelId,
    })),

  // Channel Management
  setChannels: (serverId, channels) =>
    set((state) => ({
      channels: { ...state.channels, [serverId]: channels },
    })),
  addChannel: (serverId, channel) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [serverId]: [...(state.channels[serverId] || []), channel],
      },
    })),
  updateChannel: (serverId, channelId, updates) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [serverId]: (state.channels[serverId] || []).map((c) =>
          c.id === channelId ? { ...c, ...updates } : c,
        ),
      },
    })),
  removeChannel: (serverId, channelId) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [serverId]: (state.channels[serverId] || []).filter(
          (c) => c.id !== channelId,
        ),
      },
      activeChannelId:
        state.activeChannelId === channelId ? null : state.activeChannelId,
    })),

  // Member Management
  setMembers: (serverId, members) =>
    set((state) => ({
      members: { ...state.members, [serverId]: members },
    })),
  addMember: (serverId, member) =>
    set((state) => ({
      members: {
        ...state.members,
        [serverId]: [...(state.members[serverId] || []), member],
      },
    })),
  updateMember: (serverId, userId, updates) =>
    set((state) => ({
      members: {
        ...state.members,
        [serverId]: (state.members[serverId] || []).map((m) =>
          m.userId === userId ? { ...m, ...updates } : m,
        ),
      },
    })),
  removeMember: (serverId, userId) =>
    set((state) => ({
      members: {
        ...state.members,
        [serverId]: (state.members[serverId] || []).filter(
          (m) => m.userId !== userId,
        ),
      },
    })),

  // Role Management
  setRoles: (serverId, roles) =>
    set((state) => ({
      roles: { ...state.roles, [serverId]: roles },
    })),
  addRole: (serverId, role) =>
    set((state) => ({
      roles: {
        ...state.roles,
        [serverId]: [...(state.roles[serverId] || []), role],
      },
    })),
  updateRole: (serverId, roleId, updates) =>
    set((state) => ({
      roles: {
        ...state.roles,
        [serverId]: (state.roles[serverId] || []).map((r) =>
          r.id === roleId ? { ...r, ...updates } : r,
        ),
      },
    })),
  removeRole: (serverId, roleId) =>
    set((state) => ({
      roles: {
        ...state.roles,
        [serverId]: (state.roles[serverId] || []).filter(
          (r) => r.id !== roleId,
        ),
      },
    })),

  // Message Management
  setMessages: (channelId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [channelId]: messages },
    })),
  addMessage: (channelId, message) =>
    set((state) => {
      const existing = state.messages[channelId] || [];
      if (existing.some((m) => m.id === message.id)) return {};
      return {
        messages: {
          ...state.messages,
          [channelId]: [...existing, message],
        },
      };
    }),
  updateMessage: (channelId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m,
        ),
      },
    })),
  removeMessage: (channelId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] || []).filter(
          (m) => m.id !== messageId,
        ),
      },
    })),

  // Transient Voice Actions
  joinVoice: (serverId, channelId, userId) =>
    set((state) => ({
      voice: {
        ...state.voice,
        serverId,
        channelId,
        connectedUsers: [
          ...state.voice.connectedUsers.filter((id) => id !== userId),
          userId,
        ],
      },
    })),
  leaveVoice: (userId) =>
    set((state) => ({
      voice: {
        ...state.voice,
        serverId: null,
        channelId: null,
        connectedUsers: state.voice.connectedUsers.filter(
          (id) => id !== userId,
        ),
      },
    })),
  setMute: (isMuted) =>
    set((state) => ({
      voice: { ...state.voice, isMuted },
    })),
  setDeafen: (isDeafened) =>
    set((state) => ({
      voice: { ...state.voice, isDeafened },
    })),
  setScreenShare: (isScreenSharing) =>
    set((state) => ({
      voice: { ...state.voice, isScreenSharing },
    })),
  setSpeakers: (activeSpeakers) =>
    set((state) => ({
      voice: { ...state.voice, activeSpeakers },
    })),
  setVoiceConnectedUsers: (connectedUsers) =>
    set((state) => ({
      voice: { ...state.voice, connectedUsers },
    })),

  // Transient Stage Actions
  joinStage: (serverId, channelId, isSpeaker, userId) =>
    set((state) => ({
      stage: {
        ...state.stage,
        serverId,
        channelId,
        speakers: isSpeaker
          ? [...state.stage.speakers.filter((id) => id !== userId), userId]
          : state.stage.speakers.filter((id) => id !== userId),
        listeners: !isSpeaker
          ? [...state.stage.listeners.filter((id) => id !== userId), userId]
          : state.stage.listeners.filter((id) => id !== userId),
      },
    })),
  leaveStage: (userId) =>
    set((state) => ({
      stage: {
        serverId: null,
        channelId: null,
        speakers: state.stage.speakers.filter((id) => id !== userId),
        listeners: state.stage.listeners.filter((id) => id !== userId),
        requestedToSpeak: state.stage.requestedToSpeak.filter(
          (id) => id !== userId,
        ),
      },
    })),
  setStageQueue: (queue) =>
    set((state) => ({
      stage: {
        ...state.stage,
        speakers: queue.speakers,
        listeners: queue.listeners,
        requestedToSpeak: queue.requestedToSpeak,
      },
    })),
  updateStageUserRole: (userId, role) =>
    set((state) => {
      let speakers = [...state.stage.speakers];
      let listeners = [...state.stage.listeners];
      let requestedToSpeak = [...state.stage.requestedToSpeak];

      // Remove from all
      speakers = speakers.filter((id) => id !== userId);
      listeners = listeners.filter((id) => id !== userId);
      requestedToSpeak = requestedToSpeak.filter((id) => id !== userId);

      if (role === "SPEAKER") {
        speakers.push(userId);
      } else if (role === "LISTENER") {
        listeners.push(userId);
      } else if (role === "REQUESTED") {
        requestedToSpeak.push(userId);
      }

      return {
        stage: {
          ...state.stage,
          speakers,
          listeners,
          requestedToSpeak,
        },
      };
    }),
}));
