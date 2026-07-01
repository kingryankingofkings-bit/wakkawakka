import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { action, subforumId, targetUserId, targetPostId, targetCommentId, reason } = body;
    if (!targetPostId && body.postId) {
      targetPostId = body.postId;
    }
    if (!targetCommentId && body.commentId) {
      targetCommentId = body.commentId;
    }

    if (!action || !subforumId) {
      return NextResponse.json({ error: "Action and Subforum ID are required" }, { status: 400 });
    }

    // Check if requester is moderator or admin
    const member = await prisma.subforumMember.findUnique({
      where: {
        subforumId_userId: {
          subforumId,
          userId,
        },
      },
    });

    const isAuthorized = member && (member.role === "MODERATOR" || member.role === "ADMIN");
    if (!isAuthorized) {
      // Also allow creator of subforum to moderate
      const subforum = await prisma.subforum.findUnique({ where: { id: subforumId } });
      if (!subforum || subforum.creatorId !== userId) {
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
        await tx.subforumPost.update({
          where: { id: targetPostId },
          data: { isLocked: true },
        });
      } else if (actionMapped === "REMOVE_POST" && targetPostId) {
        await tx.subforumPost.delete({
          where: { id: targetPostId },
        });
        await tx.subforum.update({
          where: { id: subforumId },
          data: {
            postCount: {
              decrement: 1,
            },
          },
        });
      } else if (actionMapped === "REMOVE_COMMENT" && targetCommentId) {
        await tx.subforumComment.update({
          where: { id: targetCommentId },
          data: { isDeleted: true, content: "[removed by moderator]" },
        });
      } else if (actionMapped === "BAN_USER" && targetUserId) {
        const existing = await tx.subforumMember.findUnique({
          where: { subforumId_userId: { subforumId, userId: targetUserId } },
        });
        if (existing) {
          await tx.subforumMember.update({
            where: { id: existing.id },
            data: { isBanned: true },
          });
        } else {
          await tx.subforumMember.create({
            data: {
              subforumId,
              userId: targetUserId,
              isBanned: true,
              role: "MEMBER",
            },
          });
        }
      } else if (actionMapped === "MUTE_USER" && targetUserId) {
        const existing = await tx.subforumMember.findUnique({
          where: { subforumId_userId: { subforumId, userId: targetUserId } },
        });
        if (existing) {
          await tx.subforumMember.update({
            where: { id: existing.id },
            data: { isMuted: true },
          });
        } else {
          await tx.subforumMember.create({
            data: {
              subforumId,
              userId: targetUserId,
              isMuted: true,
              role: "MEMBER",
            },
          });
        }
      } else {
        throw new Error("Invalid mod action or target parameter");
      }

      // Create ForumModAction log
      const log = await tx.forumModAction.create({
        data: {
          subforumId,
          moderatorId: userId,
          action: actionMapped,
          targetUserId: targetUserId || null,
          targetPostId: actionMapped === "REMOVE_POST" ? null : (targetPostId || null),
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
