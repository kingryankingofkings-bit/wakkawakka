import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// POST /api/users/[id]/block - block a user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const blockerId = await getRequestUserId(req);
  if (!blockerId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const blockedId = params.id;
  if (blockerId === blockedId) {
    return NextResponse.json(
      { error: "You cannot block yourself" },
      { status: 400 },
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (existingBlock) {
      return NextResponse.json({
        message: "User is already blocked",
        data: { blocked: true },
      });
    }

    // Write record to Block table and delete follow connections in both directions
    await prisma.$transaction([
      prisma.block.create({
        data: { blockerId, blockedId },
      }),
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      }),
      // also clear friendships / friend requests just to be clean
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userAId: blockerId, userBId: blockedId },
            { userAId: blockedId, userBId: blockerId },
          ],
        },
      }),
      prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
      }),
    ]);

    return NextResponse.json({ data: { blocked: true } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to block user", detail: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id]/block - unblock a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const blockerId = await getRequestUserId(req);
  if (!blockerId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const blockedId = params.id;
  try {
    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (!existingBlock) {
      return NextResponse.json({
        message: "User is not blocked",
        data: { blocked: false },
      });
    }

    await prisma.block.delete({
      where: { id: existingBlock.id },
    });

    return NextResponse.json({ data: { blocked: false } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to unblock user", detail: String(err) },
      { status: 500 },
    );
  }
}

// GET /api/users/[id]/block - check if user is blocked
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const blockerId = await getRequestUserId(req);
  if (!blockerId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const blockedId = params.id;
  try {
    const block = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    return NextResponse.json({ data: { blocked: !!block } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to check block status", detail: String(err) },
      { status: 500 },
    );
  }
}
