import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/communities/[id]/posts - list all posts in this community
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const posts = await prisma.communityPost.findMany({
      where: {
        communityId: params.id,
        isDeleted: false,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: posts });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch community posts", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/communities/[id]/posts - create a community post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    // Check if user is a member of the community
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });
    if (!member) {
      return NextResponse.json(
        { error: "You must be a member to post in this community" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { content, mediaUrls, flair } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 },
      );
    }

    const post = await prisma.$transaction(async (tx) => {
      const p = await tx.communityPost.create({
        data: {
          communityId: params.id,
          authorId: userId,
          content,
          mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : "[]",
          flair: flair || null,
        },
      });

      // Increment community postCount
      await tx.community.update({
        where: { id: params.id },
        data: { postCount: { increment: 1 } },
      });

      return p;
    });

    const populated = await prisma.communityPost.findUnique({
      where: { id: post.id },
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

    return NextResponse.json({ data: populated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create post", detail: String(err) },
      { status: 500 },
    );
  }
}
