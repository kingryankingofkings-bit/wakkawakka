import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { MOCK_COMMUNITIES } from "@/lib/mockData";

export const dynamic = "force-dynamic";

async function seedCommunitiesIfNeeded() {
  const count = await prisma.community.count();
  if (count > 0) return;

  // Let's seed communities from MOCK_COMMUNITIES
  for (const c of MOCK_COMMUNITIES) {
    // Check if creator exists or use a default creator
    const creatorExists = await prisma.profile.findUnique({
      where: { id: c.creatorId },
    });
    const creatorId = creatorExists ? c.creatorId : "u1"; // fallback

    const created = await prisma.community.create({
      data: {
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: c.description || "",
        avatarUrl: c.avatarUrl || "",
        coverImage: c.coverImage || "",
        creatorId,
        category: c.category || "GENERAL",
        visibility: c.isPrivate ? "PRIVATE" : "PUBLIC",
        rules: "Follow guidelines",
        memberCount: c.memberCount || 1,
      },
    });

    // Add creator as member
    await prisma.communityMember.create({
      data: {
        communityId: created.id,
        userId: creatorId,
        role: "ADMIN",
      },
    });
  }
}

// GET /api/communities - list all communities
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
    await seedCommunitiesIfNeeded();

    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }

    const items = await prisma.community.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Bulk-fetch memberships for current user in one query (avoids N+1)
    let membershipMap: Record<string, { role: string }> = {};
    if (userId) {
      const memberships = await prisma.communityMember.findMany({
        where: {
          userId,
          communityId: { in: items.map((c) => c.id) },
        },
        select: { communityId: true, role: true },
      });
      membershipMap = Object.fromEntries(
        memberships.map((m) => [m.communityId, { role: m.role }]),
      );
    }

    const data = items.map((c) => {
      const membership = membershipMap[c.id];
      const isMember = !!membership;
      const isModerator =
        c.creatorId === userId ||
        (membership && ["ADMIN", "MODERATOR"].includes(membership.role)) ||
        false;
      return {
        ...c,
        isMember,
        isModerator,
        isPrivate: c.visibility === "PRIVATE",
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch communities", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/communities - create a community
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, category, visibility } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Community name is required" },
        { status: 400 },
      );
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    // Check slug uniqueness
    const existing = await prisma.community.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A community with this name already exists" },
        { status: 400 },
      );
    }

    const community = await prisma.$transaction(async (tx) => {
      const c = await tx.community.create({
        data: {
          name,
          slug,
          description: description || "",
          category: category || "GENERAL",
          visibility: visibility || "PUBLIC",
          creatorId: userId,
          memberCount: 1,
        },
      });

      await tx.communityMember.create({
        data: {
          communityId: c.id,
          userId,
          role: "ADMIN",
        },
      });

      return c;
    });

    return NextResponse.json({ data: community });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create community", detail: String(err) },
      { status: 500 },
    );
  }
}
