import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/professional/recommendations - Fetch recommendations
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const writerId = req.nextUrl.searchParams.get("writerId");
  const status = req.nextUrl.searchParams.get("status");

  try {
    const whereClause: any = {};
    if (userId) {
      whereClause.receiverId = userId;
    }
    if (writerId) {
      whereClause.writerId = writerId;
    }
    if (status) {
      whereClause.status = status;
    }

    const recommendations = await prisma.recommendation.findMany({
      where: whereClause,
      include: {
        writer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        receiver: {
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
    const formatted = recommendations.map((r) => ({
      id: r.id,
      text: r.text,
      writerId: r.writerId,
      writerName: r.writer?.displayName || r.writer?.username || "Unknown",
      writerAvatar: r.writer?.avatar,
      receiverId: r.receiverId,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch recommendations", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST /api/professional/recommendations - Request or Write a recommendation
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { writerId, receiverId, recommendationId, id, text, message, relationship, type } = body;

    // 1. Fulfilling a request
    const recId = recommendationId || id;
    if (recId) {
      const existing = await prisma.recommendation.findUnique({
        where: { id: recId },
      });

      if (!existing) {
        return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
      }

      if (existing.writerId !== userId) {
        return NextResponse.json({ error: "Forbidden: You are not the assigned writer" }, { status: 403 });
      }

      const updated = await prisma.recommendation.update({
        where: { id: recId },
        data: {
          text: text || message || "",
          status: "PENDING", // PENDING approval by the receiver
        },
        include: { writer: true },
      });

      return NextResponse.json({ data: updated });
    }

    // 2. Requesting a recommendation
    if (type === "REQUEST" || writerId) {
      const targetWriterId = writerId || receiverId; // Fallback mapping
      if (!targetWriterId) {
        return NextResponse.json({ error: "writerId is required to request a recommendation" }, { status: 400 });
      }

      const recommendation = await prisma.recommendation.create({
        data: {
          requesterId: userId,
          receiverId: userId, // The requester wants to receive it
          writerId: targetWriterId,
          text: message || text || "",
          relationship,
          status: "REQUESTED",
        },
        include: { writer: true },
      });

      // Create notification for writer
      try {
        const requester = await prisma.profile.findUnique({
          where: { id: userId },
          select: { displayName: true, username: true },
        });
        const requesterName = requester?.displayName || requester?.username || "Someone";

        await prisma.notification.create({
          data: {
            userId: targetWriterId,
            actorId: userId,
            type: "RECOMMENDATION_REQUEST",
            message: `${requesterName} requested a recommendation from you`,
            actionUrl: `/profile/${userId}?tab=recommendations`,
            targetId: recommendation.id,
            targetType: "RECOMMENDATION",
          },
        });
      } catch (notifErr) {}

      return NextResponse.json({ data: recommendation });
    }

    // 3. Writing (unsolicited) recommendation
    if (type === "WRITE" || receiverId) {
      if (!receiverId) {
        return NextResponse.json({ error: "receiverId is required to write a recommendation" }, { status: 400 });
      }

      const recommendation = await prisma.recommendation.create({
        data: {
          writerId: userId,
          receiverId,
          text: text || message || "",
          relationship,
          status: "PENDING", // needs to be approved by receiver
        },
        include: { writer: true },
      });

      // Notify receiver
      try {
        const writer = await prisma.profile.findUnique({
          where: { id: userId },
          select: { displayName: true, username: true },
        });
        const writerName = writer?.displayName || writer?.username || "Someone";

        await prisma.notification.create({
          data: {
            userId: receiverId,
            actorId: userId,
            type: "RECOMMENDATION_WRITTEN",
            message: `${writerName} wrote you a recommendation. Approve it to show on your profile.`,
            actionUrl: `/profile/${receiverId}?tab=recommendations`,
            targetId: recommendation.id,
            targetType: "RECOMMENDATION",
          },
        });
      } catch (notifErr) {}

      // Format for Zustand store expected fields
      const formatted = {
        id: recommendation.id,
        text: recommendation.text,
        writerId: recommendation.writerId,
        writerName: recommendation.writer?.displayName || recommendation.writer?.username || "Unknown",
        writerAvatar: recommendation.writer?.avatar,
        receiverId: recommendation.receiverId,
        status: recommendation.status,
        createdAt: recommendation.createdAt.toISOString(),
      };

      return NextResponse.json({ data: formatted });
    }

    return NextResponse.json({ error: "Invalid recommendation payload" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create recommendation", detail: String(err) },
      { status: 500 }
    );
  }
}

// Helper to approve/reject
async function handleUpdate(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recommendationId, id, status } = body;
    const recId = recommendationId || id;

    if (!recId || !status) {
      return NextResponse.json(
        { error: "recommendationId/id and status are required" },
        { status: 400 }
      );
    }

    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recId },
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    if (recommendation.receiverId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Only the receiver can approve/reject a recommendation" },
        { status: 403 }
      );
    }

    const updated = await prisma.recommendation.update({
      where: { id: recId },
      data: { status },
      include: { writer: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update recommendation", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}
