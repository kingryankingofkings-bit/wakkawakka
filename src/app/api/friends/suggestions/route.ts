import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

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

// GET /api/friends/suggestions — "People You May Know"
// Heuristic: friends-of-friends first, then popular users, excluding existing
// friends, pending requests, blocked users, and self.
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });
    const friendIds = new Set<string>();
    friendships.forEach(f => friendIds.add(f.userAId === userId ? f.userBId : f.userAId));

    // friends-of-friends
    const fof = await prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: { in: [...friendIds] } },
          { userBId: { in: [...friendIds] } },
        ],
      },
      select: { userAId: true, userBId: true },
    });
    const candidateScores = new Map<string, number>();
    fof.forEach(f => {
      [f.userAId, f.userBId].forEach(id => {
        if (id !== userId && !friendIds.has(id)) {
          candidateScores.set(id, (candidateScores.get(id) ?? 0) + 1);
        }
      });
    });

    // pending requests to exclude
    const pending = await prisma.friendRequest.findMany({
      where: {
        status: 'PENDING',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const excluded = new Set<string>([userId, ...friendIds]);
    pending.forEach(p => { excluded.add(p.senderId); excluded.add(p.receiverId); });

    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    blocks.forEach(b => { excluded.add(b.blockerId); excluded.add(b.blockedId); });

    let rankedIds = [...candidateScores.entries()]
      .filter(([id]) => !excluded.has(id))
      .sort((x, y) => y[1] - x[1])
      .map(([id]) => id)
      .slice(0, 12);

    // top up with popular users if we have few suggestions
    if (rankedIds.length < 8) {
      const popular = await prisma.user.findMany({
        where: { id: { notIn: [...excluded, ...rankedIds] }, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 12 - rankedIds.length,
        select: { id: true },
      });
      rankedIds = [...rankedIds, ...popular.map(u => u.id)];
    }

    const users = await prisma.user.findMany({
      where: { id: { in: rankedIds } },
      select: userSelect,
    });
    // preserve ranking order and attach mutual count
    const ordered = rankedIds
      .map(id => {
        const u = users.find(x => x.id === id);
        if (!u) return null;
        return { ...u, mutualFriends: candidateScores.get(id) ?? 0 };
      })
      .filter(Boolean);

    return NextResponse.json({ data: ordered, meta: { total: ordered.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}
