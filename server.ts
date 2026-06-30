import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface OnlineUser {
  userId: string;
  socketId: string;
  lastSeen: Date;
}

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

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

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

    socket.on(
      "send-message",
      (data: {
        conversationId: string;
        message: {
          id: string;
          senderId: string;
          content: string;
          mediaUrl?: string;
          createdAt: string;
        };
      }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("new-message", data);
      },
    );

    socket.on("typing", (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing", data);
    });

    socket.on(
      "stop-typing",
      (data: { conversationId: string; userId: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("stop-typing", data);
      },
    );

    socket.on(
      "send-notification",
      (data: {
        userId: string;
        notification: {
          id: string;
          type: string;
          actorId: string;
          message: string;
          link: string;
        };
      }) => {
        io.to(`user:${data.userId}`).emit("notification", data.notification);
      },
    );

    socket.on("join-live", (streamId: string) => {
      socket.join(`live:${streamId}`);
    });

    socket.on(
      "live-comment",
      (data: { streamId: string; comment: unknown }) => {
        io.to(`live:${data.streamId}`).emit("live-comment", data.comment);
      },
    );

    socket.on("live-gift", (data: { streamId: string; gift: unknown }) => {
      io.to(`live:${data.streamId}`).emit("live-gift", data.gift);
    });

    socket.on(
      "live-prediction",
      (data: { streamId: string; event: string; prediction: any }) => {
        io.to(`live:${data.streamId}`).emit("live-prediction", data);
      },
    );

    socket.on(
      "live-raid",
      (data: {
        streamId: string;
        targetStreamId: string;
        targetUsername: string;
      }) => {
        io.to(`live:${data.streamId}`).emit("live-raid", data);
      },
    );

    socket.on("live-cohost", (data: { streamId: string; coHosts: any }) => {
      io.to(`live:${data.streamId}`).emit("live-cohost", data);
    });

    socket.on("join-audio-room", (data: any) => {
      const roomId = typeof data === "string" ? data : data?.roomId;
      if (roomId) {
        socket.join(`audio:${roomId}`);
      }
    });

    socket.on("leave-audio-room", (data: any) => {
      const roomId = typeof data === "string" ? data : data?.roomId;
      if (roomId) {
        socket.leave(`audio:${roomId}`);
      }
    });

    socket.on("audio-join", (data: { roomId: string; userId: string; user: any; isSpeaker: boolean }) => {
      socket.to(`audio:${data.roomId}`).emit("audio-user-joined", data);
    });

    socket.on("audio-leave", (data: { roomId: string; userId: string }) => {
      socket.to(`audio:${data.roomId}`).emit("audio-user-left", data);
    });

    socket.on("audio-state-update", (data: { roomId: string; userId: string; isMuted?: boolean; handRaised?: boolean; isSpeaker?: boolean }) => {
      socket.to(`audio:${data.roomId}`).emit("audio-state-changed", data);
    });

    socket.on(
      "audio-speak",
      (data: { roomId: string; userId: string; isSpeaking: boolean }) => {
        socket.to(`audio:${data.roomId}`).emit("audio-speak", data);
      },
    );

    // =========================================================================
    // BATCH 7: SERVER/CHANNEL REALTIME HANDLERS
    // =========================================================================

    // Server Spaces
    socket.on("join-server", (serverId: string) => {
      socket.join(`server:${serverId}`);
    });
    socket.on("leave-server", (serverId: string) => {
      socket.leave(`server:${serverId}`);
    });

    // Channels & Messages
    socket.on("join-server-channel", (channelId: string) => {
      socket.join(`server-channel:${channelId}`);
    });
    socket.on("leave-server-channel", (channelId: string) => {
      socket.leave(`server-channel:${channelId}`);
    });
    socket.on("send-server-message", (data: any) => {
      socket
        .to(`server-channel:${data.channelId}`)
        .emit("new-server-message", data.message);
    });
    socket.on("delete-server-message", (data: any) => {
      socket
        .to(`server-channel:${data.channelId}`)
        .emit("server-message-deleted", data.messageId);
    });
    socket.on("server-typing", (data: any) => {
      socket.to(`server-channel:${data.channelId}`).emit("server-typing", data);
    });
    socket.on("server-stop-typing", (data: any) => {
      socket
        .to(`server-channel:${data.channelId}`)
        .emit("server-stop-typing", data);
    });

    // Voice States
    socket.on("join-voice", (data: any) => {
      socket.join(`voice:${data.channelId}`);
      socket
        .to(`voice:${data.channelId}`)
        .emit("voice-user-joined", { userId: data.userId });
    });
    socket.on("leave-voice", (data: any) => {
      socket.leave(`voice:${data.channelId}`);
      socket
        .to(`voice:${data.channelId}`)
        .emit("voice-user-left", { userId: data.userId });
    });
    socket.on("voice-state-update", (data: any) => {
      socket
        .to(`voice:${data.channelId}`)
        .emit("voice-user-state-changed", data);
    });
    socket.on("play-soundboard", (data: any) => {
      socket.to(`voice:${data.channelId}`).emit("soundboard-played", data);
    });

    // Stage Coordination
    socket.on("join-stage", (data: any) => {
      socket.join(`stage:${data.channelId}`);
      socket.to(`stage:${data.channelId}`).emit("stage-user-joined", data);
    });
    socket.on("stage-request-speak", (data: any) => {
      socket
        .to(`stage:${data.channelId}`)
        .emit("stage-user-requested", data.userId);
    });
    socket.on("stage-moderate-speaker", (data: any) => {
      socket.to(`stage:${data.channelId}`).emit("stage-speaker-action", data);
    });

    // =========================================================================
    // BATCH 8: PROFESSIONAL & JOBS REALTIME HANDLERS (InMail & Notifications)
    // =========================================================================

    // InMail Conversation Join/Leave
    socket.on("join-inmail-conversation", (inMailConversationId: string) => {
      socket.join(`inmail:${inMailConversationId}`);
      console.log(`Socket ${socket.id} joined InMail room inmail:${inMailConversationId}`);
    });

    socket.on("leave-inmail-conversation", (inMailConversationId: string) => {
      socket.leave(`inmail:${inMailConversationId}`);
      console.log(`Socket ${socket.id} left InMail room inmail:${inMailConversationId}`);
    });

    // Send InMail Message
    socket.on(
      "send-inmail-message",
      (data: {
        inMailConversationId: string;
        message: {
          id: string;
          senderId: string;
          receiverId: string;
          subject?: string;
          content: string;
          createdAt: string;
        };
      }) => {
        socket.to(`inmail:${data.inMailConversationId}`).emit("new-inmail-message", data.message);
      }
    );

    // InMail Typing Indicators
    socket.on("inmail-typing", (data: { inMailConversationId: string; userId: string }) => {
      socket.to(`inmail:${data.inMailConversationId}`).emit("inmail-typing", data);
    });

    socket.on("inmail-stop-typing", (data: { inMailConversationId: string; userId: string }) => {
      socket.to(`inmail:${data.inMailConversationId}`).emit("inmail-stop-typing", data);
    });

    // =========================================================================
    // BATCH 9: REDDIT-STYLE FORUM REALTIME HANDLERS
    // =========================================================================
    socket.on("join-reddit-post", (postId: string) => {
      socket.join(`reddit-post:${postId}`);
      console.log(`Socket ${socket.id} joined reddit-post:${postId}`);
    });

    socket.on("leave-reddit-post", (postId: string) => {
      socket.leave(`reddit-post:${postId}`);
      console.log(`Socket ${socket.id} left reddit-post:${postId}`);
    });

    socket.on("join-reddit-subreddit", (subredditId: string) => {
      socket.join(`reddit-subreddit:${subredditId}`);
      console.log(`Socket ${socket.id} joined reddit-subreddit:${subredditId}`);
    });

    socket.on("leave-reddit-subreddit", (subredditId: string) => {
      socket.leave(`reddit-subreddit:${subredditId}`);
      console.log(`Socket ${socket.id} left reddit-subreddit:${subredditId}`);
    });

    socket.on("reddit-new-vote", (data: { targetId: string; targetType: string; score: number; upvotes: number; downvotes: number; userKarma?: number; userId?: string }) => {
      io.emit("reddit-vote-updated", data);
    });

    socket.on("reddit-new-comment", (data: { postId: string; comment: any }) => {
      io.to(`reddit-post:${data.postId}`).emit("reddit-comment-received", data.comment);
    });

    socket.on("reddit-new-award", (data: { targetId: string; targetType: string; award: any }) => {
      io.emit("reddit-award-received", data);
    });

    socket.on("reddit-mod-action", (data: { subredditId: string; action: string; targetUserId?: string; targetPostId?: string; targetCommentId?: string; reason?: string }) => {
      io.to(`reddit-subreddit:${data.subredditId}`).emit("reddit-mod-action-alert", data);
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
      console.log(`Socket disconnected: ${socket.id}`);
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
