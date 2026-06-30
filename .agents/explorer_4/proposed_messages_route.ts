import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversationId = params.id;

  try {
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: true,
        replyTo: {
          include: { sender: true }
        },
        reactions: true
      }
    });

    // Format reaction counts (group by emoji)
    const mapped = messages.map(m => {
      const reactionsRecord: Record<string, number> = {};
      m.reactions.forEach(r => {
        reactionsRecord[r.emoji] = (reactionsRecord[r.emoji] || 0) + 1;
      });

      return {
        id: m.id,
        conversationId: m.conversationId,
        sender: {
          id: m.sender.id,
          username: m.sender.username,
          displayName: m.sender.displayName,
          avatar: m.sender.avatar || undefined,
        },
        senderId: m.senderId,
        content: m.content || '',
        mediaUrl: m.mediaUrl || undefined,
        type: m.type,
        isRead: m.isRead,
        isDeleted: m.isDeleted,
        createdAt: m.createdAt.toISOString(),
        replyTo: m.replyTo ? {
          id: m.replyTo.id,
          content: m.replyTo.content || '',
          sender: {
            displayName: m.replyTo.sender.displayName
          }
        } : undefined,
        reactions: reactionsRecord
      };
    });

    // Update lastReadAt for this user
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to load messages:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversationId = params.id;

  try {
    const { content, mediaUrl, type, replyToId } = await req.json();

    // Verify membership
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        mediaUrl,
        type: type || 'TEXT',
        replyToId
      },
      include: {
        sender: true
      }
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        displayName: message.sender.displayName,
        avatar: message.sender.avatar || undefined,
      },
      senderId: message.senderId,
      content: message.content || '',
      mediaUrl: message.mediaUrl || undefined,
      type: message.type,
      isRead: false,
      isDeleted: false,
      createdAt: message.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to save message:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
