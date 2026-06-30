import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/events/[id]/attendees - list all attendees and their RSVP status
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: params.id },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ data: attendees });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch attendees', detail: String(err) }, { status: 500 });
  }
}
