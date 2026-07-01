import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, validateRequest } from "@/lib/apiValidation";
import {
  apiSuccess,
  apiInternalError,
} from "@/lib/apiResponse";
import { createLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const log = createLogger("ServersAPI");

// Zod validation schema for creating a server
const createServerSchema = z.object({
  name: z.string().min(1, "Server name is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
});

// GET /api/servers - List servers
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const publicOnly = searchParams.get("publicOnly") === "true";

  try {
    const where: {
      isPublic?: boolean;
      OR?: Array<{ name?: { contains: string }; description?: { contains: string } }>;
    } = {};

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
    log.error("Failed to fetch servers", { error: err });
    return apiInternalError("Failed to fetch servers");
  }
}

// POST /api/servers - Create server
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const userId = auth.userId;

  try {
    const body = await req.json();

    // Validate request body
    const validation = validateRequest(createServerSchema, body);
    if (!validation.success) return validation.response;
    const { name, description, iconUrl, isPublic } = validation.data;

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

    return apiSuccess(
      {
        ...result.server,
        defaultChannel: result.defaultChannel,
      },
      201,
    );
  } catch (err) {
    log.error("Failed to create server", { error: err });
    return apiInternalError("Failed to create server");
  }
}
