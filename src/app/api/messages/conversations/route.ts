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

// GET /api/messages/conversations
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
            user: {
              select: userSelect,
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: userSelect,
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const mapped = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = c.messages[0] || null;

        // Calculate unread count for this user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          id: c.id,
          name: c.name,
          isGroup: c.isGroup,
          avatarUrl: c.avatarUrl,
          members: c.members.map((m) => m.user),
          admins: c.members.filter((m) => m.isAdmin).map((m) => m.user),
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                conversationId: lastMsg.conversationId,
                senderId: lastMsg.senderId,
                sender: lastMsg.sender,
                content: lastMsg.content || "",
                mediaUrl: lastMsg.mediaUrl || undefined,
                type: lastMsg.type,
                isRead: lastMsg.isRead,
                isDeleted: lastMsg.isDeleted,
                createdAt: lastMsg.createdAt.toISOString(),
              }
            : undefined,
          unreadCount,
          createdAt: c.createdAt.toISOString(),
        };
      }),
    );

    return NextResponse.json({ data: mapped });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch conversations", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/messages/conversations
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { isGroup, name, avatarUrl, targetUserId, participantIds } = body;

    if (!isGroup) {
      // 1-to-1 chat
      const targetId = targetUserId || (participantIds && participantIds[0]);
      if (!targetId) {
        return NextResponse.json(
          { error: "targetUserId or participantIds required" },
          { status: 400 },
        );
      }

      // Check if conversation already exists to avoid duplicates
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: targetId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
        },
      });

      if (existing) {
        return NextResponse.json({
          data: {
            id: existing.id,
            name: existing.name,
            isGroup: existing.isGroup,
            avatarUrl: existing.avatarUrl,
            members: existing.members.map((m) => m.user),
            admins: existing.members
              .filter((m) => m.isAdmin)
              .map((m) => m.user),
            unreadCount: 0,
            createdAt: existing.createdAt.toISOString(),
          },
        });
      }

      // Create new 1-to-1 conversation
      const newConv = await prisma.conversation.create({
        data: {
          isGroup: false,
          lastMessageAt: new Date(),
          members: {
            create: [{ userId }, { userId: targetId }],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
        },
      });

      return NextResponse.json({
        data: {
          id: newConv.id,
          name: newConv.name,
          isGroup: newConv.isGroup,
          avatarUrl: newConv.avatarUrl,
          members: newConv.members.map((m) => m.user),
          admins: newConv.members.filter((m) => m.isAdmin).map((m) => m.user),
          unreadCount: 0,
          createdAt: newConv.createdAt.toISOString(),
        },
      });
    } else {
      // Group chat
      if (!name) {
        return NextResponse.json(
          { error: "Group name required" },
          { status: 400 },
        );
      }

      const memberIds: string[] = participantIds || [];
      const allMembers = Array.from(new Set([userId, ...memberIds]));

      const newConv = await prisma.conversation.create({
        data: {
          isGroup: true,
          name,
          avatarUrl,
          createdById: userId,
          lastMessageAt: new Date(),
          members: {
            create: allMembers.map((mid) => ({
              userId: mid,
              isAdmin: mid === userId,
            })),
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
        },
      });

      return NextResponse.json({
        data: {
          id: newConv.id,
          name: newConv.name,
          isGroup: newConv.isGroup,
          avatarUrl: newConv.avatarUrl,
          members: newConv.members.map((m) => m.user),
          admins: newConv.members.filter((m) => m.isAdmin).map((m) => m.user),
          unreadCount: 0,
          createdAt: newConv.createdAt.toISOString(),
        },
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create conversation", detail: String(err) },
      { status: 500 },
    );
  }
}
