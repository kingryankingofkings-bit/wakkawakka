import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/members - List members
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const members = await prisma.serverMember.findMany({
      where: { serverId: id },
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
    });

    return NextResponse.json({ data: members, members });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch members", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/members - Join a server via invite code
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { inviteCode } = body;

    // Verify invite code matches this server
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { roles: true },
    });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    if (server.inviteCode !== inviteCode && !server.isPublic) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 },
      );
    }

    // Check if already a member
    let member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (member) {
      return NextResponse.json({ data: member, member });
    }

    // Add member
    member = await prisma.serverMember.create({
      data: {
        serverId,
        userId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Assign default @everyone role if it exists
    const everyoneRole = server.roles.find((r) => r.name === "@everyone");
    if (everyoneRole) {
      await prisma.serverMemberRole.create({
        data: {
          memberId: member.id,
          roleId: everyoneRole.id,
        },
      });
    }

    // Re-fetch member with updated roles
    const updatedMember = await prisma.serverMember.findUnique({
      where: { id: member.id },
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
    });

    return NextResponse.json({ data: updatedMember, member: updatedMember });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to join server", detail: String(err) },
      { status: 500 },
    );
  }
}

// PATCH /api/servers/[id]/members - Update nickname or roles
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { memberId, nickname, roleIds } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 },
      );
    }

    const member = await prisma.serverMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 1. Role Assignment Auth Check
    if (roleIds !== undefined) {
      const hasRolePerm = await checkPermission(
        userId,
        serverId,
        "MANAGE_ROLES",
      );
      if (!hasRolePerm) {
        return NextResponse.json(
          { error: "Forbidden. Requires MANAGE_ROLES permission." },
          { status: 403 },
        );
      }

      // Enforce hierarchy validation
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { ownerId: true },
      });
      let requesterHighest = 0;
      if (server?.ownerId === userId) {
        requesterHighest = Infinity;
      } else {
        const reqMember = await prisma.serverMember.findUnique({
          where: { serverId_userId: { serverId, userId } },
          include: { roles: { include: { role: true } } },
        });
        if (reqMember && reqMember.roles.length > 0) {
          requesterHighest = Math.max(
            ...reqMember.roles.map((mr) => mr.role.position),
          );
        }
      }

      const rolesToAssign = await prisma.serverRole.findMany({
        where: {
          id: { in: roleIds },
          serverId,
        },
      });

      for (const role of rolesToAssign) {
        if (role.position >= requesterHighest) {
          return NextResponse.json(
            {
              error:
                "Forbidden. Cannot assign a role with position higher than or equal to your own highest role.",
            },
            { status: 403 },
          );
        }
      }
    }

    // 2. Nickname Change Auth Check
    if (nickname !== undefined) {
      const isSelf = member.userId === userId;
      const hasNickPerm = await checkPermission(
        userId,
        serverId,
        "MANAGE_NICKNAMES",
      );
      if (!isSelf && !hasNickPerm) {
        return NextResponse.json(
          { error: "Forbidden. Requires MANAGE_NICKNAMES permission." },
          { status: 403 },
        );
      }
    }

    // Update nickname
    if (nickname !== undefined) {
      await prisma.serverMember.update({
        where: { id: memberId },
        data: { nickname },
      });
    }

    // Update roles
    if (roleIds !== undefined) {
      await prisma.$transaction(async (tx) => {
        // Clear current roles
        await tx.serverMemberRole.deleteMany({
          where: { memberId },
        });

        // Assign new roles
        for (const roleId of roleIds) {
          await tx.serverMemberRole.create({
            data: {
              memberId,
              roleId,
            },
          });
        }
      });
    }

    // Return updated member
    const updatedMember = await prisma.serverMember.findUnique({
      where: { id: memberId },
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
    });

    return NextResponse.json({ data: updatedMember, member: updatedMember });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update member", detail: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/servers/[id]/members - Leave or Kick/Ban a member
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try to get memberId from query parameters or request body
    const { searchParams } = new URL(req.url);
    let memberId = searchParams.get("memberId");

    if (!memberId) {
      try {
        const body = await req.json();
        memberId = body.memberId;
      } catch {
        // Body reading failed (e.g. empty body)
      }
    }

    let targetMember;
    if (memberId) {
      targetMember = await prisma.serverMember.findUnique({
        where: { id: memberId },
      });
    } else {
      // If no memberId is provided, assume leaving (self-directed)
      targetMember = await prisma.serverMember.findUnique({
        where: { serverId_userId: { serverId, userId } },
      });
    }

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const isSelf = targetMember.userId === userId;

    if (!isSelf) {
      // 1. Prevent kicking the server owner
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { ownerId: true },
      });
      if (targetMember.userId === server?.ownerId) {
        return NextResponse.json(
          { error: "Forbidden. Cannot kick the server owner." },
          { status: 403 },
        );
      }

      // 2. Requires KICK_MEMBERS or ADMIN
      const hasKickPerm = await checkPermission(
        userId,
        serverId,
        "KICK_MEMBERS",
      );
      if (!hasKickPerm) {
        return NextResponse.json(
          { error: "Forbidden. Requires KICK_MEMBERS permission." },
          { status: 403 },
        );
      }

      // 3. Prevent kicking members with higher or equal role positions compared to the requester
      let requesterHighest = 0;
      if (server?.ownerId === userId) {
        requesterHighest = Infinity;
      } else {
        const reqMember = await prisma.serverMember.findUnique({
          where: { serverId_userId: { serverId, userId } },
          include: { roles: { include: { role: true } } },
        });
        if (reqMember && reqMember.roles.length > 0) {
          requesterHighest = Math.max(
            ...reqMember.roles.map((mr) => mr.role.position),
          );
        }
      }

      let targetHighest = 0;
      if (server?.ownerId === targetMember.userId) {
        targetHighest = Infinity;
      } else {
        const targetMemberWithRoles = await prisma.serverMember.findUnique({
          where: { id: targetMember.id },
          include: { roles: { include: { role: true } } },
        });
        if (targetMemberWithRoles && targetMemberWithRoles.roles.length > 0) {
          targetHighest = Math.max(
            ...targetMemberWithRoles.roles.map((mr) => mr.role.position),
          );
        }
      }

      if (targetHighest >= requesterHighest) {
        return NextResponse.json(
          {
            error:
              "Forbidden. Cannot kick a member with higher or equal role position.",
          },
          { status: 403 },
        );
      }
    }

    await prisma.serverMember.delete({
      where: { id: targetMember.id },
    });

    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to remove member", detail: String(err) },
      { status: 500 },
    );
  }
}
