import { create } from 'zustand';
import type { Conversation, Message } from '@/types';
import { MOCK_CONVERSATIONS, MOCK_USERS, CURRENT_USER } from '@/lib/mockData';

interface MessageState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
}

interface MessageActions {
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  markConversationRead: (conversationId: string) => void;
  addConversation: (conversation: Conversation) => void;
}

type MessageStore = MessageState & MessageActions;

// ---------------------------------------------------------------------------
// Seed mock messages for each mock conversation
// ---------------------------------------------------------------------------

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

const INITIAL_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: 'msg-c1-1',
      conversationId: 'c1',
      sender: MOCK_USERS[0],
      senderId: 'u1',
      content: 'Hey! Loved your latest post 🔥',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(120),
    },
    {
      id: 'msg-c1-2',
      conversationId: 'c1',
      sender: CURRENT_USER,
      senderId: 'current',
      content: 'Thanks! It took forever to finish 😅',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(118),
    },
    {
      id: 'msg-c1-3',
      conversationId: 'c1',
      sender: MOCK_USERS[0],
      senderId: 'u1',
      content: 'Are you free for a collab this week?',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(60),
    },
    {
      id: 'msg-c1-4',
      conversationId: 'c1',
      sender: CURRENT_USER,
      senderId: 'current',
      content: 'I have some time on Thursday afternoon!',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(55),
    },
    {
      id: 'msg-c1-5',
      conversationId: 'c1',
      sender: MOCK_USERS[0],
      senderId: 'u1',
      content: 'Perfect, let me send you the brief.',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(50),
    },
    {
      id: 'msg-c1-6',
      conversationId: 'c1',
      sender: MOCK_USERS[0],
      senderId: 'u1',
      content: 'Hey! Are you free for a collab this week?',
      isRead: false,
      isDeleted: false,
      createdAt: minutesAgo(15),
    },
  ],
  c2: [
    {
      id: 'msg-c2-1',
      conversationId: 'c2',
      sender: MOCK_USERS[0],
      senderId: 'u1',
      content: 'Welcome everyone to the Creative Crew chat! 🎉',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(500),
    },
    {
      id: 'msg-c2-2',
      conversationId: 'c2',
      sender: MOCK_USERS[1],
      senderId: 'u2',
      content: 'Super excited to be here! Already have some ideas.',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(495),
    },
    {
      id: 'msg-c2-3',
      conversationId: 'c2',
      sender: MOCK_USERS[2],
      senderId: 'u3',
      content: 'Same! Can we do a video series?',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(490),
    },
    {
      id: 'msg-c2-4',
      conversationId: 'c2',
      sender: CURRENT_USER,
      senderId: 'current',
      content: 'That sounds amazing. I can help with editing!',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(480),
    },
    {
      id: 'msg-c2-5',
      conversationId: 'c2',
      sender: MOCK_USERS[0],
      senderId: 'u1',
      content: 'Let\'s set up a call this week to brainstorm.',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(200),
    },
    {
      id: 'msg-c2-6',
      conversationId: 'c2',
      sender: MOCK_USERS[1],
      senderId: 'u2',
      content: 'I\'m free Tuesday or Wednesday afternoon.',
      isRead: true,
      isDeleted: false,
      createdAt: minutesAgo(195),
    },
    {
      id: 'msg-c2-7',
      conversationId: 'c2',
      sender: MOCK_USERS[2],
      senderId: 'u3',
      content: 'Wednesday works for me! 🙌',
      isRead: false,
      isDeleted: false,
      createdAt: minutesAgo(100),
    },
    {
      id: 'msg-c2-8',
      conversationId: 'c2',
      sender: MOCK_USERS[1],
      senderId: 'u2',
      content: 'Let\'s plan the next project!',
      isRead: false,
      isDeleted: false,
      createdAt: minutesAgo(30),
    },
  ],
};

export const useMessageStore = create<MessageStore>((set) => ({
  // Initial state
  conversations: MOCK_CONVERSATIONS,
  activeConversationId: null,
  messages: INITIAL_MESSAGES,

  // Actions
  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (message) =>
    set((state) => {
      const existing = state.messages[message.conversationId] ?? [];
      const updatedMessages = { ...state.messages, [message.conversationId]: [...existing, message] };

      // Update lastMessage and unreadCount on the conversation
      const conversations = state.conversations.map((c) => {
        if (c.id !== message.conversationId) return c;
        const isOwnMessage = message.senderId === CURRENT_USER.id;
        return {
          ...c,
          lastMessage: message,
          unreadCount: isOwnMessage ? c.unreadCount : c.unreadCount + 1,
        };
      });

      return { messages: updatedMessages, conversations };
    }),

  markConversationRead: (conversationId) =>
    set((state) => {
      const conversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      const messages = {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) => ({
          ...m,
          isRead: true,
        })),
      };
      return { conversations, messages };
    }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      messages: { ...state.messages, [conversation.id]: [] },
    })),
}));
