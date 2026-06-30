import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: originalPostId } = params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { targetSubredditId } = body;

    if (!targetSubredditId) {
      return NextResponse.json({ error: "Target subreddit ID is required" }, { status: 400 });
    }

    const originalPost = await prisma.subredditPost.findUnique({
      where: { id: originalPostId },
    });

    if (!originalPost) {
      return NextResponse.json({ error: "Original post not found" }, { status: 404 });
    }

    const targetSubreddit = await prisma.subreddit.findUnique({
      where: { id: targetSubredditId },
    });

    if (!targetSubreddit) {
      return NextResponse.json({ error: "Target subreddit not found" }, { status: 404 });
    }

    // Check if user is member (not banned/muted)
    const member = await prisma.subredditMember.findUnique({
      where: {
        subredditId_userId: {
          subredditId: targetSubredditId,
          userId,
        },
      },
    });

    if (member && (member.isBanned || member.isMuted)) {
      return NextResponse.json({ error: "User is banned or muted in the target subreddit" }, { status: 403 });
    }

    // Check if already crossposted to this subreddit
    const existingCrosspost = await prisma.redditCrosspost.findUnique({
      where: {
        originalPostId_targetSubredditId: {
          originalPostId,
          targetSubredditId,
        },
      },
    });

    if (existingCrosspost) {
      return NextResponse.json({ error: "Post has already been crossposted to this subreddit" }, { status: 400 });
    }

    const crosspostResult = await prisma.$transaction(async (tx) => {
      // 1. Create duplicate post in target subreddit
      const crosspostedPost = await tx.subredditPost.create({
        data: {
          title: `Crosspost: ${originalPost.title}`,
          content: originalPost.content,
          type: originalPost.type,
          mediaUrls: originalPost.mediaUrls,
          pollOptions: originalPost.pollOptions,
          isSpoiler: originalPost.isSpoiler,
          isNSFW: originalPost.isNSFW,
          subredditId: targetSubredditId,
          authorId: userId,
          score: 1, // Voter auto upvotes
          upvotes: 1,
          downvotes: 0,
        },
      });

      // 2. Create the RedditCrosspost link
      await tx.redditCrosspost.create({
        data: {
          originalPostId,
          targetSubredditId,
          crosspostedPostId: crosspostedPost.id,
        },
      });

      // 3. Create initial vote record
      await tx.redditVote.create({
        data: {
          userId,
          targetId: crosspostedPost.id,
          type: "UPVOTE",
          targetType: "POST",
        },
      });

      // 4. Update subreddit post count
      await tx.subreddit.update({
        where: { id: targetSubredditId },
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
          redditKarma: {
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
