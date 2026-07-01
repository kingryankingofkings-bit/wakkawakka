import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Check if the querying user has created a DailySnap post in the last 24 hours
    const userPost = await prisma.post.findFirst({
      where: {
        authorId: userId,
        isEphemeral: true,
        btsUrl: { not: null },
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (!userPost) {
      return NextResponse.json({ feedLocked: true });
    }

    // 2. Fetch friend IDs (using Friendship model)
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });

    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    if (friendIds.length === 0) {
      return NextResponse.json({ feedLocked: false, data: [] });
    }

    // 3. Fetch blocked users (either user blocks or gets blocked by)
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

    // 4. Exclude blocked users from friend list
    const activeFriendIds = friendIds.filter((id) => !blockedUserIds.has(id));

    if (activeFriendIds.length === 0) {
      return NextResponse.json({ feedLocked: false, data: [] });
    }

    // 5. Get DailySnap posts from friends created in the last 24 hours
    const friendPosts = await prisma.post.findMany({
      where: {
        authorId: { in: activeFriendIds },
        isEphemeral: true,
        btsUrl: { not: null },
        createdAt: { gte: twentyFourHoursAgo },
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = friendPosts.map((post) => {
      let mediaUrls = [];
      try {
        mediaUrls = JSON.parse(post.mediaUrls || "[]");
      } catch {
        mediaUrls = [];
      }
      return {
        ...post,
        mediaUrls,
      };
    });

    return NextResponse.json({ feedLocked: false, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch DailySnap feed", detail: String(err) },
      { status: 500 },
    );
  }
}
