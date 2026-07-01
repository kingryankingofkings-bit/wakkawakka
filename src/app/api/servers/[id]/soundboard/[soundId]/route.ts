import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
    soundId: string;
  }>;
}

// DELETE /api/servers/[id]/soundboard/[soundId] - Delete soundboard sound
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const currentUserId = await getRequestUserId(req);
  if (!currentUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id: serverId, soundId } = await params;

    const sound = await prisma.soundboardSound.findUnique({
      where: { id: soundId },
      include: {
        server: true,
      },
    });

    if (!sound) {
      return NextResponse.json({ error: "Sound not found" }, { status: 404 });
    }

    if (sound.serverId !== serverId) {
      return NextResponse.json({ error: "Sound does not belong to this server" }, { status: 400 });
    }

    // Ensure only the sound uploader or server owner can delete it
    const isUploader = sound.userId === currentUserId;
    const isServerOwner = sound.server.ownerId === currentUserId;

    if (!isUploader && !isServerOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the sound uploader or the server owner can delete this sound" },
        { status: 403 }
      );
    }

    await prisma.soundboardSound.delete({
      where: { id: soundId },
    });

    return NextResponse.json({ message: "Sound deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
