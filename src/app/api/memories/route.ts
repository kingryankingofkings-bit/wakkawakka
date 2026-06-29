import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// GET /api/memories — "On This Day": the current user's posts from previous
// years that share today's month/day.
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const now = new Date();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const thisYear = now.getUTCFullYear();

    // Pull this user's older posts and filter by month/day in JS (portable across DBs).
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
        createdAt: { lt: new Date(Date.UTC(thisYear, month, day)) },
      },
      include: { author: { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const memories = posts
      .filter((p: any) => {
        const d = new Date(p.createdAt);
        return d.getUTCMonth() === month && d.getUTCDate() === day;
      })
      .map((p: any) => ({ ...p, yearsAgo: thisYear - new Date(p.createdAt).getUTCFullYear() }));

    return NextResponse.json({ data: memories, meta: { total: memories.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}
