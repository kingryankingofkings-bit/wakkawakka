import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/live/streams/[id]/clips - Retrieve all clips for a stream
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;

  try {
    const clips = await prisma.clip.findMany({
      where: { liveStreamId: streamId },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ clips });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/live/streams/[id]/clips - Create a new clip
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: streamId } = params;
  const userId = getRequestUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, duration = 30 } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Clip title is required" },
        { status: 400 },
      );
    }

    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const clipId = Math.random().toString(36).substring(2, 15);
    const videoUrl = `https://wakkawakka-vods.s3.amazonaws.com/clips/clip-${clipId}.mp4`;
    const thumbnailUrl = `https://images.unsplash.com/photo-1542751371-adc38448a05e`;

    const clip = await prisma.clip.create({
      data: {
        title,
        duration: Number(duration),
        videoUrl,
        thumbnailUrl,
        creatorId: userId,
        liveStreamId: streamId,
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

    return NextResponse.json({ clip }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
