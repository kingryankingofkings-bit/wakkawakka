import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { z } from "zod";
import { validateRequest, optionalAuth } from "@/lib/apiValidation";
import { apiInternalError } from "@/lib/apiResponse";
import { createLogger } from "@/lib/logger";
import { isMature } from "@/lib/contentFilter";
import {
  Post,
  PostType,
  Visibility,
  ReactionType,
  VerificationTier,
  Theme,
} from "@/types";

const log = createLogger("PostsAPI");

// Zod validation schema for creating a post
const createPostSchema = z.object({
  content: z.string().default(""),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "REEL", "STORY", "AUDIO", "LIVE", "MUSIC"]).default("TEXT"),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  hashtags: z.array(z.string()).optional().default([]),
  collaborators: z.array(z.object({ id: z.string() })).optional().default([]),
  isEphemeral: z.boolean().optional().default(false),
  isExplicit: z.boolean().optional().default(false),
  expiresAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  btsUrl: z.string().url().optional().nullable(),
  greenScreenBg: z.string().optional().nullable(),
  labels: z.union([z.array(z.string()), z.string()]).optional(),
  authorId: z.string().optional(),
  author: z.object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    displayName: z.string().optional(),
    avatar: z.string().optional(),
  }).optional(),
});

// NOTE: Database seeding has been moved to `npm run db:seed`.
// The GET handler no longer auto-seeds to prevent production hazards.

function mapPrismaPostToPost(
  prismaPost: any,
  activeUserId?: string | null,
): Post {
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
      verificationTier: (prismaPost.author.verificationTier || "NONE") as VerificationTier,
      professionalTier: prismaPost.author.professionalTier || "NONE",
      idVerificationStatus: prismaPost.author.idVerificationStatus || "UNVERIFIED",
      freeCoursesCreatedThisMonth: prismaPost.author.freeCoursesCreatedThisMonth || 0,
      paidCoursesCreatedThisMonth: prismaPost.author.paidCoursesCreatedThisMonth || 0,
      averageCourseRating: prismaPost.author.averageCourseRating || 0,
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
    type: prismaPost.type as PostType,
    visibility: prismaPost.visibility as Visibility,
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
    isExplicit: prismaPost.isExplicit || false,
    btsUrl: prismaPost.btsUrl || undefined,
    greenScreenBg: prismaPost.greenScreenBg || undefined,
    labels: prismaPost.labels || undefined,
    isFlagged: prismaPost.isFlagged || false,
    scheduledAt: prismaPost.scheduledAt ? prismaPost.scheduledAt.toISOString() : undefined,
    createdAt: prismaPost.createdAt.toISOString(),
    updatedAt: prismaPost.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const hashtag = searchParams.get("hashtag");
    const feed = searchParams.get("feed");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const activeUserId = await getRequestUserId(req);

    const whereClause: any = {};
    if (type) {
      whereClause.type = type;
    }
    if (userId) {
      whereClause.authorId = userId;
    }
    if (hashtag) {
      whereClause.hashtags = { contains: hashtag };
    }

    if (feed === "following" && activeUserId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: activeUserId, status: "ACCEPTED" },
        select: { followingId: true },
      });
      const followingIds = follows.map((f) => f.followingId);
      whereClause.authorId = { in: followingIds };
    }

    // Filter blocked users
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
      const blockedUserIds = blocks.map((b) =>
        b.blockerId === activeUserId ? b.blockedId : b.blockerId,
      );
      if (blockedUserIds.length > 0) {
        if (whereClause.authorId) {
          if (whereClause.authorId.in) {
            const filteredFollowingIds = whereClause.authorId.in.filter(
              (id: string) => !blockedUserIds.includes(id),
            );
            whereClause.authorId = { in: filteredFollowingIds };
          } else if (typeof whereClause.authorId === "string") {
            if (blockedUserIds.includes(whereClause.authorId)) {
              whereClause.authorId = { in: [] };
            }
          } else {
            whereClause.authorId.notIn = blockedUserIds;
          }
        } else {
          whereClause.authorId = { notIn: blockedUserIds };
        }
      }
    }

    whereClause.isDeleted = false;
    whereClause.isFlagged = false; // auto-flagged mature content excluded from feeds

    const scheduledParam = searchParams.get("scheduled");
    if (scheduledParam === "1") {
      whereClause.scheduledAt = { not: null };
    } else {
      whereClause.OR = [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ];
    }

    const isForYou =
      feed === "forYou" || feed === "foryou" || (!feed && !userId && !hashtag);

    const skip = (page - 1) * limit;
    const total = await prisma.post.count({ where: whereClause });
    let dbPosts;

    if (isForYou) {
      dbPosts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: true,
          likes: activeUserId
            ? {
                where: { userId: activeUserId },
              }
            : undefined,
        },
      });

      const now = Date.now();
      dbPosts.sort((a, b) => {
        const ageInHoursA = (now - a.createdAt.getTime()) / (1000 * 60 * 60);
        const ageInHoursB = (now - b.createdAt.getTime()) / (1000 * 60 * 60);
        const scoreA =
          (a.viewsCount * 0.1 +
            a.likesCount * 1.5 +
            a.commentsCount * 3.0 +
            a.sharesCount * 5.0) /
          Math.pow(ageInHoursA + 2, 1.5);
        const scoreB =
          (b.viewsCount * 0.1 +
            b.likesCount * 1.5 +
            b.commentsCount * 3.0 +
            b.sharesCount * 5.0) /
          Math.pow(ageInHoursB + 2, 1.5);
        return scoreB - scoreA;
      });

      dbPosts = dbPosts.slice(skip, skip + limit);
    } else {
      let orderByClause: any = { createdAt: "desc" };
      if (feed === "trending") {
        orderByClause = { viewsCount: "desc" };
      }

      dbPosts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: true,
          likes: activeUserId
            ? {
                where: { userId: activeUserId },
              }
            : undefined,
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      });
    }

    const data = dbPosts.map((p) => mapPrismaPostToPost(p, activeUserId));

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    log.error("Error fetching posts", { error });
    return apiInternalError("Failed to fetch posts");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validation = validateRequest(createPostSchema, body);
    if (!validation.success) return validation.response;
    const validated = validation.data;

    const activeUserId = await optionalAuth(req);
    const authorId = activeUserId || validated.authorId || "current";

    let author = await prisma.profile.findUnique({ where: { id: authorId } });
    if (!author) {
      author = await prisma.profile.create({
        data: {
          id: authorId,
          username: validated.author?.username || `user_${authorId}`,
          email: validated.author?.email || `${authorId}@example.com`,
          displayName: validated.author?.displayName || `User ${authorId}`,
          avatar: validated.author?.avatar || null,
        },
      });
    }

    // --- Content filtering: auto-flag mature content ---
    const contentToCheck = [
      validated.content,
      ...(validated.hashtags || []),
    ].join(" ");
    const flaggedAsMature = isMature(contentToCheck);

    const newDbPost = await prisma.post.create({
      data: {
        content: validated.content,
        authorId: authorId,
        type: validated.type,
        visibility: validated.visibility,
        mediaUrls: JSON.stringify(validated.mediaUrls),
        hashtags: JSON.stringify(validated.hashtags),
        collaboratorIds: JSON.stringify(
          validated.collaborators?.map((c) => c.id) || [],
        ),
        isEphemeral: validated.isEphemeral,
        isExplicit: validated.isExplicit ?? false,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        btsUrl: validated.btsUrl || null,
        greenScreenBg: validated.greenScreenBg || null,
        labels: validated.labels
          ? Array.isArray(validated.labels)
            ? JSON.stringify(validated.labels)
            : String(validated.labels)
          : "[]",
        isFlagged: flaggedAsMature,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
      },
      include: {
        author: true,
      },
    });

    if (flaggedAsMature) {
      log.warn("Post auto-flagged for mature content", { data: { postId: newDbPost.id, authorId } });
    }

    const data = mapPrismaPostToPost(newDbPost, authorId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    log.error("Error creating post", { error });
    return apiInternalError("Failed to create post");
  }
}
