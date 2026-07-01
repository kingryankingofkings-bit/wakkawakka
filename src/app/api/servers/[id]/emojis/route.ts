import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/emojis - List custom emojis
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  try {
    const emojis = await prisma.customEmoji.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: emojis, emojis });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch custom emojis", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/emojis - Add custom emoji
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, imageUrl } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: "Name and imageUrl are required" },
        { status: 400 },
      );
    }

    const emoji = await prisma.customEmoji.create({
      data: {
        serverId,
        userId,
        name,
        imageUrl,
      },
    });

    return NextResponse.json({ data: emoji, emoji });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add custom emoji", detail: String(err) },
      { status: 500 },
    );
  }
}
