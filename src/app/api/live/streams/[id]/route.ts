import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/live/streams/[id] - Fetch details of a single stream
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = params;

  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
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
        predictions: {
          include: {
            options: true,
          },
        },
        clips: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    return NextResponse.json({ stream });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/live/streams/[id] - Update stream details / end stream
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = params;
  const userId = await getRequestUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Only host can update the stream
    if (stream.hostId !== userId) {
      return NextResponse.json(
        { error: "Only the host can modify this stream" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { title, description, category, tags, isActive } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    // If active stream is being ended
    if (isActive === false && stream.isActive) {
      updateData.isActive = false;
      updateData.isRecorded = true;
      updateData.endedAt = new Date();
      updateData.recordingUrl = `https://wakkawakka-vods.s3.amazonaws.com/recorded-${id}.mp4`;
    } else if (isActive === true && !stream.isActive) {
      // If a scheduled stream is going live
      updateData.isActive = true;
      updateData.startedAt = new Date();
    }

    const updatedStream = await prisma.liveStream.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ stream: updatedStream });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
