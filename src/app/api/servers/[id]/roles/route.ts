import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/roles - List roles
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  try {
    const roles = await prisma.serverRole.findMany({
      where: { serverId },
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ data: roles, roles });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch roles", detail: String(err) },
      { status: 500 },
    );
  }
}

// POST /api/servers/[id]/roles - Create a new role
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: serverId } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hasPerm = await checkPermission(userId, serverId, "MANAGE_ROLES");
    if (!hasPerm) {
      return NextResponse.json(
        { error: "Forbidden. Requires MANAGE_ROLES" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, color, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    const count = await prisma.serverRole.count({ where: { serverId } });

    const role = await prisma.serverRole.create({
      data: {
        serverId,
        name,
        color: color || "#99aab5",
        position: count,
        permissions: permissions ? JSON.stringify(permissions) : "[]",
      },
    });

    return NextResponse.json({ data: role, role });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create role", detail: String(err) },
      { status: 500 },
    );
  }
}
