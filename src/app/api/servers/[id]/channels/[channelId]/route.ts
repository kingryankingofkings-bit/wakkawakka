import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; channelId: string }>;
}

// PATCH /api/servers/[id]/channels/[channelId] - Modify channel settings
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, channelId } = await params;
  const userId = await getRequestUserId(req);
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
    const { name, topic, position, permissionOverwrites } = body;

    const channel = await prisma.serverChannel.update({
      where: { id: channelId },
      data: {
        name:
          name !== undefined
            ? name.toLowerCase().replace(/\s+/g, "-")
            : undefined,
        topic: topic !== undefined ? topic : undefined,
        position: position !== undefined ? position : undefined,
        permissionOverwrites:
          permissionOverwrites !== undefined
            ? JSON.stringify(permissionOverwrites)
            : undefined,
      },
    });

    return NextResponse.json({ data: channel, channel });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update channel", detail: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/servers/[id]/channels/[channelId] - Delete channel
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, channelId } = await params;
  const userId = await getRequestUserId(req);
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

    // Do not allow deleting the "general" channel (optional safeguard)
    const channel = await prisma.serverChannel.findUnique({
      where: { id: channelId },
    });

    if (channel?.name === "general") {
      return NextResponse.json(
        { error: "Cannot delete default general channel" },
        { status: 400 },
      );
    }

    await prisma.serverChannel.delete({
      where: { id: channelId },
    });

    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete channel", detail: String(err) },
      { status: 500 },
    );
  }
}
