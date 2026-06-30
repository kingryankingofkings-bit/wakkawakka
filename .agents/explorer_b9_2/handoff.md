# State & Socket Exploration Report (Batch 9: Forum & Voting)

## 1. Observation
We have inspected the global architecture of the Wakka Wakka application, examining state management patterns, real-time socket infrastructure, and existing integrations. The relevant files, configurations, and verbatim lines observed include:

### A. Existing Zustand Stores (`src/store/`)
- **`src/store/professionalStore.ts`**:
  Uses separate state and action interfaces for modular sub-stores and merges them using the `create` method. For example:
  ```typescript
  // Lines 147-155
  interface JobState {
    jobs: Job[];
    myApplications: JobApplication[];
    companies: Company[];
    activeJob: Job | null;
    activeCompany: Company | null;
    loading: boolean;
    error: string | null;
  }
  
  // Lines 157-165
  interface JobActions {
    fetchJobs: (filters?: { query?: string; search?: string; type?: string; workplaceType?: string }) => Promise<void>;
    fetchJobById: (id: string) => Promise<void>;
    createJob: (jobData: any) => Promise<void>;
    applyToJob: (jobId: string, resumeUrl: string, coverLetter?: string) => Promise<void>;
    fetchMyApplications: () => Promise<void>;
    fetchCompanyBySlug: (slug: string) => Promise<void>;
    createCompany: (companyData: any) => Promise<void>;
  }

  // Line 167
  export const useJobStore = create<JobState & JobActions>((set, get) => ({ ... }));
  ```
  It follows a unified standard of using asynchronous `fetch` calls, handling `loading` and `error` states, and mutating local arrays/objects using state merge functions (e.g. `set((state) => ({ jobs: [data.data, ...state.jobs], loading: false }))`).
- **`src/store/feedStore.ts`**:
  Defines flat state and updates (lines 9-24):
  ```typescript
  interface FeedState {
    posts: Post[];
    feedType: FeedType;
    isLoading: boolean;
    hasMore: boolean;
  }
  interface FeedActions {
    setPosts: (posts: Post[]) => void;
    addPost: (post: Post) => void;
    updatePost: (id: string, updates: Partial<Post>) => void;
    removePost: (id: string) => void;
    setFeedType: (type: FeedType) => void;
    setLoading: (loading: boolean) => void;
    setHasMore: (hasMore: boolean) => void;
  }
  ```

### B. Backend Socket.IO Server Configuration (`server.ts`)
- The server initializes Socket.IO with standard paths and listens to client connection events:
  ```typescript
  // Lines 33-40
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });
  ```
- It uses Room-based subscription to isolate events:
  - User private rooms: `socket.join("user:${userId}")` (Line 46)
  - Channel rooms: `socket.join("server-channel:${channelId}")` (Line 175)
  - InMail rooms: `socket.join("inmail:${inMailConversationId}")` (Line 241)
- Real-time broadcasts use targeted emits:
  - Broadcasts to room excluding sender: `socket.to(room).emit(...)`
  - Broadcasts to all users in room: `io.to(room).emit(...)`
  - Example:
    ```typescript
    // Lines 264-265
    socket.to(`inmail:${data.inMailConversationId}`).emit("new-inmail-message", data.message);
    ```

### C. Frontend Socket Connection & Hooks (`src/hooks/`)
- **`src/hooks/useSocket.ts`**:
  Initializes a single client connection per hook instance inside a `useEffect` using `socket.io-client`:
  ```typescript
  // Lines 72-81
  const { io } = await import("socket.io-client");
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

  socket = io(url, {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    timeout: 5000,
  } as any);
  ```
  Returns `{ socket: socketRef.current, isConnected, onlineUsers }` (Lines 139-143).
- **`src/hooks/useChannel.ts`**:
  Demonstrates how a specific UI component / feature hook integrates with real-time sockets:
  1. Calls `const { socket } = useSocket();` (Line 8).
  2. Subscribes on mount: `socket.emit("join-server-channel", channelId);` (Line 30).
  3. Registers state-updating listeners: `socket.on("new-server-message", handleNewMessage);` (Line 55).
  4. Emits custom socket payloads alongside REST requests:
     ```typescript
     // Lines 83-88
     if (socket) {
       socket.emit("send-server-message", {
         channelId,
         message: data.message,
       });
     }
     ```
  5. Cleans up on unmount:
     ```typescript
     // Lines 60-66
     return () => {
       socket.emit("leave-server-channel", channelId);
       socket.off("new-server-message", handleNewMessage);
       ...
     };
     ```

---

## 2. Logic Chain
To design the Zustand store and Socket.IO real-time strategy for Batch 9 (Reddit-style Forum & Voting) while adhering to established project conventions, we trace the following path:
1. **Zustand Store (`src/store/redditStore.ts`)**:
   - *Observation*: Existing stores (`professionalStore.ts`) separate states and actions into dedicated TS interfaces, handle loading/error states, and update list collections sequentially.
   - *Reasoning*: The Reddit feature introduces subreddits, posts, votes, comments, and awards. A single store containing interfaces for each segment (e.g. `SubredditState`, `PostState`, `CommentState`, `AwardState`) and matching actions, combined into a singular `useRedditStore`, matches the design of `useJobStore` or `useInMailStore`.
   - *Reasoning*: Local state must store user votes (`activePostVotes` and `activeCommentVotes`) so that upvote/downvote buttons instantly render in their colored/activated states.
2. **Socket.IO Event Flow**:
   - *Observation*: The existing system uses room-based isolation (`server-channel:${channelId}`) and broadcasts updates using `socket.to(room)` or `io.to(room)`.
   - *Reasoning*: In a Reddit application, we want to receive live comments, votes, and moderation alerts ONLY when we are active in a specific subreddit or post view. Listening globally would cause immense overhead.
   - *Reasoning*: We should isolate post-level real-time updates (comments, votes, awards) to room `reddit-post:${postId}`. Subreddit-level updates (moderation bans, locks, rules updates) should go to room `reddit-subreddit:${subredditId}`.
3. **API and Socket Interaction**:
   - *Observation*: In `useChannel.ts`, sending a message fires a REST `POST` request, writes to the local store, and then emits the new message on the socket. Remote clients listen to the socket and append the message.
   - *Reasoning*: We should follow this hybrid pattern for comments, votes, and awards. When a user upvotes, the client POSTs to `/api/reddit/posts/[id]/vote`, updates the local score, and emits a socket event `reddit-send-vote`. Other clients receive `reddit-new-vote` and update their local post scores.

---

## 3. Caveats
- **Prisma Schema Generation**: The models listed in `SCOPE.md` (e.g. `Subreddit`, `SubredditPost`, `SubredditComment`, `RedditVote`, etc.) are not yet defined in `prisma/schema.prisma` or generated. The Zustand store type definitions in our recommendations assume these types will be declared globally or co-located in `src/store/redditStore.ts` by the implementer.
- **REST Endpoints**: We assume the REST routes described in `SCOPE.md` (like `/api/reddit/posts/[id]/vote`) will be implemented by the backend/full-stack implementer and return standard JSON responses that match our store actions.
- **Desktop vs. Mobile Context**: Real-time connections are established per-tab. If multiple tabs are open, they will join the rooms independently, which is expected behavior.

---

## 4. Conclusion & Recommendations

### Recommended Zustand Store Layout (`src/store/redditStore.ts`)
We recommend creating a consolidated `useRedditStore` with the following structure:

```typescript
import { create } from "zustand";

// Subreddit Model
export interface Subreddit {
  id: string;
  name: string;
  slug: string;
  description?: string;
  creatorId: string;
  rules?: string;
  memberCount: number;
  postCount: number;
  customTheme?: any;
  isNSFW: boolean;
  isSpoiler: boolean;
  createdAt: string;
}

// Subreddit Member
export interface SubredditMember {
  id: string;
  subredditId: string;
  userId: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  flair?: string;
  joinedAt: string;
  isBanned: boolean;
  isMuted: boolean;
}

// Subreddit Post
export interface SubredditPost {
  id: string;
  title: string;
  content: string;
  type: "TEXT" | "POLL" | "LINK" | "MEDIA";
  mediaUrls: string[];
  pollOptions?: any;
  pollVotes?: any;
  upvotes: number;
  downvotes: number;
  score: number;
  authorId: string;
  author?: { displayName: string; username: string; avatar?: string };
  subredditId: string;
  subreddit?: { name: string; slug: string };
  isSpoiler: boolean;
  isNSFW: boolean;
  isLocked: boolean;
  isPinned: boolean;
  isAMA: boolean;
  createdAt: string;
}

// Subreddit Comment
export interface SubredditComment {
  id: string;
  content: string;
  authorId: string;
  author?: { displayName: string; username: string; avatar?: string };
  postId: string;
  parentId?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  isDeleted: boolean;
  isAMAAnswer: boolean;
  replies?: SubredditComment[];
  createdAt: string;
}

// Reddit Award
export interface RedditAward {
  id: string;
  name: string;
  icon: string;
  price: number;
  senderId: string;
  receiverId: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  createdAt: string;
}

// Moderation Action
export interface RedditModAction {
  id: string;
  subredditId: string;
  moderatorId: string;
  action: string;
  targetUserId?: string;
  targetPostId?: string;
  targetCommentId?: string;
  reason?: string;
  createdAt: string;
}

// Store Interfaces
interface RedditState {
  subreddits: Subreddit[];
  activeSubreddit: Subreddit | null;
  activeSubredditMembers: SubredditMember[];
  posts: SubredditPost[];
  activePost: SubredditPost | null;
  comments: SubredditComment[];
  activePostVotes: Record<string, "UPVOTE" | "DOWNVOTE" | null>;
  activeCommentVotes: Record<string, "UPVOTE" | "DOWNVOTE" | null>;
  loading: boolean;
  error: string | null;
}

interface RedditActions {
  // Subreddits
  fetchSubreddits: () => Promise<void>;
  fetchSubredditByName: (name: string) => Promise<void>;
  createSubreddit: (data: any) => Promise<void>;
  joinSubreddit: (subredditId: string) => Promise<void>;
  leaveSubreddit: (subredditId: string) => Promise<void>;
  
  // Posts
  fetchPosts: (filters?: { subredditId?: string; sort?: string; query?: string }) => Promise<void>;
  fetchPostById: (id: string) => Promise<void>;
  createPost: (data: any) => Promise<void>;
  crosspost: (postId: string, targetSubredditId: string) => Promise<void>;
  toggleAMA: (postId: string, isAMA: boolean) => Promise<void>;

  // Comments
  fetchComments: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  toggleAMAAnswer: (commentId: string, isAMAAnswer: boolean) => Promise<void>;
  
  // Votes
  votePost: (postId: string, type: "UPVOTE" | "DOWNVOTE") => Promise<void>;
  voteComment: (commentId: string, type: "UPVOTE" | "DOWNVOTE") => Promise<void>;
  
  // Awards
  giveAward: (targetId: string, targetType: "POST" | "COMMENT", awardName: string) => Promise<void>;

  // Moderation
  moderatePost: (postId: string, action: "LOCK" | "REMOVE" | "PIN", reason?: string) => Promise<void>;
  moderateComment: (commentId: string, action: "REMOVE", reason?: string) => Promise<void>;
  moderateUser: (subredditId: string, targetUserId: string, action: "BAN" | "MUTE", reason?: string) => Promise<void>;

  // Local/Real-Time Sync Setters
  addCommentLocal: (comment: SubredditComment) => void;
  updatePostScoreLocal: (postId: string, upvotes: number, downvotes: number, score: number) => void;
  updateCommentScoreLocal: (commentId: string, upvotes: number, downvotes: number, score: number) => void;
  addAwardLocal: (award: RedditAward) => void;
  applyModActionLocal: (action: RedditModAction) => void;
}

export const useRedditStore = create<RedditState & RedditActions>((set, get) => ({
  subreddits: [],
  activeSubreddit: null,
  activeSubredditMembers: [],
  posts: [],
  activePost: null,
  comments: [],
  activePostVotes: {},
  activeCommentVotes: {},
  loading: false,
  error: null,

  // Implement API calls fetching from REST endpoints described in SCOPE.md...
  fetchSubreddits: async () => { ... },
  fetchSubredditByName: async (name) => { ... },
  ...
}));
```

---

### Recommended Socket.IO Integration Design

#### A. Server-Side Socket Handlers (`server.ts` updates)
Register the following listeners inside `io.on("connection", ...)` in `server.ts`:

```typescript
// 1. Room Orchestration
socket.on("join-reddit-post", (postId: string) => {
  socket.join(`reddit-post:${postId}`);
});

socket.on("leave-reddit-post", (postId: string) => {
  socket.leave(`reddit-post:${postId}`);
});

socket.on("join-reddit-subreddit", (subredditId: string) => {
  socket.join(`reddit-subreddit:${subredditId}`);
});

socket.on("leave-reddit-subreddit", (subredditId: string) => {
  socket.leave(`reddit-subreddit:${subredditId}`);
});

// 2. Real-Time Voting Broadcasts
socket.on("reddit-send-vote", (data: { postId?: string; commentId?: string; upvotes: number; downvotes: number; score: number }) => {
  // If post vote, broadcast to post room
  if (data.postId) {
    socket.to(`reddit-post:${data.postId}`).emit("reddit-new-vote", data);
  } else if (data.commentId) {
    // If comment vote, broadcast to the post room the comment belongs to (must provide postId in sender event)
    socket.to(`reddit-post:${data.postId}`).emit("reddit-new-vote", data);
  }
});

// 3. Live Comment Influx
socket.on("reddit-send-comment", (data: { postId: string; comment: any }) => {
  socket.to(`reddit-post:${data.postId}`).emit("reddit-new-comment", data.comment);
});

// 4. Content Awards
socket.on("reddit-send-award", (data: { postId: string; award: any }) => {
  socket.to(`reddit-post:${data.postId}`).emit("reddit-new-award", data.award);
});

// 5. Moderation Action Alerting
socket.on("reddit-send-mod-action", (data: { subredditId: string; postId?: string; action: any }) => {
  // Broadcast alert to subreddit room
  socket.to(`reddit-subreddit:${data.subredditId}`).emit("reddit-mod-action-alert", data);
});
```

#### B. Frontend Hook (`src/hooks/useRedditSocket.ts`)
Create a custom hook that coordinates subscriptions when a user views a Subreddit or Post page:

```typescript
import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRedditStore } from "@/store/redditStore";

export function useRedditSocket(postId?: string, subredditId?: string) {
  const { socket } = useSocket();
  const store = useRedditStore();

  useEffect(() => {
    if (!socket) return;

    // Subscribed to specific post (comments, votes, awards)
    if (postId) {
      socket.emit("join-reddit-post", postId);

      const handleNewComment = (comment: any) => {
        store.addCommentLocal(comment);
      };

      const handleNewVote = (data: any) => {
        if (data.postId) {
          store.updatePostScoreLocal(data.postId, data.upvotes, data.downvotes, data.score);
        } else if (data.commentId) {
          store.updateCommentScoreLocal(data.commentId, data.upvotes, data.downvotes, data.score);
        }
      };

      const handleNewAward = (award: any) => {
        store.addAwardLocal(award);
      };

      socket.on("reddit-new-comment", handleNewComment);
      socket.on("reddit-new-vote", handleNewVote);
      socket.on("reddit-new-award", handleNewAward);

      return () => {
        socket.emit("leave-reddit-post", postId);
        socket.off("reddit-new-comment", handleNewComment);
        socket.off("reddit-new-vote", handleNewVote);
        socket.off("reddit-new-award", handleNewAward);
      };
    }

    // Subscribed to specific subreddit (moderation bans, locks, user mutes)
    if (subredditId) {
      socket.emit("join-reddit-subreddit", subredditId);

      const handleModAction = (action: any) => {
        store.applyModActionLocal(action);
      };

      socket.on("reddit-mod-action-alert", handleModAction);

      return () => {
        socket.emit("leave-reddit-subreddit", subredditId);
        socket.off("reddit-mod-action-alert", handleModAction);
      };
    }
  }, [socket, postId, subredditId, store]);
}
```

---

## 5. Verification Method

To independently verify this strategy:
1. **Compilation Check**: Run `npm run type-check` to ensure the structure of the recommended Typescript types does not generate syntax or dependency errors.
2. **REST Endpoints Testing**: Implementer will spin up the server with `npm run dev` and execute REST `POST` requests to `/api/reddit/posts/[id]/vote` or `/api/reddit/posts/[id]` to confirm DB writes function correctly before emitting socket updates.
3. **Socket Event Logging**:
   - Run the custom server.
   - Use a tool like Postman or custom E2E runner tests to verify that connecting to `ws://localhost:3000/api/socket` upgrades successfully and emits/receives `reddit-send-vote` / `reddit-new-vote` events under the targeted `reddit-post:${postId}` namespace.
4. **Integration verification**:
   - Check that `tests/e2e_runner.js` runs successfully and verify if it compiles correctly.
