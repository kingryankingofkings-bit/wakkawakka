import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import {
  Post,
  ReactionType,
  Visibility,
  PostType,
  VerificationTier,
  Theme,
} from "@/types";

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
    createdAt: prismaPost.createdAt.toISOString(),
    updatedAt: prismaPost.updatedAt.toISOString(),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: postId } = params;
    const body = await req.json();
    const { type } = body;

    const activeUserId = await getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validTypes = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 },
      );
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      const existingLike = await tx.like.findUnique({
        where: {
          userId_postId: {
            userId: activeUserId,
            postId: postId,
          },
        },
      });

      let likesAdjustment = 0;

      if (existingLike) {
        if (existingLike.type === type) {
          await tx.like.delete({
            where: {
              userId_postId: {
                userId: activeUserId,
                postId: postId,
              },
            },
          });
          likesAdjustment = -1;
        } else {
          await tx.like.update({
            where: {
              userId_postId: {
                userId: activeUserId,
                postId: postId,
              },
            },
            data: { type },
          });
        }
      } else {
        await tx.like.create({
          data: {
            userId: activeUserId,
            postId: postId,
            type,
          },
        });
        likesAdjustment = 1;
      }

      return await tx.post.update({
        where: { id: postId },
        data: {
          likesCount:
            likesAdjustment === 1
              ? { increment: 1 }
              : likesAdjustment === -1
                ? { decrement: 1 }
                : undefined,
        },
        include: {
          author: true,
          likes: {
            where: { userId: activeUserId },
          },
        },
      });
    });

    const data = mapPrismaPostToPost(updatedPost, activeUserId);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error reacting to post:", error);
    if (error.message === "Post not found") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to react to post" },
      { status: 500 },
    );
  }
}
