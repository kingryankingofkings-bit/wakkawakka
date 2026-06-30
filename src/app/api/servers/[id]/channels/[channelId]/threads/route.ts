import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; channelId: string }>;
}

// POST /api/servers/[id]/channels/[channelId]/threads - Start a thread
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, channelId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify membership
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this server" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, messageId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Thread name is required" },
        { status: 400 },
      );
    }

    // Get active channel count for positioning
    const count = await prisma.serverChannel.count({
      where: { serverId },
    });

    const thread = await prisma.serverChannel.create({
      data: {
        serverId,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: "THREAD",
        parentId: channelId,
        topic: messageId ? `Thread started from message ${messageId}` : null,
        position: count,
      },
    });

    return NextResponse.json({ data: thread, thread });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to start thread", detail: String(err) },
      { status: 500 },
    );
  }
}
