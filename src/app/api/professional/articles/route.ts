import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/articles - List articles
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  const authorId = req.nextUrl.searchParams.get("authorId");
  const includeDrafts = req.nextUrl.searchParams.get("includeDrafts") === "true";

  try {
    const whereClause: any = {};

    if (authorId) {
      whereClause.authorId = authorId;
      // Drafts can only be seen by the author
      if (!includeDrafts || authorId !== userId) {
        whereClause.isPublished = true;
      }
    } else {
      whereClause.isPublished = true;
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format for Zustand store expected fields
    const formatted = articles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      coverImage: a.coverImage,
      authorId: a.authorId,
      authorName: a.author?.displayName || a.author?.username || "Unknown",
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch articles", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/articles - Create or publish an article
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, summary, coverImage, isPublished } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        summary,
        coverImage,
        authorId: userId,
        isPublished: isPublished ?? true, // Default to true if not specified
        publishedAt: (isPublished ?? true) ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    const formatted = {
      id: article.id,
      title: article.title,
      content: article.content,
      coverImage: article.coverImage,
      authorId: article.authorId,
      authorName: article.author?.displayName || article.author?.username || "Unknown",
      createdAt: article.createdAt.toISOString(),
    };

    return NextResponse.json({ data: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create article", detail: String(err) },
      { status: 500 }
    );
  }
}
