import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const followerId = getRequestUserId(req);
  if (!followerId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const followingId = params.id;
  if (followerId === followingId) {
    return NextResponse.json(
      { error: "You cannot follow yourself" },
      { status: 400 },
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Check if blocked
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: followingId },
          { blockerId: followingId, blockedId: followerId },
        ],
      },
    });
    if (block) {
      return NextResponse.json({ error: "Action blocked" }, { status: 403 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ data: { status: "NONE" } });
    }

    const isPrivate = targetUser.isPrivate;
    const status = isPrivate ? "PENDING" : "ACCEPTED";

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
        status,
      },
    });

    // Generate follow notification
    const followerUser = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true },
    });

    await prisma.notification.create({
      data: {
        userId: followingId,
        actorId: followerId,
        type: "FOLLOW",
        message: isPrivate
          ? "requested to follow you"
          : "started following you",
        actionUrl: isPrivate
          ? `/settings`
          : `/profile/${followerUser?.username || followerId}`,
        targetId: follow.id,
        targetType: "FOLLOW",
      },
    });

    return NextResponse.json({ data: { status } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to follow user", detail: String(err) },
      { status: 500 },
    );
  }
}

// GET /api/users/[id]/follow - check follow status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const followerId = getRequestUserId(req);
  if (!followerId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const followingId = params.id;
  try {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    return NextResponse.json({
      data: { status: follow ? follow.status : "NONE" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to get follow status", detail: String(err) },
      { status: 500 },
    );
  }
}
