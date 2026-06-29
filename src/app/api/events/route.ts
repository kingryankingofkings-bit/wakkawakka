import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

const creatorSelect = { id: true, username: true, displayName: true, avatar: true, isVerified: true };

// GET /api/events?filter=upcoming|going|hosting|past
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  const filter = req.nextUrl.searchParams.get('filter') ?? 'upcoming';
  const now = new Date();

  try {
    let where: any = { isCancelled: false };
    if (filter === 'upcoming') where = { ...where, startsAt: { gte: now }, visibility: 'PUBLIC' };
    if (filter === 'past') where = { ...where, startsAt: { lt: now } };
    if (filter === 'hosting' && userId) where = { creatorId: userId };
    if (filter === 'going' && userId) {
      where = { ...where, attendees: { some: { userId, status: 'GOING' } } };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: { select: creatorSelect },
        attendees: { where: { userId: userId ?? '__none__' }, select: { status: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { startsAt: filter === 'past' ? 'desc' : 'asc' },
      take: 50,
    });
    return NextResponse.json({ data: events, meta: { total: events.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}

// POST /api/events — create an event
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, location, isOnline, onlineUrl, coverImage, category, startsAt, endsAt, visibility } = body;
    if (!title || !startsAt) return NextResponse.json({ error: 'title and startsAt are required' }, { status: 400 });

    const event = await prisma.event.create({
      data: {
        creatorId: userId,
        title,
        description,
        location,
        isOnline: Boolean(isOnline),
        onlineUrl,
        coverImage,
        category,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        visibility: visibility ?? 'PUBLIC',
        goingCount: 1,
        attendees: { create: { userId, status: 'GOING' } },
      },
      include: { creator: { select: creatorSelect } },
    });
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create event', detail: String(err) }, { status: 500 });
  }
}
