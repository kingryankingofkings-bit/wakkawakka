import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId, orderedPair } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  bio: true,
  isVerified: true,
  verificationTier: true,
};

// GET /api/friends — list the current user's friends
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: { userA: { select: userSelect }, userB: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((f: any) => (f.userAId === userId ? f.userB : f.userA));
    return NextResponse.json({ data: friends, meta: { total: friends.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}

// DELETE /api/friends?friendId=xxx — remove a friend
export async function DELETE(req: NextRequest) {
  const userId = getRequestUserId(req);
  const friendId = req.nextUrl.searchParams.get('friendId');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!friendId) return NextResponse.json({ error: 'friendId required' }, { status: 400 });

  const [userAId, userBId] = orderedPair(userId, friendId);
  try {
    await prisma.friendship.deleteMany({ where: { userAId, userBId } });
    // also clear any lingering requests between the pair
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove friend', detail: String(err) }, { status: 500 });
  }
}
