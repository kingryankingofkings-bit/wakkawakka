import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// POST /api/audio-rooms/[id]/speakers - Promote a listener/user to speaker
export async function POST(req: NextRequest, { params }: RouteContext) {
  const currentUserId = await getRequestUserId(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: roomId } = params;

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const room = await prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: {
        speakers: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Audio room not found" }, { status: 404 });
    }

    if (room.hostId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden: Only the host can promote speakers" }, { status: 403 });
    }

    const isAlreadySpeaker = room.speakers.some((s) => s.userId === userId);
    if (isAlreadySpeaker) {
      return NextResponse.json({ error: "User is already a speaker" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.audioRoomListener.deleteMany({
        where: { audioRoomId: roomId, userId },
      }),
      prisma.audioRoomSpeaker.create({
        data: {
          audioRoomId: roomId,
          userId,
          isMuted: false,
        },
      }),
    ]);

    return NextResponse.json({ message: "Promoted to speaker successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/audio-rooms/[id]/speakers - Mute/unmute speaker
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const currentUserId = await getRequestUserId(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: roomId } = params;

  try {
    const body = await req.json();
    const { userId, isMuted } = body;

    if (!userId || typeof isMuted !== "boolean") {
      return NextResponse.json({ error: "userId and isMuted (boolean) are required" }, { status: 400 });
    }

    const room = await prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Audio room not found" }, { status: 404 });
    }

    if (room.hostId !== currentUserId && userId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden: You cannot modify this speaker's mute status" }, { status: 403 });
    }

    const speakerRecord = await prisma.audioRoomSpeaker.findUnique({
      where: {
        audioRoomId_userId: {
          audioRoomId: roomId,
          userId,
        },
      },
    });

    if (!speakerRecord) {
      return NextResponse.json({ error: "Speaker not found in this room" }, { status: 404 });
    }

    const speaker = await prisma.audioRoomSpeaker.update({
      where: {
        audioRoomId_userId: {
          audioRoomId: roomId,
          userId,
        },
      },
      data: { isMuted },
    });

    return NextResponse.json({ speaker });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/audio-rooms/[id]/speakers - Demote/remove speaker
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const currentUserId = await getRequestUserId(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: roomId } = params;

  try {
    let userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch (e) {
        // no body
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const room = await prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Audio room not found" }, { status: 404 });
    }

    if (room.hostId !== currentUserId && userId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden: Only the host or the speaker themselves can demote/remove a speaker" }, { status: 403 });
    }

    const speakerRecord = await prisma.audioRoomSpeaker.findUnique({
      where: {
        audioRoomId_userId: {
          audioRoomId: roomId,
          userId,
        },
      },
    });

    if (!speakerRecord) {
      return NextResponse.json({ error: "Speaker not found in this room" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.audioRoomSpeaker.delete({
        where: {
          audioRoomId_userId: {
            audioRoomId: roomId,
            userId,
          },
        },
      }),
      prisma.audioRoomListener.upsert({
        where: {
          audioRoomId_userId: {
            audioRoomId: roomId,
            userId,
          },
        },
        update: {},
        create: {
          audioRoomId: roomId,
          userId,
        },
      }),
    ]);

    return NextResponse.json({ message: "Demoted to listener successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
