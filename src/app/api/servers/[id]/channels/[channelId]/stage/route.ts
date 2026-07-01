import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; channelId: string }>;
}

// GET /api/servers/[id]/channels/[channelId]/stage - Fetch stage details
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { channelId } = await params;

  try {
    const stageUsers = await prisma.serverChannelStageSpeaker.findMany({
      where: { channelId },
      include: {
        member: {
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
        },
      },
    });

    const speakers = stageUsers
      .filter((u) => u.isApproved)
      .map((u) => u.member);
    const requestedToSpeak = stageUsers
      .filter((u) => u.isRequested && !u.isApproved)
      .map((u) => u.member);
    const listeners = stageUsers
      .filter((u) => !u.isRequested && !u.isApproved)
      .map((u) => u.member);

    return NextResponse.json({
      data: {
        speakers,
        requestedToSpeak,
        listeners,
      },
      speakers,
      requestedToSpeak,
      listeners,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch stage details", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/channels/[channelId]/stage - Manage speaker requests
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, channelId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get member record of caller
    const callerMember = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });

    if (!callerMember) {
      return NextResponse.json(
        { error: "Not a member of this server" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { action, targetMemberId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    if (action === "REQUEST_TO_SPEAK") {
      // Upsert record for caller
      const record = await prisma.serverChannelStageSpeaker.upsert({
        where: { id: `${channelId}_${callerMember.id}` }, // We can construct a predictable id or look it up first
        create: {
          id: `${channelId}_${callerMember.id}`,
          channelId,
          memberId: callerMember.id,
          isRequested: true,
          isApproved: false,
        },
        update: {
          isRequested: true,
          isApproved: false,
        },
      });
      return NextResponse.json({ data: record, record });
    }

    if (action === "APPROVE_SPEAKER") {
      // Requires MUTE_MEMBERS or ADMIN
      const hasPerm = await checkPermission(userId, serverId, "MUTE_MEMBERS");
      if (!hasPerm) {
        return NextResponse.json(
          { error: "Forbidden. Requires moderator permissions." },
          { status: 403 },
        );
      }

      if (!targetMemberId) {
        return NextResponse.json(
          { error: "targetMemberId is required for APPROVE_SPEAKER" },
          { status: 400 },
        );
      }

      const record = await prisma.serverChannelStageSpeaker.upsert({
        where: { id: `${channelId}_${targetMemberId}` },
        create: {
          id: `${channelId}_${targetMemberId}`,
          channelId,
          memberId: targetMemberId,
          isRequested: false,
          isApproved: true,
        },
        update: {
          isRequested: false,
          isApproved: true,
        },
      });
      return NextResponse.json({ data: record, record });
    }

    if (action === "MUTE_SPEAKER") {
      // Check if self or moderator
      const isSelf = targetMemberId ? targetMemberId === callerMember.id : true;
      const hasPerm = await checkPermission(userId, serverId, "MUTE_MEMBERS");
      if (!isSelf && !hasPerm) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const targetId = targetMemberId || callerMember.id;
      const record = await prisma.serverChannelStageSpeaker.update({
        where: { id: `${channelId}_${targetId}` },
        data: { isSpeaking: false },
      });
      return NextResponse.json({ data: record, record });
    }

    if (action === "LEAVE_STAGE") {
      const targetId = targetMemberId || callerMember.id;
      // Check if self or moderator
      const isSelf = targetId === callerMember.id;
      const hasPerm = await checkPermission(userId, serverId, "MUTE_MEMBERS");
      if (!isSelf && !hasPerm) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await prisma.serverChannelStageSpeaker.delete({
        where: { id: `${channelId}_${targetId}` },
      });

      return NextResponse.json({ data: { success: true }, success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to manage stage status", detail: String(err) },
      { status: 500 },
    );
  }
}
