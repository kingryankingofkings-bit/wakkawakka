import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/reddit/subreddits/[id] (can be id or slug/name)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = getRequestUserId(req);

  try {
    const subreddit = await prisma.subreddit.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { name: id }],
      },
    });

    if (!subreddit) {
      return NextResponse.json({ error: "Subreddit not found" }, { status: 404 });
    }

    const members = await prisma.subredditMember.findMany({
      where: { subredditId: subreddit.id },
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
      data: subreddit,
      members,
      currentUserMember,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch subreddit", detail: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/reddit/subreddits/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const subreddit = await prisma.subreddit.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { name: id }],
      },
    });

    if (!subreddit) {
      return NextResponse.json({ error: "Subreddit not found" }, { status: 404 });
    }

    // Check permissions
    const member = await prisma.subredditMember.findUnique({
      where: {
        subredditId_userId: {
          subredditId: subreddit.id,
          userId,
        },
      },
    });

    const isAuthorized =
      subreddit.creatorId === userId ||
      (member && (member.role === "ADMIN" || member.role === "MODERATOR"));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { description, rules, customTheme, isNSFW, isSpoiler } = body;

    const updated = await prisma.subreddit.update({
      where: { id: subreddit.id },
      data: {
        description: description !== undefined ? description : subreddit.description,
        rules: rules !== undefined ? (Array.isArray(rules) ? JSON.stringify(rules) : rules) : subreddit.rules,
        customTheme: customTheme !== undefined ? (typeof customTheme === "object" ? JSON.stringify(customTheme) : customTheme) : subreddit.customTheme,
        isNSFW: isNSFW !== undefined ? !!isNSFW : subreddit.isNSFW,
        isSpoiler: isSpoiler !== undefined ? !!isSpoiler : subreddit.isSpoiler,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update subreddit", detail: err.message },
      { status: 500 }
    );
  }
}
