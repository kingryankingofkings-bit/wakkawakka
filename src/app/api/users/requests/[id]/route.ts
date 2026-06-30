import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// PATCH /api/users/requests/[id] - approve or reject a follow request
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.status === 'ACCEPTED' ? 'approve' : body.status === 'REJECTED' ? 'reject' : null);

    if (!action || !['approve', 'reject', 'accept'].includes(action)) {
      return NextResponse.json({ error: 'Valid action (approve/reject) is required' }, { status: 400 });
    }

    // Try to find the follow request by Follow.id or by followerId + followingId
    let follow = await prisma.follow.findFirst({
      where: {
        OR: [
          { id: params.id, followingId: userId },
          { followerId: params.id, followingId: userId },
        ],
      },
    });

    if (!follow) {
      return NextResponse.json({ error: 'Follow request not found' }, { status: 404 });
    }

    if (action === 'approve' || action === 'accept') {
      const updated = await prisma.follow.update({
        where: { id: follow.id },
        data: { status: 'ACCEPTED' },
      });
      return NextResponse.json({ data: updated });
    } else {
      // reject / delete the record
      await prisma.follow.delete({
        where: { id: follow.id },
      });
      return NextResponse.json({ success: true, message: 'Request rejected' });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update follow request', detail: String(err) }, { status: 500 });
  }
}
