import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/forum/subforums/[id] (can be id or slug/name)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = await getRequestUserId(req);

  try {
    const subforum = await prisma.subforum.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { name: id }],
      },
    });

    if (!subforum) {
      return NextResponse.json({ error: "Subforum not found" }, { status: 404 });
    }

    const members = await prisma.subforumMember.findMany({
      where: { subforumId: subforum.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Determine current user member/role info
    let currentUserMember = null;
    if (userId) {
      currentUserMember = members.find((m) => m.userId === userId) || null;
    }

    return NextResponse.json({
      data: subforum,
      members,
      currentUserMember,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch subforum", detail: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/forum/subforums/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const subforum = await prisma.subforum.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { name: id }],
      },
    });

    if (!subforum) {
      return NextResponse.json({ error: "Subforum not found" }, { status: 404 });
    }

    // Check permissions
    const member = await prisma.subforumMember.findUnique({
      where: {
        subforumId_userId: {
          subforumId: subforum.id,
          userId,
        },
      },
    });

    const isAuthorized =
      subforum.creatorId === userId ||
      (member && (member.role === "ADMIN" || member.role === "MODERATOR"));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { description, rules, customTheme, isNSFW, isSpoiler } = body;

    const updated = await prisma.subforum.update({
      where: { id: subforum.id },
      data: {
        description: description !== undefined ? description : subforum.description,
        rules: rules !== undefined ? (Array.isArray(rules) ? JSON.stringify(rules) : rules) : subforum.rules,
        customTheme: customTheme !== undefined ? (typeof customTheme === "object" ? JSON.stringify(customTheme) : customTheme) : subforum.customTheme,
        isNSFW: isNSFW !== undefined ? !!isNSFW : subforum.isNSFW,
        isSpoiler: isSpoiler !== undefined ? !!isSpoiler : subforum.isSpoiler,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update subforum", detail: err.message },
      { status: 500 }
    );
  }
}
