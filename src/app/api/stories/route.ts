import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function GET(req: NextRequest) {
  try {
    const activeUserId = getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get followed users
    const follows = await prisma.follow.findMany({
      where: { followerId: activeUserId, status: "ACCEPTED" },
      select: { followingId: true },
    });
    const followedUserIds = follows.map((f) => f.followingId);
    const authorIds = [...followedUserIds, activeUserId];

    const dbStories = await prisma.story.findMany({
      where: {
        authorId: { in: authorIds },
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        author: true,
        views: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map database stories to the Story frontend contract
    const data = dbStories.map((story) => {
      const viewerIds = story.views.map((v) => v.viewerId);
      const hasViewed = viewerIds.includes(activeUserId);
      return {
        id: story.id,
        author: story.author,
        authorId: story.authorId,
        mediaUrl: story.mediaUrl,
        type: story.type,
        caption: story.caption,
        duration: story.duration || 5, // default 5s
        expiresAt: story.expiresAt.toISOString(),
        viewerIds,
        hasViewed,
        createdAt: story.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const activeUserId = getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mediaUrl = body.mediaUrl || "";
    const type = body.type || "IMAGE"; // IMAGE or VIDEO
    const caption = body.caption || null;
    const duration = body.duration !== undefined ? parseInt(body.duration) : 5; // default 5s
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // now + 24 hours

    const newStory = await prisma.story.create({
      data: {
        authorId: activeUserId,
        mediaUrl,
        type,
        caption,
        duration,
        expiresAt,
        isActive: true,
      },
      include: {
        author: true,
        views: true,
      },
    });

    const data = {
      id: newStory.id,
      author: newStory.author,
      authorId: newStory.authorId,
      mediaUrl: newStory.mediaUrl,
      type: newStory.type,
      caption: newStory.caption,
      duration: newStory.duration || 5,
      expiresAt: newStory.expiresAt.toISOString(),
      viewerIds: [],
      hasViewed: false,
      createdAt: newStory.createdAt.toISOString(),
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Invalid request body or creation failed" },
      { status: 400 },
    );
  }
}
