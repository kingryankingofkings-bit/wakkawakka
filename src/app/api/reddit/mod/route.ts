import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { action, subredditId, targetUserId, targetPostId, targetCommentId, reason } = body;
    if (!targetPostId && body.postId) {
      targetPostId = body.postId;
    }
    if (!targetCommentId && body.commentId) {
      targetCommentId = body.commentId;
    }

    if (!action || !subredditId) {
      return NextResponse.json({ error: "Action and Subreddit ID are required" }, { status: 400 });
    }

    // Check if requester is moderator or admin
    const member = await prisma.subredditMember.findUnique({
      where: {
        subredditId_userId: {
          subredditId,
          userId,
        },
      },
    });

    const isAuthorized = member && (member.role === "MODERATOR" || member.role === "ADMIN");
    if (!isAuthorized) {
      // Also allow creator of subreddit to moderate
      const subreddit = await prisma.subreddit.findUnique({ where: { id: subredditId } });
      if (!subreddit || subreddit.creatorId !== userId) {
        return NextResponse.json({ error: "Unauthorized mod action" }, { status: 403 });
      }
    }

    // Map short action names to long names if needed
    let actionMapped = action;
    if (action === "LOCK") actionMapped = "LOCK_POST";
    if (action === "REMOVE") {
      if (targetPostId) actionMapped = "REMOVE_POST";
      else if (targetCommentId) actionMapped = "REMOVE_COMMENT";
    }
    if (action === "BAN") actionMapped = "BAN_USER";
    if (action === "MUTE") actionMapped = "MUTE_USER";

    const result = await prisma.$transaction(async (tx) => {
      if (actionMapped === "LOCK_POST" && targetPostId) {
        await tx.subredditPost.update({
          where: { id: targetPostId },
          data: { isLocked: true },
        });
      } else if (actionMapped === "REMOVE_POST" && targetPostId) {
        await tx.subredditPost.delete({
          where: { id: targetPostId },
        });
      } else if (actionMapped === "REMOVE_COMMENT" && targetCommentId) {
        await tx.subredditComment.update({
          where: { id: targetCommentId },
          data: { isDeleted: true, content: "[removed by moderator]" },
        });
      } else if (actionMapped === "BAN_USER" && targetUserId) {
        const existing = await tx.subredditMember.findUnique({
          where: { subredditId_userId: { subredditId, userId: targetUserId } },
        });
        if (existing) {
          await tx.subredditMember.update({
            where: { id: existing.id },
            data: { isBanned: true },
          });
        } else {
          await tx.subredditMember.create({
            data: {
              subredditId,
              userId: targetUserId,
              isBanned: true,
              role: "MEMBER",
            },
          });
        }
      } else if (actionMapped === "MUTE_USER" && targetUserId) {
        const existing = await tx.subredditMember.findUnique({
          where: { subredditId_userId: { subredditId, userId: targetUserId } },
        });
        if (existing) {
          await tx.subredditMember.update({
            where: { id: existing.id },
            data: { isMuted: true },
          });
        } else {
          await tx.subredditMember.create({
            data: {
              subredditId,
              userId: targetUserId,
              isMuted: true,
              role: "MEMBER",
            },
          });
        }
      } else {
        throw new Error("Invalid mod action or target parameter");
      }

      // Create RedditModAction log
      const log = await tx.redditModAction.create({
        data: {
          subredditId,
          moderatorId: userId,
          action: actionMapped,
          targetUserId: targetUserId || null,
          targetPostId: targetPostId || null,
          targetCommentId: targetCommentId || null,
          reason: reason || "",
        },
      });

      return log;
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to perform mod action", detail: err.message },
      { status: 500 }
    );
  }
}
