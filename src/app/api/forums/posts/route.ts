import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/forum/posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subforumId = searchParams.get("subforumId");
    const sort = searchParams.get("sort") || "hot"; // hot | new | top | best
    const query = searchParams.get("query") || "";

    const where: any = {};
    if (subforumId) {
      where.subforumId = subforumId;
    }
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { content: { contains: query } },
      ];
    }

    const posts = await prisma.subforumPost.findMany({
      where,
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
      orderBy: sort === "new" ? { createdAt: "desc" } : (sort === "top" ? { score: "desc" } : undefined),
    });

    // Post processing for JSON fields
    let formattedPosts = posts.map((p) => {
      let mediaUrlsParsed = [];
      try {
        mediaUrlsParsed = p.mediaUrls ? JSON.parse(p.mediaUrls) : [];
      } catch (e) {}

      let pollOptionsParsed = [];
      try {
        pollOptionsParsed = p.pollOptions ? JSON.parse(p.pollOptions) : [];
      } catch (e) {}

      let pollVotesParsed = {};
      try {
        pollVotesParsed = p.pollVotes ? JSON.parse(p.pollVotes) : {};
      } catch (e) {}

      return {
        ...p,
        mediaUrls: mediaUrlsParsed,
        pollOptions: pollOptionsParsed,
        pollVotes: pollVotesParsed,
      };
    });

    // In-memory algorithmic sorting for 'hot' and 'best'
    if (sort === "hot" || sort === "best") {
      const now = new Date().getTime();
      formattedPosts.sort((a: any, b: any) => {
        const ageInHoursA = (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
        const ageInHoursB = (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);

        const hotScoreA = a.score / Math.pow(ageInHoursA + 2, 1.5);
        const hotScoreB = b.score / Math.pow(ageInHoursB + 2, 1.5);

        return hotScoreB - hotScoreA;
      });
    }

    return NextResponse.json({ data: formattedPosts });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch posts", detail: err.message },
      { status: 500 }
    );
  }
}

// POST /api/forum/posts
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      content,
      type,
      mediaUrls,
      pollOptions,
      isSpoiler,
      isNSFW,
      isAMA,
      subforumId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Post title is required" }, { status: 400 });
    }

    if (!subforumId) {
      return NextResponse.json({ error: "Subforum ID is required" }, { status: 400 });
    }

    const subforum = await prisma.subforum.findUnique({
      where: { id: subforumId },
    });

    if (!subforum) {
      return NextResponse.json({ error: "Subforum not found" }, { status: 444 }); // Use specific or 404
    }

    // Verify member is not banned or muted
    const member = await prisma.subforumMember.findUnique({
      where: {
        subforumId_userId: {
          subforumId,
          userId,
        },
      },
    });

    if (member && (member.isBanned || member.isMuted)) {
      return NextResponse.json({ error: "User is banned or muted in this subforum" }, { status: 403 });
    }

    // Initialize pollVotes map if type is POLL
    let pollVotesString = "{}";
    if (type === "POLL" && Array.isArray(pollOptions)) {
      const initialVotesMap: Record<string, number> = {};
      pollOptions.forEach((option) => {
        initialVotesMap[option] = 0;
      });
      pollVotesString = JSON.stringify(initialVotesMap);
    }

    const post = await prisma.$transaction(async (tx) => {
      const p = await tx.subforumPost.create({
        data: {
          title: title.trim(),
          content: content || "",
          type: type || "TEXT",
          mediaUrls: Array.isArray(mediaUrls) ? JSON.stringify(mediaUrls) : "[]",
          pollOptions: Array.isArray(pollOptions) ? JSON.stringify(pollOptions) : null,
          pollVotes: type === "POLL" ? pollVotesString : null,
          isSpoiler: !!isSpoiler,
          isNSFW: !!isNSFW,
          isAMA: !!isAMA,
          subforumId,
          authorId: userId,
          score: 0,
          upvotes: 0,
          downvotes: 0,
        },
      });

      await tx.subforum.update({
        where: { id: subforumId },
        data: {
          postCount: {
            increment: 1,
          },
        },
      });

      return p;
    });

    // Formatting response
    const formattedPost = {
      ...post,
      mediaUrls: JSON.parse(post.mediaUrls || "[]"),
      pollOptions: post.pollOptions ? JSON.parse(post.pollOptions) : [],
      pollVotes: post.pollVotes ? JSON.parse(post.pollVotes) : {},
    };

    return NextResponse.json({ data: formattedPost });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create post", detail: err.message },
      { status: 500 }
    );
  }
}
