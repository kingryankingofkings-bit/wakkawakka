import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/live/streams?status=active|scheduled|recorded&category=xxx
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const category = req.nextUrl.searchParams.get("category");

  try {
    const where: any = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "scheduled") {
      where.isActive = false;
      where.isRecorded = false;
      where.scheduledAt = { not: null };
    } else if (status === "recorded" || status === "vod") {
      where.isRecorded = true;
    }

    if (category) {
      where.category = { equals: category };
    }

    const streams = await prisma.liveStream.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
        coHosts: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ streams });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/live/streams - Create or schedule a stream
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, tags, scheduledAt } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const streamKey = `live_sk_${Math.random().toString(36).substring(2, 15)}`;
    const playbackUrl = `rtmp://live.wakkawakka.com/app/${streamKey}`;

    const isScheduled = !!scheduledAt;

    const stream = await prisma.liveStream.create({
      data: {
        hostId: userId,
        title,
        description: description || null,
        category: category || null,
        tags: tags ? JSON.stringify(tags) : "[]",
        isActive: !isScheduled,
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        startedAt: !isScheduled ? new Date() : null,
        streamKey,
        playbackUrl,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ stream }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
