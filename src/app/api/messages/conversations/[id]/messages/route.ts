import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  isVerified: true,
  verificationTier: true,
};

// GET /api/messages/conversations/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: conversationId } = params;

  try {
    // Verify membership
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: userSelect,
        },
        replyTo: {
          include: {
            sender: {
              select: userSelect,
            },
          },
        },
        reactions: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const mapped = messages.map((m) => {
      // Build reactions record
      const reactionsRecord: Record<string, number> = {};
      m.reactions.forEach((r) => {
        reactionsRecord[r.emoji] = (reactionsRecord[r.emoji] || 0) + 1;
      });

      // Determine mediaType
      let mediaType: "image" | "video" | "audio" | "file" | undefined =
        undefined;
      const typeLower = m.type.toLowerCase();
      if (["image", "video", "audio", "file"].includes(typeLower)) {
        mediaType = typeLower as any;
      } else if (m.type === "VOICE") {
        mediaType = "audio";
      }

      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        sender: m.sender,
        content: m.content || "",
        mediaUrl: m.mediaUrl || undefined,
        mediaType,
        type: m.type,
        isRead: m.isRead,
        isDeleted: m.isDeleted,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              conversationId: m.replyTo.conversationId,
              senderId: m.replyTo.senderId,
              sender: m.replyTo.sender,
              content: m.replyTo.content || "",
              mediaUrl: m.replyTo.mediaUrl || undefined,
              type: m.replyTo.type,
              isRead: m.replyTo.isRead,
              isDeleted: m.replyTo.isDeleted,
              createdAt: m.replyTo.createdAt.toISOString(),
            }
          : undefined,
        reactions: reactionsRecord,
        createdAt: m.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ data: mapped });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch messages", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/messages/conversations/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: conversationId } = params;

  try {
    // Verify membership
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { content, mediaUrl, mediaType, type, replyToId } = body;

    // Determine type in database
    let dbType = type || "TEXT";
    if (mediaType && !type) {
      dbType = mediaType.toUpperCase();
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || null,
        mediaUrl: mediaUrl || null,
        type: dbType,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: userSelect,
        },
        replyTo: {
          include: {
            sender: {
              select: userSelect,
            },
          },
        },
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Map response
    let resMediaType: "image" | "video" | "audio" | "file" | undefined =
      undefined;
    const typeLower = newMessage.type.toLowerCase();
    if (["image", "video", "audio", "file"].includes(typeLower)) {
      resMediaType = typeLower as any;
    } else if (newMessage.type === "VOICE") {
      resMediaType = "audio";
    }

    const mapped = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      sender: newMessage.sender,
      content: newMessage.content || "",
      mediaUrl: newMessage.mediaUrl || undefined,
      mediaType: resMediaType,
      type: newMessage.type,
      isRead: newMessage.isRead,
      isDeleted: newMessage.isDeleted,
      replyTo: newMessage.replyTo
        ? {
            id: newMessage.replyTo.id,
            conversationId: newMessage.replyTo.conversationId,
            senderId: newMessage.replyTo.senderId,
            sender: newMessage.replyTo.sender,
            content: newMessage.replyTo.content || "",
            mediaUrl: newMessage.replyTo.mediaUrl || undefined,
            type: newMessage.replyTo.type,
            isRead: newMessage.replyTo.isRead,
            isDeleted: newMessage.replyTo.isDeleted,
            createdAt: newMessage.replyTo.createdAt.toISOString(),
          }
        : undefined,
      reactions: {},
      createdAt: newMessage.createdAt.toISOString(),
    };

    return NextResponse.json({ data: mapped });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save message", detail: String(err) },
      { status: 500 },
    );
  }
}
