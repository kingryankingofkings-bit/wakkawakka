import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // 1. Get friend IDs (using Friendship model)
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });

    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    if (friendIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Fetch blocked users (either user blocks or gets blocked by)
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const blockedUserIds = new Set<string>();
    blocks.forEach((b) => {
      blockedUserIds.add(b.blockerId);
      blockedUserIds.add(b.blockedId);
    });

    // 3. Exclude blocked users from friend list
    const activeFriendIds = friendIds.filter((id) => !blockedUserIds.has(id));

    if (activeFriendIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 4. Fetch coordinates updated in the last 24 hours where shareLocation = true
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const locations = await prisma.userLocation.findMany({
      where: {
        userId: { in: activeFriendIds },
        shareLocation: true,
        updatedAt: { gte: twentyFourHoursAgo },
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

    return NextResponse.json({ data: locations });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch friends' locations", detail: String(err) },
      { status: 500 },
    );
  }
}
