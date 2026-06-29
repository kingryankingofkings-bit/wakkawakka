import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId, orderedPair } from '@/lib/currentUser';
import { notify } from '@/lib/notify';

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

// GET /api/friends/requests?box=incoming|outgoing
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const box = req.nextUrl.searchParams.get('box') ?? 'incoming';

  try {
    const where =
      box === 'outgoing'
        ? { senderId: userId, status: 'PENDING' }
        : { receiverId: userId, status: 'PENDING' };

    const requests = await prisma.friendRequest.findMany({
      where,
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data: requests, meta: { total: requests.length } });
  } catch (err) {
    return NextResponse.json({ data: [], meta: { total: 0 }, detail: String(err) });
  }
}

// POST /api/friends/requests  { receiverId, message? } — send a friend request
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { receiverId, message } = await req.json();
    if (!receiverId) return NextResponse.json({ error: 'receiverId required' }, { status: 400 });
    if (receiverId === userId) return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });

    // Already friends?
    const [a, b] = orderedPair(userId, receiverId);
    const existingFriendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });
    if (existingFriendship) return NextResponse.json({ error: 'Already friends' }, { status: 409 });

    // If the other person already sent us a request, accept it instead.
    const reciprocal = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: userId } },
    });
    if (reciprocal && reciprocal.status === 'PENDING') {
      await prisma.$transaction([
        prisma.friendRequest.update({ where: { id: reciprocal.id }, data: { status: 'ACCEPTED' } }),
        prisma.friendship.create({ data: { userAId: a, userBId: b } }),
      ]);
      await notify({ userId: receiverId, actorId: userId, type: 'FOLLOW', targetType: 'USER', targetId: userId, message: 'accepted your friend request', actionUrl: `/friends` });
      return NextResponse.json({ data: { status: 'ACCEPTED' }, message: 'You are now friends' });
    }

    const request = await prisma.friendRequest.upsert({
      where: { senderId_receiverId: { senderId: userId, receiverId } },
      update: { status: 'PENDING', message },
      create: { senderId: userId, receiverId, message, status: 'PENDING' },
    });
    await notify({ userId: receiverId, actorId: userId, type: 'FOLLOW', targetType: 'USER', targetId: userId, message: 'sent you a friend request', actionUrl: `/friends?tab=requests` });
    return NextResponse.json({ data: request }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send request', detail: String(err) }, { status: 500 });
  }
}

// PATCH /api/friends/requests  { requestId, action: 'accept'|'decline' }
export async function PATCH(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { requestId, action } = await req.json();
    if (!requestId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'requestId and valid action required' }, { status: 400 });
    }

    const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!fr) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (fr.receiverId !== userId) return NextResponse.json({ error: 'Not your request to act on' }, { status: 403 });

    if (action === 'decline') {
      await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'DECLINED' } });
      return NextResponse.json({ data: { status: 'DECLINED' } });
    }

    const [a, b] = orderedPair(fr.senderId, fr.receiverId);
    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
      prisma.friendship.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        update: {},
        create: { userAId: a, userBId: b },
      }),
    ]);
    await notify({ userId: fr.senderId, actorId: userId, type: 'FOLLOW', targetType: 'USER', targetId: userId, message: 'accepted your friend request', actionUrl: `/friends` });
    return NextResponse.json({ data: { status: 'ACCEPTED' }, message: 'You are now friends' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update request', detail: String(err) }, { status: 500 });
  }
}
