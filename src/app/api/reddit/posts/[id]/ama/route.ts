import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

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
    const post = await prisma.subredditPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check permissions: author or mod
    const member = await prisma.subredditMember.findUnique({
      where: {
        subredditId_userId: {
          subredditId: post.subredditId,
          userId,
        },
      },
    });

    const isAuthorized =
      post.authorId === userId ||
      (member && (member.role === "MODERATOR" || member.role === "ADMIN"));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized to update AMA status" }, { status: 403 });
    }

    const body = await req.json();
    const { isAMA } = body;

    const updated = await prisma.subredditPost.update({
      where: { id: postId },
      data: {
        isAMA: !!isAMA,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update AMA status", detail: err.message },
      { status: 500 }
    );
  }
}
