import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: originalPostId } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { targetSubforumId } = body;

    if (!targetSubforumId) {
      return NextResponse.json({ error: "Target subforum ID is required" }, { status: 400 });
    }

    const originalPost = await prisma.subforumPost.findUnique({
      where: { id: originalPostId },
    });

    if (!originalPost) {
      return NextResponse.json({ error: "Original post not found" }, { status: 404 });
    }

    const targetSubforum = await prisma.subforum.findUnique({
      where: { id: targetSubforumId },
    });

    if (!targetSubforum) {
      return NextResponse.json({ error: "Target subforum not found" }, { status: 404 });
    }

    // Check if user is member (not banned/muted)
    const member = await prisma.subforumMember.findUnique({
      where: {
        subforumId_userId: {
          subforumId: targetSubforumId,
          userId,
        },
      },
    });

    if (member && (member.isBanned || member.isMuted)) {
      return NextResponse.json({ error: "User is banned or muted in the target subforum" }, { status: 403 });
    }

    // Check if already crossposted to this subforum
    const existingCrosspost = await prisma.forumCrosspost.findUnique({
      where: {
        originalPostId_targetSubforumId: {
          originalPostId,
          targetSubforumId,
        },
      },
    });

    if (existingCrosspost) {
      return NextResponse.json({ error: "Post has already been crossposted to this subforum" }, { status: 400 });
    }

    const crosspostResult = await prisma.$transaction(async (tx) => {
      // 1. Create duplicate post in target subforum
      const crosspostedPost = await tx.subforumPost.create({
        data: {
          title: `Crosspost: ${originalPost.title}`,
          content: originalPost.content,
          type: originalPost.type,
          mediaUrls: originalPost.mediaUrls,
          pollOptions: originalPost.pollOptions,
          isSpoiler: originalPost.isSpoiler,
          isNSFW: originalPost.isNSFW,
          subforumId: targetSubforumId,
          authorId: userId,
          score: 1, // Voter auto upvotes
          upvotes: 1,
          downvotes: 0,
        },
      });

      // 2. Create the ForumCrosspost link
      await tx.forumCrosspost.create({
        data: {
          originalPostId,
          targetSubforumId,
          crosspostedPostId: crosspostedPost.id,
        },
      });

      // 3. Create initial vote record
      await tx.forumVote.create({
        data: {
          userId,
          targetId: crosspostedPost.id,
          type: "UPVOTE",
          targetType: "POST",
        },
      });

      // 4. Update subforum post count
      await tx.subforum.update({
        where: { id: targetSubforumId },
        data: {
          postCount: {
            increment: 1,
          },
        },
      });

      // 5. Update user karma
      await tx.user.update({
        where: { id: userId },
        data: {
          forumKarma: {
            increment: 1,
          },
        },
      });

      return crosspostedPost;
    });

    return NextResponse.json({ data: crosspostResult });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to crosspost", detail: err.message },
      { status: 500 }
    );
  }
}
