import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/reddit/posts/[id]/comments - get nested comments tree
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: postId } = params;

  try {
    const comments = await prisma.subredditComment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build hierarchical tree
    const map: Record<string, any> = {};
    const roots: any[] = [];

    comments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    comments.forEach((c) => {
      const mapped = map[c.id];
      if (c.parentId) {
        const parent = map[c.parentId];
        if (parent) {
          parent.replies.push(mapped);
        } else {
          // If parent doesn't exist (e.g. deleted), treat as root or discard
          roots.push(mapped);
        }
      } else {
        roots.push(mapped);
      }
    });

    return NextResponse.json({ data: roots });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch comments", detail: err.message },
      { status: 500 }
    );
  }
}

// POST /api/reddit/posts/[id]/comments - add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: postId } = params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const post = await prisma.subredditPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (parentId) {
      const parentComment = await prisma.subredditComment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: "Invalid parent comment ID" }, { status: 400 });
      }
    }

    if (post.isLocked) {
      return NextResponse.json({ error: "Post is locked" }, { status: 400 });
    }

    // Check if user is member (not banned/muted)
    const member = await prisma.subredditMember.findUnique({
      where: {
        subredditId_userId: {
          subredditId: post.subredditId,
          userId,
        },
      },
    });

    if (member && (member.isBanned || member.isMuted)) {
      return NextResponse.json({ error: "User is banned or muted in this subreddit" }, { status: 403 });
    }

    // Auto-flag isAMAAnswer if the post is in AMA mode and the author is the commenter
    const isAMAAnswer = !!(post.isAMA && post.authorId === userId);

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.subredditComment.create({
        data: {
          content: content.trim(),
          postId,
          parentId: parentId || null,
          authorId: userId,
          isAMAAnswer,
          score: 1, // Author automatically upvotes their comment
          upvotes: 1,
          downvotes: 0,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      // Creator automatically has vote created in RedditVote
      await tx.redditVote.create({
        data: {
          userId,
          targetId: c.id,
          type: "UPVOTE",
          targetType: "COMMENT",
        },
      });

      // Update author karma (comment creator gets 1 karma)
      await tx.user.update({
        where: { id: userId },
        data: {
          redditKarma: {
            increment: 1,
          },
        },
      });

      return c;
    });

    return NextResponse.json({ data: comment });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create comment", detail: err.message },
      { status: 500 }
    );
  }
}
