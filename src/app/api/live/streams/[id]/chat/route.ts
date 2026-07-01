import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/live/streams/[id]/chat - Retrieve chat history
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;
  try {
    let comments = await prisma.liveStreamChatMessage.findMany({
      where: { liveStreamId: streamId },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (comments.length === 0) {
      comments = [
        {
          id: "c_seed_1",
          liveStreamId: streamId,
          userId: "system",
          message: "Welcome to the chat room! Play nice.",
          type: "COMMENT",
          giftAmount: null,
          createdAt: new Date(Date.now() - 60000),
          user: {
            id: "system",
            displayName: "System",
            username: "system",
            avatar: null,
          },
        } as any,
      ];
    }

    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/live/streams/[id]/chat - Send comment or run chat command (/raid, /host)
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;
  const userId = await getRequestUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatar: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }

    const trimmedMsg = message.trim();

    // Check for Host Commands (/raid [username] or /host [username])
    if (trimmedMsg.startsWith("/")) {
      if (stream.hostId !== userId) {
        return NextResponse.json(
          { error: "Only the host can issue chat commands" },
          { status: 403 },
        );
      }

      if (trimmedMsg.startsWith("/raid ")) {
        const targetUsername = trimmedMsg.replace("/raid ", "").trim();
        const targetUser = await prisma.user.findUnique({
          where: { username: targetUsername },
        });

        if (!targetUser) {
          return NextResponse.json(
            { error: `User "${targetUsername}" not found` },
            { status: 404 },
          );
        }

        const targetStream = await prisma.liveStream.findFirst({
          where: { hostId: targetUser.id, isActive: true },
        });

        if (!targetStream) {
          return NextResponse.json(
            { error: `User "${targetUsername}" is not currently live` },
            { status: 400 },
          );
        }

        // Transfer viewer count
        const viewersToTransfer = stream.viewerCount;

        await prisma.liveStream.update({
          where: { id: targetStream.id },
          data: {
            viewerCount: {
              increment: viewersToTransfer,
            },
          },
        });

        await prisma.liveStream.update({
          where: { id: streamId },
          data: {
            viewerCount: 0,
          },
        });

        // Add system message to target stream in database
        await prisma.liveStreamChatMessage.create({
          data: {
            liveStreamId: targetStream.id,
            userId: user.id,
            message: `${user.displayName} is raiding with ${viewersToTransfer} viewers!`,
            type: "SYSTEM",
          },
        });

        return NextResponse.json({
          command: "RAID",
          targetStreamId: targetStream.id,
          targetUsername: targetUser.username,
          viewersCount: viewersToTransfer,
          message: `Raid to ${targetUser.displayName} initiated!`,
        });
      }

      if (trimmedMsg.startsWith("/host ")) {
        const targetUsername = trimmedMsg.replace("/host ", "").trim();
        const targetUser = await prisma.user.findUnique({
          where: { username: targetUsername },
        });

        if (!targetUser) {
          return NextResponse.json(
            { error: `User "${targetUsername}" not found` },
            { status: 404 },
          );
        }

        const targetStream = await prisma.liveStream.findFirst({
          where: { hostId: targetUser.id, isActive: true },
        });

        if (!targetStream) {
          return NextResponse.json(
            { error: `User "${targetUsername}" is not currently live` },
            { status: 400 },
          );
        }

        return NextResponse.json({
          command: "HOST",
          targetStreamId: targetStream.id,
          targetUsername: targetUser.username,
          message: `Hosting ${targetUser.displayName}'s stream!`,
        });
      }
    }

    // Process regular chat comments
    const comment = await prisma.liveStreamChatMessage.create({
      data: {
        liveStreamId: streamId,
        userId: user.id,
        message: trimmedMsg,
        type: "COMMENT",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
