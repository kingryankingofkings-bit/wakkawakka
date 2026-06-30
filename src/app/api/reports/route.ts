import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export async function POST(req: NextRequest) {
  try {
    const activeUserId = getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { targetId, targetType, reason, description } = body;

    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let postId: string | null = null;
    let commentId: string | null = null;

    if (targetType === 'POST') {
      postId = targetId;
    } else if (targetType === 'COMMENT') {
      commentId = targetId;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: activeUserId,
        targetId,
        targetType,
        reason,
        description: description || null,
        postId,
        commentId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
