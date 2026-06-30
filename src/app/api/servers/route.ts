import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

// GET /api/servers - List servers
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const publicOnly = searchParams.get("publicOnly") === "true";

  try {
    const where: any = {};

    if (publicOnly) {
      where.isPublic = true;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const servers = await prisma.server.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
      },
    });

    return NextResponse.json({ data: servers, servers });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch servers", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers - Create server
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, iconUrl, isPublic } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Server name is required" },
        { status: 400 },
      );
    }

    // Generate a random 8-character invite code
    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    // Start a transaction to create server, default roles, and join owner
    const result = await prisma.$transaction(async (tx) => {
      const server = await tx.server.create({
        data: {
          name,
          description: description || null,
          iconUrl: iconUrl || null,
          isPublic: isPublic ?? false,
          ownerId: userId,
          inviteCode,
        },
      });

      // 1. Create Default @everyone Role (Position 0)
      const everyoneRole = await tx.serverRole.create({
        data: {
          serverId: server.id,
          name: "@everyone",
          color: "#99aab5",
          position: 0,
          permissions: JSON.stringify(["SEND_MESSAGES", "VIEW_CHANNEL"]),
        },
      });

      // 2. Create Admin Role (Position 1)
      const adminRole = await tx.serverRole.create({
        data: {
          serverId: server.id,
          name: "Admin",
          color: "#3b82f6",
          position: 1,
          permissions: JSON.stringify(["ADMIN"]),
        },
      });

      // 3. Create ServerMember for Owner
      const member = await tx.serverMember.create({
        data: {
          serverId: server.id,
          userId: userId,
        },
      });

      // 4. Assign Admin Role to Owner member
      await tx.serverMemberRole.create({
        data: {
          memberId: member.id,
          roleId: adminRole.id,
        },
      });

      // 5. Create a default "general" text channel
      const defaultChannel = await tx.serverChannel.create({
        data: {
          serverId: server.id,
          name: "general",
          type: "TEXT",
          position: 0,
        },
      });

      return { server, defaultChannel };
    });

    return NextResponse.json({
      data: result.server,
      server: result.server,
      defaultChannel: result.defaultChannel,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create server", detail: String(err) },
      { status: 500 },
    );
  }
}
