import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// POST /api/audio-rooms/[id]/listeners - Join as listener
export async function POST(req: NextRequest, { params }: RouteContext) {
  const currentUserId = await getRequestUserId(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: roomId } = params;

  try {
    const room = await prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: {
        speakers: true,
        listeners: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Audio room not found" }, { status: 404 });
    }

    const isAlreadySpeaker = room.speakers.some((s) => s.userId === currentUserId);
    const isAlreadyListener = room.listeners.some((l) => l.userId === currentUserId);

    if (isAlreadyListener) {
      return NextResponse.json({ message: "Already in room as listener" });
    }

    if (isAlreadySpeaker) {
      await prisma.$transaction([
        prisma.audioRoomSpeaker.delete({
          where: {
            audioRoomId_userId: {
              audioRoomId: roomId,
              userId: currentUserId,
            },
          },
        }),
        prisma.audioRoomListener.create({
          data: {
            audioRoomId: roomId,
            userId: currentUserId,
            handRaised: false,
          },
        }),
      ]);
    } else {
      await prisma.audioRoomListener.create({
        data: {
          audioRoomId: roomId,
          userId: currentUserId,
          handRaised: false,
        },
      });
    }

    return NextResponse.json({ message: "Joined as listener successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/audio-rooms/[id]/listeners - Leave/remove listener
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
      userId = currentUserId; // default to self leaving
    }

    const room = await prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Audio room not found" }, { status: 404 });
    }

    if (userId !== currentUserId && room.hostId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden: Only the host can remove other listeners" }, { status: 403 });
    }

    await prisma.audioRoomListener.deleteMany({
      where: {
        audioRoomId: roomId,
        userId,
      },
    });

    return NextResponse.json({ message: "Listener left/removed successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
