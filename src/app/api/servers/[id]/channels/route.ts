import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/channels - Fetch server channels
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  try {
    const channels = await prisma.serverChannel.findMany({
      where: { serverId },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ data: channels, channels });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch channels", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/channels - Create a channel
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hasPerm = await checkPermission(userId, serverId, "MANAGE_CHANNELS");
    if (!hasPerm) {
      return NextResponse.json(
        { error: "Forbidden. Requires MANAGE_CHANNELS permission." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, type, parentId, topic } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 },
      );
    }

    // Get active channel count for positioning
    const count = await prisma.serverChannel.count({
      where: { serverId },
    });

    const channel = await prisma.serverChannel.create({
      data: {
        serverId,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: type || "TEXT",
        parentId: parentId || null,
        topic: topic || null,
        position: count,
      },
    });

    return NextResponse.json({ data: channel, channel });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create channel", detail: String(err) },
      { status: 500 },
    );
  }
}
