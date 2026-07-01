import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;
  const requesterId = await getRequestUserId(req);

  if (!requesterId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: { coHosts: true },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const body = await req.json();
    const { userId, action } = body; // action: INVITE | ACCEPT | REJECT | LEAVE

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!targetUser) {
        return NextResponse.json(
          { error: "User does not exist" },
          { status: 400 },
        );
      }
    }

    if (action === "INVITE") {
      if (stream.hostId !== requesterId) {
        return NextResponse.json(
          { error: "Only the host can invite co-hosts" },
          { status: 403 },
        );
      }
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 },
        );
      }

      // Create or get cohost as PENDING
      const coHost = await prisma.liveStreamCoHost.upsert({
        where: {
          liveStreamId_userId: { liveStreamId: streamId, userId },
        },
        create: {
          liveStreamId: streamId,
          userId,
          status: "PENDING",
        },
        update: {
          status: "PENDING",
        },
      });

      return NextResponse.json({
        coHost,
        message: "Co-host invited/added successfully",
      });
    }

    if (action === "ACCEPT") {
      const targetUserId = userId || requesterId;

      if (targetUserId !== requesterId) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Cannot accept invitation on behalf of someone else",
          },
          { status: 403 },
        );
      }

      // Find the existing pending invitation
      const existingInvitation = await prisma.liveStreamCoHost.findUnique({
        where: {
          liveStreamId_userId: { liveStreamId: streamId, userId: targetUserId },
        },
      });

      if (!existingInvitation) {
        return NextResponse.json(
          { error: "No invitation found for this user" },
          { status: 400 },
        );
      }

      if (existingInvitation.status !== "PENDING") {
        return NextResponse.json(
          { error: "Invitation already accepted or invalid" },
          { status: 400 },
        );
      }

      // Update record to indicate accepted status
      const coHost = await prisma.liveStreamCoHost.update({
        where: {
          liveStreamId_userId: { liveStreamId: streamId, userId: targetUserId },
        },
        data: {
          status: "ACCEPTED",
        },
      });
      return NextResponse.json({
        coHost,
        message: "Co-host invitation accepted",
      });
    }

    if (action === "LEAVE" || action === "REJECT") {
      const targetUserId = userId || requesterId;
      if (stream.hostId !== requesterId && targetUserId !== requesterId) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 },
        );
      }

      await prisma.liveStreamCoHost.deleteMany({
        where: {
          liveStreamId: streamId,
          userId: targetUserId,
        },
      });

      return NextResponse.json({ message: "Co-host removed successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
