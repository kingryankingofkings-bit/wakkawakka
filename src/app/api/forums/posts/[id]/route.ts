import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/forum/posts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = await getRequestUserId(req);

  try {
    const post = await prisma.subforumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        subforum: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let userVote: string | null = null;
    if (userId) {
      const voteRecord = await prisma.forumVote.findUnique({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: post.id,
            targetType: "POST",
          },
        },
      });
      userVote = voteRecord ? voteRecord.type : null;
    }

    const formattedPost = {
      ...post,
      mediaUrls: JSON.parse(post.mediaUrls || "[]"),
      pollOptions: post.pollOptions ? JSON.parse(post.pollOptions) : [],
      pollVotes: post.pollVotes ? JSON.parse(post.pollVotes) : {},
    };

    return NextResponse.json({
      data: formattedPost,
      userVote,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch post details", detail: err.message },
      { status: 500 }
    );
  }
}
