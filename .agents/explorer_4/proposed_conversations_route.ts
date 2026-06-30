import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const mapped = conversations.map((c) => {
      const lastMsg = c.messages[0];
      const memberRecord = c.members.find((m) => m.userId === userId);

      // Calculate unread count (messages sent after lastReadAt)
      let unreadCount = 0;
      if (memberRecord && memberRecord.lastReadAt) {
        unreadCount = c.messages.filter(
          (m) =>
            m.createdAt > memberRecord.lastReadAt! && m.senderId !== userId,
        ).length;
      } else if (memberRecord) {
        unreadCount = c.messages.filter((m) => m.senderId !== userId).length;
      }

      return {
        id: c.id,
        name: c.name,
        isGroup: c.isGroup,
        avatarUrl: c.avatarUrl,
        members: c.members.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          displayName: m.user.displayName,
          avatar: m.user.avatar || undefined,
        })),
        admins: c.members
          .filter((m) => m.isAdmin)
          .map((m) => ({
            id: m.user.id,
            username: m.user.username,
            displayName: m.user.displayName,
          })),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              sender: {
                id: lastMsg.sender.id,
                username: lastMsg.sender.username,
                displayName: lastMsg.sender.displayName,
                avatar: lastMsg.sender.avatar || undefined,
              },
              senderId: lastMsg.senderId,
              content: lastMsg.content || "",
              mediaUrl: lastMsg.mediaUrl || undefined,
              createdAt: lastMsg.createdAt.toISOString(),
              isRead: lastMsg.isRead,
              isDeleted: lastMsg.isDeleted,
            }
          : undefined,
        unreadCount,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, isGroup, memberIds, avatarUrl } = await req.json();

    if (!isGroup && memberIds.length === 1) {
      const otherUserId = memberIds[0];
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: otherUserId } } },
          ],
        },
        include: {
          members: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true },
          },
        },
      });

      if (existing) {
        return NextResponse.json({
          id: existing.id,
          name: existing.name,
          isGroup: existing.isGroup,
          avatarUrl: existing.avatarUrl,
          members: existing.members.map((m) => m.user),
          unreadCount: 0,
          createdAt: existing.createdAt.toISOString(),
        });
      }
    }

    const allMembers = Array.from(new Set([userId, ...memberIds]));
    const conv = await prisma.conversation.create({
      data: {
        name: isGroup ? name || "Group Chat" : null,
        isGroup,
        avatarUrl,
        createdById: userId,
        lastMessageAt: new Date(),
        members: {
          create: allMembers.map((mId) => ({
            userId: mId,
            isAdmin: mId === userId,
          })),
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({
      id: conv.id,
      name: conv.name,
      isGroup: conv.isGroup,
      avatarUrl: conv.avatarUrl,
      members: conv.members.map((m) => m.user),
      unreadCount: 0,
      createdAt: conv.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
