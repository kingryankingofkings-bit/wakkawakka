import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

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
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-user', (userId: string) => {
      socket.join(`user:${userId}`);
      onlineUsers.set(userId, { userId, socketId: socket.id, lastSeen: new Date() });
      io.emit('user-online', { userId, onlineUsers: Array.from(onlineUsers.keys()) });
    });

    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('send-message', (data: {
      conversationId: string;
      message: {
        id: string;
        senderId: string;
        content: string;
        mediaUrl?: string;
        createdAt: string;
      };
    }) => {
      socket.to(`conversation:${data.conversationId}`).emit('new-message', data);
    });

    socket.on('typing', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing', data);
    });

    socket.on('stop-typing', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('stop-typing', data);
    });

    socket.on('send-notification', (data: {
      userId: string;
      notification: {
        id: string;
        type: string;
        actorId: string;
        message: string;
        link: string;
      };
    }) => {
      io.to(`user:${data.userId}`).emit('notification', data.notification);
    });

    socket.on('join-live', (streamId: string) => {
      socket.join(`live:${streamId}`);
    });

    socket.on('live-comment', (data: { streamId: string; comment: unknown }) => {
      io.to(`live:${data.streamId}`).emit('live-comment', data.comment);
    });

    socket.on('live-gift', (data: { streamId: string; gift: unknown }) => {
      io.to(`live:${data.streamId}`).emit('live-gift', data.gift);
    });

    socket.on('join-audio-room', (roomId: string) => {
      socket.join(`audio:${roomId}`);
    });

    socket.on('audio-speak', (data: { roomId: string; userId: string; isSpeaking: boolean }) => {
      socket.to(`audio:${data.roomId}`).emit('audio-speak', data);
    });

    socket.on('disconnect', () => {
      let disconnectedUserId: string | null = null;
      for (const [userId, user] of onlineUsers.entries()) {
        if (user.socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit('user-offline', { userId: disconnectedUserId });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
