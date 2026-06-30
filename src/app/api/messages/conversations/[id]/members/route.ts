import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// POST /api/messages/conversations/[id]/members
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id: conversationId } = params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.isGroup) {
      return NextResponse.json({ error: 'Not a group conversation' }, { status: 400 });
    }

    // Check if acting user is a member of the group
    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 });
    }

    // Filter out users already in the conversation
    const existingIds = new Set(conversation.members.map((m) => m.userId));
    const toAdd = userIds.filter((uid) => uid && !existingIds.has(uid));

    if (toAdd.length > 0) {
      await prisma.conversationMember.createMany({
        data: toAdd.map((uid) => ({
          conversationId,
          userId: uid,
          isAdmin: false,
        })),
      });
    }

    // Fetch updated members with user details
    const updatedMembers = await prisma.conversationMember.findMany({
      where: { conversationId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            verificationTier: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      added: toAdd,
      members: updatedMembers.map((m) => m.user),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to add members', detail: String(err) },
      { status: 500 }
    );
  }
}
