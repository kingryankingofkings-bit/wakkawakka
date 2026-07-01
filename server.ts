import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";

// =============================================================================
// WakkaWakka — Custom Server with Socket.IO
// Includes JWT authentication middleware and typed event handlers.
// =============================================================================

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Inline JWT verification for the server process ─────────────────────────
// We inline this to avoid importing from src/lib which may use Next.js aliases.
async function verifySocketToken(
  token: string,
): Promise<Record<string, unknown> | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret && !dev) return null;
    const jwtSecret =
      secret ||
      "dev-only-secret-do-not-use-in-prod-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", jwtSecret)
      .update(`${header}.${body}`)
      .digest("base64url");

    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Types for socket events ────────────────────────────────────────────────

interface OnlineUser {
  userId: string;
  socketId: string;
  lastSeen: Date;
}

interface ConversationMessage {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    content: string;
    mediaUrl?: string;
    createdAt: string;
  };
}

interface TypingEvent {
  conversationId: string;
  userId: string;
}

interface NotificationEvent {
  userId: string;
  notification: {
    id: string;
    type: string;
    actorId: string;
    message: string;
    link: string;
  };
}

interface LiveCommentEvent {
  streamId: string;
  comment: unknown;
}

interface LiveGiftEvent {
  streamId: string;
  gift: unknown;
}

interface LivePredictionEvent {
  streamId: string;
  event: string;
  prediction: unknown;
}

interface LiveRaidEvent {
  streamId: string;
  targetStreamId: string;
  targetUsername: string;
}

interface LiveCoHostEvent {
  streamId: string;
  coHosts: unknown;
}

interface AudioRoomEvent {
  roomId: string;
  userId?: string;
}

interface AudioJoinEvent {
  roomId: string;
  userId: string;
  user: unknown;
  isSpeaker: boolean;
}

interface AudioStateEvent {
  roomId: string;
  userId: string;
  isMuted?: boolean;
  handRaised?: boolean;
  isSpeaker?: boolean;
}

interface AudioSpeakEvent {
  roomId: string;
  userId: string;
  isSpeaking: boolean;
}

interface ServerChannelMessage {
  channelId: string;
  message: unknown;
}

interface ServerChannelDeleteMessage {
  channelId: string;
  messageId: string;
}

interface ServerTypingEvent {
  channelId: string;
  userId: string;
}

interface VoiceEvent {
  channelId: string;
  userId: string;
}

interface VoiceStateEvent {
  channelId: string;
  userId: string;
  isMuted?: boolean;
  isDeafened?: boolean;
}

interface SoundboardEvent {
  channelId: string;
  soundId: string;
  userId: string;
}

interface StageEvent {
  channelId: string;
  userId: string;
}

interface StageModerateEvent {
  channelId: string;
  userId: string;
  action: string;
}

interface InMailMessageEvent {
  inMailConversationId: string;
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    subject?: string;
    content: string;
    createdAt: string;
  };
}

interface InMailTypingEvent {
  inMailConversationId: string;
  userId: string;
}

interface RedditVoteEvent {
  targetId: string;
  targetType: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userKarma?: number;
  userId?: string;
}

interface RedditCommentEvent {
  postId: string;
  comment: unknown;
}

interface RedditAwardEvent {
  targetId: string;
  targetType: string;
  award: unknown;
}

interface RedditModEvent {
  subredditId: string;
  action: string;
  targetUserId?: string;
  targetPostId?: string;
  targetCommentId?: string;
  reason?: string;
}

// ── Online user tracking ───────────────────────────────────────────────────

const onlineUsers = new Map<string, OnlineUser>();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });

  // ── Socket.IO Authentication Middleware ──────────────────────────────────
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    // In development, allow unauthenticated connections with a user ID
    if (dev && !token) {
      const devUserId = socket.handshake.auth?.userId;
      if (devUserId) {
        (socket as any).userId = devUserId;
        return next();
      }
      // Allow completely anonymous connections in dev
      (socket as any).userId = "anonymous-dev";
      return next();
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = await verifySocketToken(token);
    if (!payload) {
      return next(new Error("Invalid or expired token"));
    }

    const userId = (payload.userId ?? payload.id) as string;
    if (!userId) {
      return next(new Error("Token missing user identity"));
    }

    (socket as any).userId = userId;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const authenticatedUserId = (socket as any).userId as string;
    if (dev) {
      console.log(
        `Socket connected: ${socket.id} (user: ${authenticatedUserId})`,
      );
    }

    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`);
      onlineUsers.set(userId, {
        userId,
        socketId: socket.id,
        lastSeen: new Date(),
      });
      io.emit("user-online", {
        userId,
        onlineUsers: Array.from(onlineUsers.keys()),
      });
    });

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("send-message", (data: ConversationMessage) => {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("new-message", data);
    });

    socket.on("typing", (data: TypingEvent) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing", data);
    });

    socket.on("stop-typing", (data: TypingEvent) => {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("stop-typing", data);
    });

    socket.on("send-notification", (data: NotificationEvent) => {
      io.to(`user:${data.userId}`).emit("notification", data.notification);
    });

    socket.on("join-live", (streamId: string) => {
      socket.join(`live:${streamId}`);
    });

    socket.on("live-comment", (data: LiveCommentEvent) => {
      io.to(`live:${data.streamId}`).emit("live-comment", data.comment);
    });

    socket.on("live-gift", (data: LiveGiftEvent) => {
      io.to(`live:${data.streamId}`).emit("live-gift", data.gift);
    });

    socket.on("live-prediction", (data: LivePredictionEvent) => {
      io.to(`live:${data.streamId}`).emit("live-prediction", data);
    });

    socket.on("live-raid", (data: LiveRaidEvent) => {
      io.to(`live:${data.streamId}`).emit("live-raid", data);
    });

    socket.on("live-cohost", (data: LiveCoHostEvent) => {
      io.to(`live:${data.streamId}`).emit("live-cohost", data);
    });

    socket.on("join-audio-room", (data: AudioRoomEvent | string) => {
      const roomId = typeof data === "string" ? data : data?.roomId;
      if (roomId) {
        socket.join(`audio:${roomId}`);
      }
    });

    socket.on("leave-audio-room", (data: AudioRoomEvent | string) => {
      const roomId = typeof data === "string" ? data : data?.roomId;
      if (roomId) {
        socket.leave(`audio:${roomId}`);
      }
    });

    socket.on("audio-join", (data: AudioJoinEvent) => {
      socket.to(`audio:${data.roomId}`).emit("audio-user-joined", data);
    });

    socket.on("audio-leave", (data: AudioRoomEvent) => {
      socket.to(`audio:${data.roomId}`).emit("audio-user-left", data);
    });

    socket.on("audio-state-update", (data: AudioStateEvent) => {
      socket.to(`audio:${data.roomId}`).emit("audio-state-changed", data);
    });

    socket.on("audio-speak", (data: AudioSpeakEvent) => {
      socket.to(`audio:${data.roomId}`).emit("audio-speak", data);
    });

    // =========================================================================
    // BATCH 7: SERVER/CHANNEL REALTIME HANDLERS
    // =========================================================================

    socket.on("join-server", (serverId: string) => {
      socket.join(`server:${serverId}`);
    });
    socket.on("leave-server", (serverId: string) => {
      socket.leave(`server:${serverId}`);
    });

    socket.on("join-server-channel", (channelId: string) => {
      socket.join(`server-channel:${channelId}`);
    });
    socket.on("leave-server-channel", (channelId: string) => {
      socket.leave(`server-channel:${channelId}`);
    });
    socket.on("send-server-message", (data: ServerChannelMessage) => {
      socket
        .to(`server-channel:${data.channelId}`)
        .emit("new-server-message", data.message);
    });
    socket.on("delete-server-message", (data: ServerChannelDeleteMessage) => {
      socket
        .to(`server-channel:${data.channelId}`)
        .emit("server-message-deleted", data.messageId);
    });
    socket.on("server-typing", (data: ServerTypingEvent) => {
      socket.to(`server-channel:${data.channelId}`).emit("server-typing", data);
    });
    socket.on("server-stop-typing", (data: ServerTypingEvent) => {
      socket
        .to(`server-channel:${data.channelId}`)
        .emit("server-stop-typing", data);
    });

    // Voice States
    socket.on("join-voice", (data: VoiceEvent) => {
      socket.join(`voice:${data.channelId}`);
      socket
        .to(`voice:${data.channelId}`)
        .emit("voice-user-joined", { userId: data.userId });
    });
    socket.on("leave-voice", (data: VoiceEvent) => {
      socket.leave(`voice:${data.channelId}`);
      socket
        .to(`voice:${data.channelId}`)
        .emit("voice-user-left", { userId: data.userId });
    });
    socket.on("voice-state-update", (data: VoiceStateEvent) => {
      socket
        .to(`voice:${data.channelId}`)
        .emit("voice-user-state-changed", data);
    });
    socket.on("play-soundboard", (data: SoundboardEvent) => {
      socket.to(`voice:${data.channelId}`).emit("soundboard-played", data);
    });

    // Stage Coordination
    socket.on("join-stage", (data: StageEvent) => {
      socket.join(`stage:${data.channelId}`);
      socket.to(`stage:${data.channelId}`).emit("stage-user-joined", data);
    });
    socket.on("stage-request-speak", (data: StageEvent) => {
      socket
        .to(`stage:${data.channelId}`)
        .emit("stage-user-requested", data.userId);
    });
    socket.on("stage-moderate-speaker", (data: StageModerateEvent) => {
      socket.to(`stage:${data.channelId}`).emit("stage-speaker-action", data);
    });

    // =========================================================================
    // BATCH 8: PROFESSIONAL & JOBS REALTIME HANDLERS (InMail & Notifications)
    // =========================================================================

    socket.on("join-inmail-conversation", (inMailConversationId: string) => {
      socket.join(`inmail:${inMailConversationId}`);
    });

    socket.on("leave-inmail-conversation", (inMailConversationId: string) => {
      socket.leave(`inmail:${inMailConversationId}`);
    });

    socket.on("send-inmail-message", (data: InMailMessageEvent) => {
      socket
        .to(`inmail:${data.inMailConversationId}`)
        .emit("new-inmail-message", data.message);
    });

    socket.on("inmail-typing", (data: InMailTypingEvent) => {
      socket
        .to(`inmail:${data.inMailConversationId}`)
        .emit("inmail-typing", data);
    });

    socket.on("inmail-stop-typing", (data: InMailTypingEvent) => {
      socket
        .to(`inmail:${data.inMailConversationId}`)
        .emit("inmail-stop-typing", data);
    });

    // =========================================================================
    // BATCH 9: REDDIT-STYLE FORUM REALTIME HANDLERS
    // =========================================================================
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

    socket.on("reddit-new-vote", (data: RedditVoteEvent) => {
      io.emit("reddit-vote-updated", data);
    });

    socket.on("reddit-new-comment", (data: RedditCommentEvent) => {
      io.to(`reddit-post:${data.postId}`).emit(
        "reddit-comment-received",
        data.comment,
      );
    });

    socket.on("reddit-new-award", (data: RedditAwardEvent) => {
      io.emit("reddit-award-received", data);
    });

    socket.on("reddit-mod-action", (data: RedditModEvent) => {
      io.to(`reddit-subreddit:${data.subredditId}`).emit(
        "reddit-mod-action-alert",
        data,
      );
    });

    socket.on("disconnect", () => {
      let disconnectedUserId: string | null = null;
      for (const [userId, user] of onlineUsers.entries()) {
        if (user.socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit("user-offline", { userId: disconnectedUserId });
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
