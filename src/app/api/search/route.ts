import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { ReactionType, VerificationTier, Theme } from "@/types";

export const dynamic = "force-dynamic";

function mapPrismaPostToPost(
  prismaPost: any,
  activeUserId?: string | null,
): any {
  let mediaUrls: string[] = [];
  try {
    mediaUrls = JSON.parse(prismaPost.mediaUrls || "[]");
  } catch (e) {
    mediaUrls = [];
  }

  let hashtags: string[] = [];
  try {
    hashtags = JSON.parse(prismaPost.hashtags || "[]");
  } catch (e) {
    hashtags = [];
  }

  let userReaction: ReactionType | undefined = undefined;
  if (activeUserId && prismaPost.likes) {
    const activeUserLike = prismaPost.likes.find(
      (l: any) => l.userId === activeUserId,
    );
    if (activeUserLike) {
      userReaction = activeUserLike.type as ReactionType;
    }
  }

  return {
    id: prismaPost.id,
    content: prismaPost.content || "",
    author: {
      id: prismaPost.author.id,
      username: prismaPost.author.username,
      email: prismaPost.author.email,
      displayName: prismaPost.author.displayName,
      bio: prismaPost.author.bio || undefined,
      avatar: prismaPost.author.avatar || undefined,
      coverImage: prismaPost.author.coverImage || undefined,
      website: prismaPost.author.website || undefined,
      location: prismaPost.author.location || undefined,
      isVerified: prismaPost.author.isVerified,
      verificationTier: (prismaPost.author.verificationTier ||
        "NONE") as VerificationTier,
      isPremium: prismaPost.author.isPremium,
      isPrivate: prismaPost.author.isPrivate,
      twoFactorEnabled: prismaPost.author.twoFactorEnabled,
      theme: (prismaPost.author.theme || "system") as Theme,
      accentColor: prismaPost.author.accentColor || "#3b82f6",
      language: prismaPost.author.language || "en",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      streakDays: 0,
      badges: [],
      createdAt: prismaPost.author.createdAt.toISOString(),
      updatedAt: prismaPost.author.updatedAt.toISOString(),
    },
    authorId: prismaPost.authorId,
    mediaUrls,
    type: prismaPost.type,
    visibility: prismaPost.visibility,
    isEphemeral: prismaPost.isEphemeral,
    expiresAt: prismaPost.expiresAt
      ? prismaPost.expiresAt.toISOString()
      : undefined,
    likesCount: prismaPost.likesCount,
    commentsCount: prismaPost.commentsCount,
    sharesCount: prismaPost.sharesCount,
    viewsCount: prismaPost.viewsCount,
    hashtags,
    collaborators: [],
    userReaction,
    createdAt: prismaPost.createdAt.toISOString(),
    updatedAt: prismaPost.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    if (!q) {
      const trendingHashtags = await prisma.hashtag.findMany({
        where: { isTrending: true },
        take: 10,
      });
      return NextResponse.json({
        data: {
          users: [],
          posts: [],
          hashtags: trendingHashtags.map((h) => ({
            ...h,
            createdAt: h.createdAt.toISOString(),
            updatedAt: h.updatedAt.toISOString(),
          })),
          communities: [],
        },
      });
    }

    const activeUserId = await getRequestUserId(req);

    // Save search history in DB
    if (activeUserId) {
      await prisma.searchHistory
        .create({
          data: {
            userId: activeUserId,
            query: q,
          },
        })
        .catch((err) => {
          console.error("Failed to create search history:", err);
        });
    }

    // Filter blocked users
    let blockedUserIds: string[] = [];
    if (activeUserId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: activeUserId }, { blockedId: activeUserId }],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });
      blockedUserIds = blocks.map((b) =>
        b.blockerId === activeUserId ? b.blockedId : b.blockerId,
      );
    }

    // Query Users
    const dbUsers = await prisma.profile.findMany({
      where: {
        id: blockedUserIds.length > 0 ? { notIn: blockedUserIds } : undefined,
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
          { bio: { contains: q } },
        ],
      },
      take: 10,
    });

    const users = dbUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      streakDays: 0,
      badges: [],
    }));

    // Query Posts
    const tagQuery = q.startsWith("#") ? q.slice(1) : q;
    const dbPosts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        authorId:
          blockedUserIds.length > 0 ? { notIn: blockedUserIds } : undefined,
        AND: [
          {
            OR: [
              { content: { contains: q } },
              { hashtags: { contains: tagQuery } },
            ],
          },
          {
            OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
          },
        ],
      },
      include: {
        author: true,
        likes: activeUserId
          ? {
              where: { userId: activeUserId },
            }
          : undefined,
      },
      take: 10,
    });

    const posts = dbPosts.map((p) => mapPrismaPostToPost(p, activeUserId));

    // Query Hashtags
    const dbHashtags = await prisma.hashtag.findMany({
      where: {
        name: { contains: tagQuery },
      },
      take: 10,
    });

    const hashtags = dbHashtags.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }));

    // Query Communities
    const dbCommunities = await prisma.community.findMany({
      where: {
        OR: [{ name: { contains: q } }, { description: { contains: q } }],
      },
      include: {
        creator: true,
      },
      take: 10,
    });

    const communities = await Promise.all(
      dbCommunities.map(async (c) => {
        let isMember = false;
        let isModerator = false;
        if (activeUserId) {
          const member = await prisma.communityMember.findUnique({
            where: {
              communityId_userId: { communityId: c.id, userId: activeUserId },
            },
          });
          isMember = !!member;
          isModerator =
            c.creatorId === activeUserId ||
            (member && ["ADMIN", "MODERATOR"].includes(member.role)) ||
            false;
        }
        return {
          ...c,
          isMember,
          isModerator,
          isPrivate: c.visibility === "PRIVATE",
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        };
      }),
    );

    return NextResponse.json({
      data: {
        users,
        posts,
        hashtags,
        communities,
      },
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
