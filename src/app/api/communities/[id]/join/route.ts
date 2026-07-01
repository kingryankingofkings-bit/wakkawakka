import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// POST /api/communities/:id/join — join a public community, or request to join
// a private/restricted one.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({
      where: { id: params.id },
    });
    if (!community)
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });
    if (existing) return NextResponse.json({ data: { status: "MEMBER" } });

    if (community.visibility === "PUBLIC") {
      await prisma.$transaction([
        prisma.communityMember.create({
          data: { communityId: params.id, userId, role: "MEMBER" },
        }),
        prisma.community.update({
          where: { id: params.id },
          data: { memberCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ data: { status: "MEMBER" } });
    }

    // private / restricted -> create a pending join request
    const request = await prisma.communityJoinRequest.upsert({
      where: { communityId_userId: { communityId: params.id, userId } },
      update: { status: "PENDING" },
      create: { communityId: params.id, userId, status: "PENDING" },
    });
    await notify({
      userId: community.creatorId,
      actorId: userId,
      type: "COMMUNITY_INVITE",
      targetType: "COMMUNITY",
      targetId: params.id,
      message: `requested to join ${community.name}`,
      actionUrl: `/communities/${params.id}`,
    });
    return NextResponse.json({
      data: { status: "PENDING", requestId: request.id },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to join", detail: String(err) },
      { status: 500 },
    );
  }
}

// PATCH /api/communities/:id/join  { requestId, action: 'approve'|'reject' }
// Admin/moderator approves or rejects a pending join request.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { requestId, action } = await req.json();
    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "requestId and valid action required" },
        { status: 400 },
      );
    }

    // verify the actor is an admin/moderator of this community
    const actor = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });
    const community = await prisma.community.findUnique({
      where: { id: params.id },
    });
    const isPrivileged =
      community?.creatorId === userId ||
      (actor && ["ADMIN", "MODERATOR"].includes(actor.role));
    if (!isPrivileged)
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );

    const jr = await prisma.communityJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!jr || jr.communityId !== params.id)
      return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "reject") {
      await prisma.communityJoinRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ data: { status: "REJECTED" } });
    }

    await prisma.$transaction([
      prisma.communityJoinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      }),
      prisma.communityMember.upsert({
        where: {
          communityId_userId: { communityId: params.id, userId: jr.userId },
        },
        update: {},
        create: { communityId: params.id, userId: jr.userId, role: "MEMBER" },
      }),
      prisma.community.update({
        where: { id: params.id },
        data: { memberCount: { increment: 1 } },
      }),
    ]);
    await notify({
      userId: jr.userId,
      actorId: userId,
      type: "COMMUNITY_INVITE",
      targetType: "COMMUNITY",
      targetId: params.id,
      message: `approved your request to join ${community?.name ?? "the community"}`,
      actionUrl: `/communities/${params.id}`,
    });
    return NextResponse.json({ data: { status: "APPROVED" } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update request", detail: String(err) },
      { status: 500 },
    );
  }
}
