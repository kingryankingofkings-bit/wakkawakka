import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/communities/[id] - fetch community detail by id or slug
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
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

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    const userId = await getRequestUserId(req);
    let isMember = false;
    let isModerator = false;

    if (userId) {
      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      });
      isMember = !!member;
      isModerator =
        community.creatorId === userId ||
        (member && ["ADMIN", "MODERATOR"].includes(member.role)) ||
        false;
    }

    return NextResponse.json({
      data: {
        ...community,
        isMember,
        isModerator,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch community", detail: String(err) },
      { status: 500 },
    );
  }
}

// PATCH /api/communities/[id] - edit description, rules, visibility, avatarUrl, coverImage
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const community = await prisma.community.findUnique({
      where: { id: params.id },
    });
    if (!community)
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: params.id, userId } },
    });

    const isPrivileged =
      community.creatorId === userId ||
      (member && ["ADMIN", "MODERATOR"].includes(member.role));
    if (!isPrivileged)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      description,
      rules,
      visibility,
      avatarUrl,
      coverImage,
      name,
      category,
    } = body;

    const updated = await prisma.community.update({
      where: { id: params.id },
      data: {
        description: description !== undefined ? description : undefined,
        rules: rules !== undefined ? rules : undefined,
        visibility: visibility !== undefined ? visibility : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined,
        name: name !== undefined ? name : undefined,
        category: category !== undefined ? category : undefined,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update community", detail: String(err) },
      { status: 500 },
    );
  }
}
