import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// PATCH /api/communities/[id]/requests/[requestId] - approve or reject a join request
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; requestId: string } },
) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { action } = await req.json().catch(() => ({}));
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (approve/reject) is required" },
        { status: 400 },
      );
    }

    const community = await prisma.community.findUnique({
      where: { id: params.id },
    });
    if (!community)
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );

    // Verify creator/admin role
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });

    const isPrivileged =
      community.creatorId === userId ||
      (member && ["ADMIN", "MODERATOR"].includes(member.role));
    if (!isPrivileged)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const joinRequest = await prisma.communityJoinRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!joinRequest || joinRequest.communityId !== params.id) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 },
      );
    }

    if (action === "reject") {
      await prisma.communityJoinRequest.delete({
        where: { id: joinRequest.id },
      });
      return NextResponse.json({ data: { status: "REJECTED" } });
    }

    // Approve: update status, create member, increment member count
    await prisma.$transaction([
      prisma.communityJoinRequest.update({
        where: { id: joinRequest.id },
        data: { status: "APPROVED" },
      }),
      prisma.communityMember.upsert({
        where: {
          communityId_userId: {
            communityId: params.id,
            userId: joinRequest.userId,
          },
        },
        update: { role: "MEMBER" },
        create: {
          communityId: params.id,
          userId: joinRequest.userId,
          role: "MEMBER",
        },
      }),
      prisma.community.update({
        where: { id: params.id },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    try {
      await notify({
        userId: joinRequest.userId,
        actorId: userId,
        type: "COMMUNITY_INVITE",
        targetType: "COMMUNITY",
        targetId: params.id,
        message: `approved your request to join ${community.name}`,
        actionUrl: `/communities/${params.id}`,
      });
    } catch (e) {
      console.error("Failed to notify user", e);
    }

    return NextResponse.json({ data: { status: "APPROVED" } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process request", detail: String(err) },
      { status: 500 },
    );
  }
}
