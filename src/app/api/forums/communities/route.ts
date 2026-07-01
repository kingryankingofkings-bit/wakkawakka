import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/forum/subforums - List all subforums
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

    const items = await prisma.subforum.findMany({
      where,
      orderBy: { memberCount: "desc" },
    });

    return NextResponse.json({ data: items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch subforums", detail: err.message },
      { status: 500 }
    );
  }
}

// POST /api/forum/subforums - Create a new subforum
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, rules, customTheme, isNSFW, isSpoiler } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Subforum name is required" }, { status: 400 });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) {
      return NextResponse.json({ error: "Invalid subforum name" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.subforum.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Subforum name or slug already exists" }, { status: 400 });
    }

    const subforum = await prisma.$transaction(async (tx) => {
      const sub = await tx.subforum.create({
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

      await tx.subforumMember.create({
        data: {
          subforumId: sub.id,
          userId,
          role: "ADMIN",
        },
      });

      return sub;
    });

    return NextResponse.json({ data: subforum });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create subforum", detail: err.message },
      { status: 500 }
    );
  }
}
