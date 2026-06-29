import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// GET /api/notifications — list current user's notifications (newest first)
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: { actor: { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return NextResponse.json({ data: items, meta: { unreadCount } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { unreadCount: 0 }, detail: String(err) });
  }
}

// PATCH /api/notifications  { id? } — mark one (or all) as read
export async function PATCH(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { id } = await req.json().catch(() => ({}));
    if (id) {
      await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
    } else {
      await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update', detail: String(err) }, { status: 500 });
  }
}
