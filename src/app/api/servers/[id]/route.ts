import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id] - Fetch server details
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await getRequestUserId(req);

  try {
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        channels: {
          orderBy: { position: "asc" },
        },
        roles: {
          orderBy: { position: "asc" },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
        customEmojis: true,
        soundboardSounds: true,
      },
    });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Check if user is a member (optional, but good for private servers)
    if (!server.isPublic && userId) {
      const member = await prisma.serverMember.findUnique({
        where: { serverId_userId: { serverId: id, userId } },
      });
      if (!member && server.ownerId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ data: server, server });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch server details", detail: String(err) },
      { status: 500 },
    );
  }
}

// PATCH /api/servers/[id] - Update server settings
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check permission: requires ADMIN or MANAGE_SERVER
    const hasPerm = await checkPermission(userId, id, "MANAGE_SERVER");
    if (!hasPerm) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, iconUrl, bannerUrl, isPublic } = body;

    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        iconUrl: iconUrl !== undefined ? iconUrl : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
    });

    return NextResponse.json({ data: updatedServer, server: updatedServer });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update server", detail: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/servers/[id] - Delete server
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const server = await prisma.server.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Only the owner can delete the server
    if (server.ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden. Only the owner can delete the server." },
        { status: 403 },
      );
    }

    await prisma.server.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete server", detail: String(err) },
      { status: 500 },
    );
  }
}
