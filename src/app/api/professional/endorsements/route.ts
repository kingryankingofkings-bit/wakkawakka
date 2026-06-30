import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/endorsements - List endorsements for a user
export async function GET(req: NextRequest) {
  const actingUserId = getRequestUserId(req);
  const targetUserId = req.nextUrl.searchParams.get("userId") || req.nextUrl.searchParams.get("targetUserId") || actingUserId;

  if (!targetUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const endorsements = await prisma.endorsement.findMany({
      where: { targetUserId },
      include: {
        endorser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ data: endorsements });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch endorsements", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/endorsements - Endorse a skill
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { targetUserId, userId: bodyUserId, skill } = body;
    const targetId = targetUserId || bodyUserId;

    if (!targetId || !skill) {
      return NextResponse.json(
        { error: "targetUserId/userId and skill are required" },
        { status: 400 }
      );
    }

    if (targetId === userId) {
      return NextResponse.json(
        { error: "You cannot endorse your own skills" },
        { status: 400 }
      );
    }

    // Check if already endorsed
    const existing = await prisma.endorsement.findUnique({
      where: {
        targetUserId_endorserId_skill: {
          targetUserId: targetId,
          endorserId: userId,
          skill,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ data: existing }); // Already endorsed, return it
    }

    const endorsement = await prisma.endorsement.create({
      data: {
        targetUserId: targetId,
        endorserId: userId,
        skill,
      },
      include: {
        endorser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Create a notification for the target user
    try {
      const endorser = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true },
      });
      const endorserName = endorser?.displayName || endorser?.username || "Someone";

      await prisma.notification.create({
        data: {
          userId: targetId,
          actorId: userId,
          type: "SKILL_ENDORSEMENT",
          message: `${endorserName} endorsed your skill: ${skill}`,
          actionUrl: `/profile/${targetId}?tab=skills`,
          targetId: endorsement.id,
          targetType: "ENDORSEMENT",
        },
      });
    } catch (notifErr) {
      console.error("Failed to create endorsement notification", notifErr);
    }

    return NextResponse.json({ data: endorsement });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create endorsement", detail: String(err) },
      { status: 500 }
    );
  }
}

// DELETE /api/professional/endorsements - Remove an endorsement
export async function DELETE(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const targetUserId = req.nextUrl.searchParams.get("targetUserId") || req.nextUrl.searchParams.get("userId");
  const skill = req.nextUrl.searchParams.get("skill");

  if (!targetUserId || !skill) {
    return NextResponse.json(
      { error: "targetUserId and skill are required as query parameters" },
      { status: 400 }
    );
  }

  try {
    const endorsement = await prisma.endorsement.findUnique({
      where: {
        targetUserId_endorserId_skill: {
          targetUserId,
          endorserId: userId,
          skill,
        },
      },
    });

    if (!endorsement) {
      return NextResponse.json(
        { error: "Endorsement not found" },
        { status: 404 }
      );
    }

    await prisma.endorsement.delete({
      where: { id: endorsement.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete endorsement", detail: String(err) },
      { status: 500 }
    );
  }
}
