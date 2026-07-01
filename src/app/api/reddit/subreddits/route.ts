import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/reddit/subreddits - List all subreddits
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("name") || "";

    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { slug: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const items = await prisma.subreddit.findMany({
      where,
      orderBy: { memberCount: "desc" },
    });

    return NextResponse.json({ data: items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch subreddits", detail: err.message },
      { status: 500 }
    );
  }
}

// POST /api/reddit/subreddits - Create a new subreddit
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, rules, customTheme, isNSFW, isSpoiler } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Subreddit name is required" }, { status: 400 });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) {
      return NextResponse.json({ error: "Invalid subreddit name" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.subreddit.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Subreddit name or slug already exists" }, { status: 400 });
    }

    const subreddit = await prisma.$transaction(async (tx) => {
      const sub = await tx.subreddit.create({
        data: {
          name: name.trim(),
          slug,
          description: description || "",
          rules: Array.isArray(rules) ? JSON.stringify(rules) : (rules || "[]"),
          customTheme: customTheme ? JSON.stringify(customTheme) : "{}",
          isNSFW: !!isNSFW,
          isSpoiler: !!isSpoiler,
          creatorId: userId,
          memberCount: 1,
        },
      });

      await tx.subredditMember.create({
        data: {
          subredditId: sub.id,
          userId,
          role: "ADMIN",
        },
      });

      return sub;
    });

    return NextResponse.json({ data: subreddit });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create subreddit", detail: err.message },
      { status: 500 }
    );
  }
}
