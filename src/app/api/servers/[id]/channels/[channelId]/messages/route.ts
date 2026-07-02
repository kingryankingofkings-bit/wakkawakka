import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; channelId: string }>;
}

// GET /api/servers/[id]/channels/[channelId]/messages - Fetch messages
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: _serverId, channelId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const where: any = { channelId };

    const messages = await prisma.serverMessage.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Return messages in chronological order for display
    const chronologicalMessages = [...messages].reverse();

    return NextResponse.json({
      data: chronologicalMessages,
      messages: chronologicalMessages,
      nextCursor:
        messages.length === limit ? messages[messages.length - 1].id : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch messages", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/channels/[channelId]/messages - Send a message
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, channelId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify membership
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this server" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { content, attachments, replyToId } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Message content or attachment is required" },
        { status: 400 },
      );
    }

    const message = await prisma.serverMessage.create({
      data: {
        serverId,
        channelId,
        senderId: userId,
        memberId: member.id,
        content: content || null,
        attachments: attachments ? JSON.stringify(attachments) : "[]",
        replyToId: replyToId || null,
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
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: message, message });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send message", detail: String(err) },
      { status: 500 },
    );
  }
}
