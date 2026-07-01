import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: postId } = params;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        author: true,
        replies: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc", // newer root comments first or asc? Let's check how mock generated.
      },
    });

    const data = comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      author: comment.author,
      authorId: comment.authorId,
      parentId: comment.parentId || undefined,
      content: comment.content,
      likesCount: comment.likesCount,
      userLiked: false,
      createdAt: comment.createdAt.toISOString(),
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        postId: reply.postId,
        author: reply.author,
        authorId: reply.authorId,
        parentId: reply.parentId || undefined,
        content: reply.content,
        likesCount: reply.likesCount,
        userLiked: false,
        createdAt: reply.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: postId } = params;
    const activeUserId = await getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    const newComment = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId,
          authorId: activeUserId,
          parentId: body.parentId || null,
          content: body.content.trim(),
        },
        include: {
          author: true,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentsCount: { increment: 1 },
        },
      });

      return comment;
    });

    const data = {
      id: newComment.id,
      postId: newComment.postId,
      author: newComment.author,
      authorId: newComment.authorId,
      parentId: newComment.parentId || undefined,
      content: newComment.content,
      likesCount: newComment.likesCount,
      userLiked: false,
      replies: [],
      createdAt: newComment.createdAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
