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
    // 1. Get user's friendships
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });

    // 2. Map to friend user IDs
    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    // 3. Retrieve streak records for friends
    const streaks = await prisma.streak.findMany({
      where: { userId: { in: friendIds } },
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

    return NextResponse.json({ data: streaks });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch friends' streaks", detail: String(err) },
      { status: 500 },
    );
  }
}
