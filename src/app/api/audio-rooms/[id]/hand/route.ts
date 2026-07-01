import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

// PATCH /api/audio-rooms/[id]/hand - Raise/lower hand
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const currentUserId = await getRequestUserId(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: roomId } = params;

  try {
    const body = await req.json();
    const { handRaised } = body;

    if (typeof handRaised !== "boolean") {
      return NextResponse.json({ error: "handRaised (boolean) is required" }, { status: 400 });
    }

    const listener = await prisma.audioRoomListener.findUnique({
      where: {
        audioRoomId_userId: {
          audioRoomId: roomId,
          userId: currentUserId,
        },
      },
    });

    if (!listener) {
      return NextResponse.json({ error: "You are not a listener in this audio room" }, { status: 404 });
    }

    const updatedListener = await prisma.audioRoomListener.update({
      where: {
        audioRoomId_userId: {
          audioRoomId: roomId,
          userId: currentUserId,
        },
      },
      data: { handRaised },
    });

    return NextResponse.json({ listener: updatedListener });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
