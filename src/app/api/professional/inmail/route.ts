import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/inmail - Retrieve conversations or messages
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId");

  try {
    if (conversationId) {
      // Find messages between two users. conversationId format can be "user1_user2" or just the partner's userId.
      let partnerId = conversationId;
      if (conversationId.includes("_")) {
        const parts = conversationId.split("_");
        partnerId = parts[0] === userId ? parts[1] : parts[0];
      } else if (conversationId.includes("-")) {
        const parts = conversationId.split("-");
        partnerId = parts[0] === userId ? parts[1] : parts[0];
      }

      const messages = await prisma.inMailMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Add conversationId field to each message for Zustand compatibility
      const formattedMessages = messages.map((m) => ({
        ...m,
        conversationId: [m.senderId, m.receiverId].sort().join("_"),
      }));

      return NextResponse.json({ data: formattedMessages });
    }

    // Otherwise, fetch all conversations for the user
    const allMessages = await prisma.inMailMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation
    const conversationsMap = new Map<string, any>();
    for (const msg of allMessages) {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!partner) continue;

      const convId = [msg.senderId, msg.receiverId].sort().join("_");
      if (!conversationsMap.has(convId)) {
        conversationsMap.set(convId, {
          id: convId,
          subject: msg.subject || "No Subject",
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          sender: msg.sender,
          receiver: msg.receiver,
          lastMessage: {
            ...msg,
            conversationId: convId,
          },
          unread: !msg.isRead && msg.receiverId === userId,
          createdAt: msg.createdAt,
        });
      }
    }

    return NextResponse.json({ data: Array.from(conversationsMap.values()) });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch InMails", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/inmail - Send a premium InMail
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const bodyData = await req.json();
    const { receiverId, subject, body, content } = bodyData;
    const messageContent = content || body; // Support both content and body

    if (!receiverId || !messageContent) {
      return NextResponse.json(
        { error: "receiverId and content/body are required" },
        { status: 400 }
      );
    }

    // 1. Verify premium status of sender
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, inmailQuota: true, displayName: true, username: true },
    });

    if (!sender?.isPremium) {
      return NextResponse.json(
        { error: "Premium subscription required to send InMail messages" },
        { status: 403 }
      );
    }

    // 2. Check quota
    if (sender.inmailQuota <= 0) {
      return NextResponse.json(
        { error: "Monthly InMail quota exhausted" },
        { status: 403 }
      );
    }

    // 3. Create InMailMessage and decrement quota in a transaction
    const [message] = await prisma.$transaction([
      prisma.inMailMessage.create({
        data: {
          senderId: userId,
          receiverId,
          subject: subject || "No Subject",
          content: messageContent,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { inmailQuota: { decrement: 1 } },
      }),
    ]);

    // Create DB notification for receiver
    try {
      const senderName = sender.displayName || sender.username || "Someone";
      await prisma.notification.create({
        data: {
          userId: receiverId,
          actorId: userId,
          type: "INMAIL_RECEIVED",
          message: `New InMail message from ${senderName}: "${subject || "No Subject"}"`,
          actionUrl: `/messages/inmail?convId=${[userId, receiverId].sort().join("_")}`,
          targetId: message.id,
          targetType: "INMAIL_MESSAGE",
        },
      });
    } catch (notifErr) {
      console.error("Failed to create InMail notification", notifErr);
    }

    const conversationId = [userId, receiverId].sort().join("_");

    return NextResponse.json({
      data: message, // Directly return the message object under data to satisfy E2E: "inmailMessageId = inmailData.data.id"
      conversation: {
        id: conversationId,
        subject: message.subject,
        senderId: message.senderId,
        receiverId: message.receiverId,
        sender: message.sender,
        receiver: message.receiver,
        lastMessage: {
          ...message,
          conversationId,
        },
        unread: true,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send InMail", detail: String(err) },
      { status: 500 }
    );
  }
}
