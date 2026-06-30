import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

async function verifyAdmin(req: NextRequest) {
  const activeUserId = getRequestUserId(req);
  if (!activeUserId) return false;
  const user = await prisma.user.findUnique({
    where: { id: activeUserId },
    select: { isAdmin: true },
  });
  return !!user?.isAdmin;
}

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        comment: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportId, status, action } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
        include: {
          post: true,
          comment: true,
        },
      });

      if (!report) {
        throw new Error('Report not found');
      }

      let resolutionText = `Status updated to ${status}`;

      if (status === 'RESOLVED') {
        if (action === 'REMOVE_CONTENT') {
          if (report.targetType === 'POST' && report.postId) {
            await tx.post.update({
              where: { id: report.postId },
              data: { isDeleted: true, deletedAt: new Date() },
            });
            resolutionText = 'Content removed (Post flagged as deleted)';
          } else if (report.targetType === 'COMMENT' && report.commentId) {
            await tx.comment.update({
              where: { id: report.commentId },
              data: { isDeleted: true, deletedAt: new Date() },
            });
            resolutionText = 'Content removed (Comment flagged as deleted)';
          }
        } else if (action === 'BAN_USER') {
          let targetUserId: string | null = null;
          if (report.targetType === 'POST' && report.post) {
            targetUserId = report.post.authorId;
          } else if (report.targetType === 'COMMENT' && report.comment) {
            targetUserId = report.comment.authorId;
          }

          if (targetUserId) {
            await tx.user.update({
              where: { id: targetUserId },
              data: {
                isBanned: true,
                bannedAt: new Date(),
                bannedReason: `Banned via report resolving: ${report.reason}`,
              },
            });
            resolutionText = `User ${targetUserId} banned`;
          }
        }
      } else if (status === 'DISMISSED') {
        resolutionText = 'Report dismissed';
      }

      return await tx.report.update({
        where: { id: reportId },
        data: {
          status,
          resolvedAt: new Date(),
          resolution: resolutionText,
        },
      });
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error updating report:', error);
    if (error.message === 'Report not found') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
