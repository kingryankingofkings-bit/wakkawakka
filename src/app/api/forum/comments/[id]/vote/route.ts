import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: commentId } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type } = body; // "UPVOTE" | "DOWNVOTE" | null (clear)

    if (type === undefined) {
      return NextResponse.json({ error: "Vote type is required" }, { status: 400 });
    }

    if (type !== "UPVOTE" && type !== "DOWNVOTE" && type !== null) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    const comment = await prisma.subforumComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find existing vote
      const existingVote = await tx.forumVote.findUnique({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: commentId,
            targetType: "COMMENT",
          },
        },
      });

      let scoreDelta = 0;
      let upvoteDelta = 0;
      let downvoteDelta = 0;
      let karmaDelta = 0;

      const previousType = existingVote ? existingVote.type : null;

      if (type === "UPVOTE") {
        if (previousType === "DOWNVOTE") {
          scoreDelta = 2;
          upvoteDelta = 1;
          downvoteDelta = -1;
          karmaDelta = 2;
        } else if (previousType === null) {
          scoreDelta = 1;
          upvoteDelta = 1;
          downvoteDelta = 0;
          karmaDelta = 1;
        }
      } else if (type === "DOWNVOTE") {
        if (previousType === "UPVOTE") {
          scoreDelta = -2;
          upvoteDelta = -1;
          downvoteDelta = 1;
          karmaDelta = -2;
        } else if (previousType === null) {
          scoreDelta = -1;
          upvoteDelta = 0;
          downvoteDelta = 1;
          karmaDelta = -1;
        }
      } else {
        // Clearing vote (type === null)
        if (previousType === "UPVOTE") {
          scoreDelta = -1;
          upvoteDelta = -1;
          downvoteDelta = 0;
          karmaDelta = -1;
        } else if (previousType === "DOWNVOTE") {
          scoreDelta = 1;
          upvoteDelta = 0;
          downvoteDelta = -1;
          karmaDelta = 1;
        }
      }

      // Update vote record
      if (type === null) {
        if (existingVote) {
          await tx.forumVote.delete({
            where: { id: existingVote.id },
          });
        }
      } else {
        if (existingVote) {
          await tx.forumVote.update({
            where: { id: existingVote.id },
            data: { type },
          });
        } else {
          await tx.forumVote.create({
            data: {
              userId,
              targetId: commentId,
              type,
              targetType: "COMMENT",
            },
          });
        }
      }

      // Update SubforumComment score
      const updatedComment = await tx.subforumComment.update({
        where: { id: commentId },
        data: {
          upvotes: { increment: upvoteDelta },
          downvotes: { increment: downvoteDelta },
          score: { increment: scoreDelta },
        },
      });

      // Update User (author) forumKarma
      const updatedAuthor = await tx.profile.update({
        where: { id: comment.authorId },
        data: {
          forumKarma: { increment: karmaDelta },
        },
      });

      return {
        comment: updatedComment,
        authorKarma: updatedAuthor.forumKarma,
      };
    });

    return NextResponse.json({
      data: {
        id: result.comment.id,
        score: result.comment.score,
        upvotes: result.comment.upvotes,
        downvotes: result.comment.downvotes,
        userKarma: result.authorKarma,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to process comment vote", detail: err.message },
      { status: 500 }
    );
  }
}
