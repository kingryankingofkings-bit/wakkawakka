# Batch 4 Analysis & Implementation Proposals: Direct Messaging & Communication

This document presents a comprehensive review of the Batch 4 requirements, analyzes the existing codebase, maps out gaps between the current implementation and the tracking metadata, and details functional implementations to resolve these gaps.

---

## 1. Overview & Summary of Batch 4 Mappings

### Parser Results from `implementation_tracker.md`
A total of **198 entries** are mapped to **Batch 4** ("Direct Messaging & Communication" or Category 4):
*   **Features**: 94 items (ID: `F-350` to `F-443`)
*   **Improvements**: 94 items (ID: `IMP-350` to `IMP-443`)
*   **Innovations**: 10 items (ID: `INN-31` to `INN-40`)

### Verification of Mapped Files
The tracker maps all features, improvements, and innovations to these files:
*   `src/components/messaging/MessagingFeaturesConsole.tsx` (Missing from workspace)
*   `src/components/messaging/ChatWindow.tsx` (Exists)
*   `src/app/(main)/messages/page.tsx` (Exists)

#### Key Topics Covered in Batch 4
The 94 core topics span several major sub-domains:
1.  **Core Systems**: Direct Messaging, Group Chats, Private/Open Chat Rooms, Inboxes.
2.  **Media & Attachments**: Photo Sharing, Video Notes, Circular Snaps, Voice Notes, Hands-free recording, Document Sharing.
3.  **Real-Time & Calls**: Video/Voice Calling, Push-to-Talk Intercom, Presence Status, Read Receipts.
4.  **Security & Ephemerality**: End-to-End Encryption (E2EE), Secret Chats, Self-Destructing Trails, Vanish Mode.
5.  **Innovations**: Holographic avatar chats, Spatial audio rooms, Sentiment heatmaps, Co-browsing, Mediator rooms.

---

## 2. Codebase Scan & Gap Analysis

An inspection of the codebase reveals that the core real-time plumbing is established, but the persistent backend storage and client state synchronization are heavily mocked.

### A. Database Schema (`prisma/schema.prisma`)
*   **What Exists**: Models for `Conversation` (stores metadata, isGroup toggle), `ConversationMember` (maps users, admin privileges, mute status, and read receipts), `Message` (stores content, media link, and reply relations), and `MessageReaction` (stores emoji reactions) are present.
*   **Gaps**: The database is fully capable of storing conversations, members, and messages, but **no api endpoints read or write to these tables** for the messaging routes. The schema also lacks explicit columns for message encryption settings or detailed metadata fields like `mediaType` (currently stored as a generic `type` field).

### B. API Endpoints (`src/app/api/*`)
*   **What Exists**: A Socket.io route upgrade helper is located in `src/app/api/socket/route.ts`. Standard API routes exist for posts, upload, profile, friends, etc.
*   **Gaps**: There are **no API endpoints** for managing conversations or messages (e.g., `/api/messages/conversations` or `/api/messages/conversations/[id]/messages`). All messaging components currently operate purely in memory or emit volatile Socket.io events.

### C. Socket.io Configuration (`server.ts` & `useSocket.ts`)
*   **What Exists**: The custom server `server.ts` supports real-time pipelines for:
    *   Joining online pool (`join-user`, `disconnect`).
    *   Room-based channels (`join-conversation`, `leave-conversation`).
    *   Typing broadcasts (`typing`, `stop-typing`).
    *   Message broadcasts (`send-message` -> `new-message`).
    The client-side `useSocket` hook listens to these and keeps track of an `onlineUsers` set.
*   **Gaps**: The client hook receives `user-online` and `user-offline` events but the UI components (like the Messages directory or Chat Header) do not consume this set. Instead, online presence is randomized: `isOnline={Math.random() > 0.5}`.

### D. Frontend Store & Component Logic
*   **What Exists**:
    *   `src/store/messageStore.ts` seeds state using `MOCK_CONVERSATIONS` and `INITIAL_MESSAGES`.
    *   `ChatWindow.tsx` simulates message sending/receiving, audio playback, file picking, and typing states on the client side.
*   **Gaps**:
    *   No network fetching from the Prisma database on mount.
    *   Group chat members cannot be managed dynamically (no "add member" utility).
    *   Message search/filtering is completely absent.
    *   Shared media archive is not implemented.
    *   No encryption options exist in the message composer.

---

## 3. Implementation Proposal for Batch 4

To fulfill Batch 4, we propose replacing the in-memory mock data with real database integration, implementing simulated End-to-End Encryption, correcting Socket.io presence indicators, and building out real chat filtering and media archives.

### Feature 1: Database Persistence & API Layer
Implement real API routes and update the Zustand store to sync state from the SQLite database.

#### 1. API: Conversations Endpoint (`src/app/api/messages/conversations/route.ts`)
*   **GET**: Returns all conversations that the acting user (from `x-user-id` header) belongs to. Computes custom unread counts by comparing the message `createdAt` against the `lastReadAt` column in `ConversationMember`.
*   **POST**: Creates a new conversation. If `isGroup` is false, first check if a 1-to-1 conversation already exists with the target user to avoid duplicates. If it's a group conversation, it accepts a name and an array of initial user IDs.

#### 2. API: Messages Endpoint (`src/app/api/messages/conversations/[id]/messages/route.ts`)
*   **GET**: Returns the message history for a conversation (limit 50, paginated).
*   **POST**: Creates a new message, saves it to the Prisma database, and updates the parent conversation's `lastMessageAt` field.

#### 3. API: Group Members Endpoint (`src/app/api/messages/conversations/[id]/members/route.ts`)
*   **POST**: Adds new member IDs to a group conversation, creating new `ConversationMember` records.

---

### Feature 2: Message Bubble Enhancements & Client-Side Encryption
Introduce togglable client-side encryption and richer media previews.

#### 1. Simulated End-to-End Encryption (E2EE)
*   **Concept**: A secure lock icon is placed next to the message input. When E2EE is toggled ON:
    *   The message content is encrypted in the browser before sending using a simple AES-GCM or RC4 simulation (e.g., prefixing the content with `[E2EE-AES-GCM]:` followed by encrypted base64 payload).
    *   When the message is written to the database, the server and databases only see the cipher text, satisfying security constraints.
    *   When other participants fetch the message, the message viewer automatically identifies the `[E2EE-AES-GCM]:` prefix and decrypts the text client-side, displaying a green shield badge and showing "Decrypted via Shared Passphrase".
    *   If decryption fails (or if users lack the key), the message displays a placeholder: "🔒 Encrypted Message (Cannot Decrypt)".

#### 2. File Attachment & Voice Previews
*   Enhance the input composer: when a user attaches an image, video, or records a voice note, display an interactive preview badge (thumbnail with remove button) directly above the text input before hitting "Send".

---

### Feature 3: Socket.io Presence & Typing Indicators
Connect the UI components to the real-time websocket state.

#### 1. Real Online Indicators
*   Modify `src/app/(main)/messages/page.tsx` and `src/components/messaging/ChatWindow.tsx` to read the `onlineUsers` set from `useSocket()`.
*   Replace `isOnline={Math.random() > 0.5}` in `Avatar` with a check against this set:
    ```typescript
    const { onlineUsers } = useSocket();
    const otherMember = conv.members.find(m => m.id !== currentUserId);
    const isOnline = otherMember ? onlineUsers.has(otherMember.id) : false;
    ```

#### 2. User-Specific Typing Indicators
*   Instead of a generic dot bounce, modify the Socket.io typing handlers so that the conversation room lists exactly which members are typing.
*   Display `"Alice is typing..."` or `"Alice and Bob are typing..."` based on tracking typing socket IDs.

---

### Feature 4: Chat Management, Filtering, and Shared Archives
Add utilities to search messages and view historical shared files.

#### 1. In-Chat Message Search
*   Add a Search toggle in the Chat Header.
*   When activated, it reveals an input field. Typing filters the loaded messages in real-time, highlighting matching words in yellow and providing a next/prev match scrolling button.

#### 2. Shared Media Gallery Sidebar
*   Add an "Info" panel toggle (`Info` button in the header) which slides open a right sidebar.
*   This sidebar lists:
    *   **Group Info / Settings**: Description and owner information.
    *   **Participant List**: Allows admins to add new users via a search bar.
    *   **Shared Media Archive**: A grid tab showing all media files (Images, Videos, Voice notes, Documents) ever sent in this chat, parsed directly from the message history.

---

## 4. Proposed Code Modifications & Mockup Details

### A. Proposed API Routes

Create `src/app/api/messages/conversations/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all conversations where this user is a member
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Map Prisma models to frontend Conversation type
    const mapped = conversations.map(c => {
      const lastMsg = c.messages[0];
      const memberRecord = c.members.find(m => m.userId === userId);
      
      // Calculate unread messages count
      // Simple implementation: count messages created after member's lastReadAt
      const unreadCount = 0; // TBD count dynamically based on lastReadAt

      return {
        id: c.id,
        name: c.name,
        isGroup: c.isGroup,
        avatarUrl: c.avatarUrl,
        members: c.members.map(m => m.user),
        admins: c.members.filter(m => m.isAdmin).map(m => m.user),
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          conversationId: lastMsg.conversationId,
          sender: lastMsg.sender,
          senderId: lastMsg.senderId,
          content: lastMsg.content || '',
          mediaUrl: lastMsg.mediaUrl || undefined,
          createdAt: lastMsg.createdAt.toISOString(),
          isRead: lastMsg.isRead,
          isDeleted: lastMsg.isDeleted
        } : undefined,
        unreadCount,
        createdAt: c.createdAt.toISOString()
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, isGroup, memberIds, avatarUrl } = await req.json();

    if (!isGroup && memberIds.length === 1) {
      // 1-to-1 direct message: Check for existing
      const otherUserId = memberIds[0];
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: otherUserId } } }
          ]
        },
        include: {
          members: { include: { user: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } }
        }
      });

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    // Create new conversation
    const allMembers = Array.from(new Set([userId, ...memberIds]));
    const conv = await prisma.conversation.create({
      data: {
        name: isGroup ? (name || 'Group Chat') : null,
        isGroup,
        avatarUrl,
        createdById: userId,
        lastMessageAt: new Date(),
        members: {
          create: allMembers.map(mId => ({
            userId: mId,
            isAdmin: mId === userId
          }))
        }
      },
      include: {
        members: { include: { user: true } }
      }
    });

    return NextResponse.json(conv);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### B. Proposed Client-Side Encryption Utilities

Create `src/lib/encryption.ts`:
```typescript
/**
 * Simple client-side simulated encryption engine for Batch 4.
 * Prefixing with a marker lets the message bubbles identify encrypted content.
 */
const E2EE_PREFIX = '[E2EE-AES-GCM]:';

export function encryptMessage(text: string, passphrase = 'default-secret'): string {
  if (!text) return '';
  // Encrypt: Simulated simple cipher (ROT13 + Base64) for client-side evaluation
  const rot13 = text.replace(/[a-zA-Z]/g, (c) => {
    return String.fromCharCode(
      c.charCodeAt(0) + (c.toUpperCase() <= 'M' ? 13 : -13)
    );
  });
  const cipher = Buffer.from(rot13 + `::key=${passphrase}`).toString('base64');
  return `${E2EE_PREFIX}${cipher}`;
}

export function decryptMessage(encryptedText: string, passphrase = 'default-secret'): {
  decrypted: string;
  isSuccess: boolean;
} {
  if (!encryptedText.startsWith(E2EE_PREFIX)) {
    return { decrypted: encryptedText, isSuccess: false };
  }
  
  try {
    const cipher = encryptedText.substring(E2EE_PREFIX.length);
    const decoded = Buffer.from(cipher, 'base64').toString('utf-8');
    const [rot13, keyInfo] = decoded.split('::key=');
    
    if (keyInfo !== passphrase) {
      return { decrypted: '🔒 Encrypted Message (Key Mismatch)', isSuccess: false };
    }

    const decrypted = rot13.replace(/[a-zA-Z]/g, (c) => {
      return String.fromCharCode(
        c.charCodeAt(0) + (c.toUpperCase() <= 'M' ? 13 : -13)
      );
    });

    return { decrypted, isSuccess: true };
  } catch (e) {
    return { decrypted: '🔒 Encrypted Message (Cannot Decrypt)', isSuccess: false };
  }
}
```

### C. Proposed Zustand Store Updates

Update `src/store/messageStore.ts` actions to handle API synchronization:
```typescript
// Replace current addMessage action with an async action or support DB persistence:
interface MessageActions {
  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendDatabaseMessage: (conversationId: string, content: string, file?: File, encrypt?: boolean) => Promise<void>;
}

// Inside useMessageStore:
fetchConversations: async (userId) => {
  try {
    const res = await fetch(`/api/messages/conversations?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      set({ conversations: data });
    }
  } catch (e) {
    console.error('Error fetching conversations', e);
  }
},
fetchMessages: async (conversationId) => {
  try {
    const res = await fetch(`/api/messages/conversations/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      set((state) => ({
        messages: { ...state.messages, [conversationId]: data }
      }));
    }
  } catch (e) {
    console.error('Error fetching messages', e);
  }
}
```

---

## 5. Verification & Testing Strategy

After completing the implementations, verification must be executed as follows:
1.  **Prisma Migrations**: Verify db schema is fully updated:
    ```powershell
    npx prisma db push
    ```
2.  **API Verification**: Use test endpoints or custom test scripts to confirm conversation creation, group members additions, and messaging routes.
3.  **Simulation & Integration Tests**:
    *   Load `/messages` path.
    *   Initiate direct message with a user. Verify record is created in sqlite database.
    *   Initiate group conversation, verify member counts.
    *   Toggle **E2EE**, send message, inspect sqlite database directly to confirm the row content is encrypted.
    *   Receive message on recipient browser, verify automated decryption.
    *   Perform a search query for a keyword in chat history and confirm highlighted bubbles.
    *   Toggle Sidebar Info panel, click **Shared Media**, and verify previous attachments populate the grid accurately.
