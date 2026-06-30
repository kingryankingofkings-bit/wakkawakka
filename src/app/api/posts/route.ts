import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';
import { MOCK_POSTS, MOCK_USERS } from '@/lib/mockData';
import { Post, PostType, Visibility, ReactionType, VerificationTier, Theme } from '@/types';

async function seedDatabaseIfNeeded() {
  const postCount = await prisma.post.count();
  if (postCount > 0) return;

  // Create the mock users
  for (const mockUser of MOCK_USERS) {
    const existing = await prisma.user.findUnique({ where: { id: mockUser.id } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          displayName: mockUser.displayName,
          bio: mockUser.bio || null,
          avatar: mockUser.avatar || null,
          coverImage: mockUser.coverImage || null,
          website: mockUser.website || null,
          location: mockUser.location || null,
          isVerified: mockUser.isVerified,
          verificationTier: mockUser.verificationTier || 'NONE',
          isPremium: mockUser.isPremium,
          isPrivate: mockUser.isPrivate,
          twoFactorEnabled: mockUser.twoFactorEnabled,
          theme: mockUser.theme || 'SYSTEM',
          accentColor: mockUser.accentColor || '#3b82f6',
          language: mockUser.language || 'en',
        }
      });
    }
  }

  // Create the mock posts
  for (const mockPost of MOCK_POSTS) {
    const authorExists = await prisma.user.findUnique({ where: { id: mockPost.authorId } });
    if (authorExists) {
      await prisma.post.create({
        data: {
          id: mockPost.id,
          content: mockPost.content,
          authorId: mockPost.authorId,
          type: mockPost.type,
          visibility: mockPost.visibility,
          mediaUrls: JSON.stringify(mockPost.mediaUrls || []),
          hashtags: JSON.stringify(mockPost.hashtags || []),
          collaboratorIds: JSON.stringify(mockPost.collaborators?.map(c => c.id) || []),
          isEphemeral: mockPost.isEphemeral,
          expiresAt: mockPost.expiresAt ? new Date(mockPost.expiresAt) : null,
          likesCount: mockPost.likesCount,
          commentsCount: mockPost.commentsCount,
          sharesCount: mockPost.sharesCount,
          viewsCount: mockPost.viewsCount,
          isPinned: (mockPost as any).isPinned || false,
          isArchived: (mockPost as any).isArchived || false,
          createdAt: new Date(mockPost.createdAt),
          updatedAt: new Date(mockPost.updatedAt),
        }
      });
    }
  }
}

function mapPrismaPostToPost(prismaPost: any, activeUserId?: string | null): Post {
  let mediaUrls: string[] = [];
  try {
    mediaUrls = JSON.parse(prismaPost.mediaUrls || '[]');
  } catch (e) {
    mediaUrls = [];
  }

  let hashtags: string[] = [];
  try {
    hashtags = JSON.parse(prismaPost.hashtags || '[]');
  } catch (e) {
    hashtags = [];
  }

  let userReaction: ReactionType | undefined = undefined;
  if (activeUserId && prismaPost.likes) {
    const activeUserLike = prismaPost.likes.find((l: any) => l.userId === activeUserId);
    if (activeUserLike) {
      userReaction = activeUserLike.type as ReactionType;
    }
  }

  return {
    id: prismaPost.id,
    content: prismaPost.content || '',
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
      verificationTier: (prismaPost.author.verificationTier || 'NONE') as VerificationTier,
      isPremium: prismaPost.author.isPremium,
      isPrivate: prismaPost.author.isPrivate,
      twoFactorEnabled: prismaPost.author.twoFactorEnabled,
      theme: (prismaPost.author.theme || 'system') as Theme,
      accentColor: prismaPost.author.accentColor || '#3b82f6',
      language: prismaPost.author.language || 'en',
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
    expiresAt: prismaPost.expiresAt ? prismaPost.expiresAt.toISOString() : undefined,
    likesCount: prismaPost.likesCount,
    commentsCount: prismaPost.commentsCount,
    sharesCount: prismaPost.sharesCount,
    viewsCount: prismaPost.viewsCount,
    hashtags,
    collaborators: [],
    userReaction,
    btsUrl: prismaPost.btsUrl || undefined,
    greenScreenBg: prismaPost.greenScreenBg || undefined,
    labels: prismaPost.labels || undefined,
    createdAt: prismaPost.createdAt.toISOString(),
    updatedAt: prismaPost.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const hashtag = searchParams.get('hashtag');
    const feed = searchParams.get('feed');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const activeUserId = getRequestUserId(req);

    await seedDatabaseIfNeeded();

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

    if (feed === 'following' && activeUserId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: activeUserId, status: 'ACCEPTED' },
        select: { followingId: true },
      });
      const followingIds = follows.map(f => f.followingId);
      whereClause.authorId = { in: followingIds };
    }

    // Filter blocked users
    if (activeUserId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: activeUserId },
            { blockedId: activeUserId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });
      const blockedUserIds = blocks.map(b => b.blockerId === activeUserId ? b.blockedId : b.blockerId);
      if (blockedUserIds.length > 0) {
        if (whereClause.authorId) {
          if (whereClause.authorId.in) {
            const filteredFollowingIds = whereClause.authorId.in.filter((id: string) => !blockedUserIds.includes(id));
            whereClause.authorId = { in: filteredFollowingIds };
          } else if (typeof whereClause.authorId === 'string') {
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
    
    const scheduledParam = searchParams.get('scheduled');
    if (scheduledParam === '1') {
      whereClause.scheduledAt = { not: null };
    } else {
      whereClause.OR = [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } }
      ];
    }

    const isForYou = feed === 'forYou' || feed === 'foryou' || (!feed && !userId && !hashtag);

    const skip = (page - 1) * limit;
    const total = await prisma.post.count({ where: whereClause });
    let dbPosts;

    if (isForYou) {
      dbPosts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: true,
          likes: activeUserId ? {
            where: { userId: activeUserId },
          } : undefined,
        },
      });

      const now = Date.now();
      dbPosts.sort((a, b) => {
        const ageInHoursA = (now - a.createdAt.getTime()) / (1000 * 60 * 60);
        const ageInHoursB = (now - b.createdAt.getTime()) / (1000 * 60 * 60);
        const scoreA = ((a.viewsCount * 0.1) + (a.likesCount * 1.5) + (a.commentsCount * 3.0) + (a.sharesCount * 5.0)) / Math.pow(ageInHoursA + 2, 1.5);
        const scoreB = ((b.viewsCount * 0.1) + (b.likesCount * 1.5) + (b.commentsCount * 3.0) + (b.sharesCount * 5.0)) / Math.pow(ageInHoursB + 2, 1.5);
        return scoreB - scoreA;
      });

      dbPosts = dbPosts.slice(skip, skip + limit);
    } else {
      let orderByClause: any = { createdAt: 'desc' };
      if (feed === 'trending') {
        orderByClause = { viewsCount: 'desc' };
      }

      dbPosts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: true,
          likes: activeUserId ? {
            where: { userId: activeUserId },
          } : undefined,
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      });
    }

    const data = dbPosts.map(p => mapPrismaPostToPost(p, activeUserId));

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const activeUserId = getRequestUserId(req);
    const authorId = activeUserId || body.authorId || 'current';

    let author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      author = await prisma.user.create({
        data: {
          id: authorId,
          username: body.author?.username || `user_${authorId}`,
          email: body.author?.email || `${authorId}@example.com`,
          displayName: body.author?.displayName || `User ${authorId}`,
          avatar: body.author?.avatar || null,
        }
      });
    }

    const newDbPost = await prisma.post.create({
      data: {
        content: body.content || '',
        authorId: authorId,
        type: body.type || 'TEXT',
        visibility: body.visibility || 'PUBLIC',
        mediaUrls: JSON.stringify(body.mediaUrls || []),
        hashtags: JSON.stringify(body.hashtags || []),
        collaboratorIds: JSON.stringify(body.collaborators?.map((c: any) => c.id) || []),
        isEphemeral: body.isEphemeral || false,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        btsUrl: body.btsUrl || null,
        greenScreenBg: body.greenScreenBg || null,
        labels: body.labels ? (Array.isArray(body.labels) ? JSON.stringify(body.labels) : String(body.labels)) : '[]',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
      },
      include: {
        author: true,
      }
    });

    const data = mapPrismaPostToPost(newDbPost, authorId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Invalid request body or creation failed' }, { status: 400 });
  }
}
