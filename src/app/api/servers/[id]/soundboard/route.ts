import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/soundboard - List soundboard sounds
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  try {
    const sounds = await prisma.soundboardSound.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: sounds, sounds });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch soundboard sounds", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/soundboard - Upload/add soundboard sound
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, soundUrl, emoji } = body;

    if (!name || !soundUrl) {
      return NextResponse.json(
        { error: "Name and soundUrl are required" },
        { status: 400 },
      );
    }

    const sound = await prisma.soundboardSound.create({
      data: {
        serverId,
        userId,
        name,
        soundUrl,
        emoji: emoji || null,
      },
    });

    return NextResponse.json({ data: sound, sound });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add soundboard sound", detail: String(err) },
      { status: 500 },
    );
  }
}
