import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { checkPermission } from "@/lib/serverPermissions";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; roleId: string }>;
}

// PATCH /api/servers/[id]/roles/[roleId] - Update role details
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, roleId } = await params;
  const userId = getRequestUserId(req);
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
    const { name, color, hoist, permissions, position } = body;

    const role = await prisma.serverRole.update({
      where: { id: roleId },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
        hoist: hoist !== undefined ? hoist : undefined,
        permissions:
          permissions !== undefined ? JSON.stringify(permissions) : undefined,
        position: position !== undefined ? position : undefined,
      },
    });

    return NextResponse.json({ data: role, role });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update role", detail: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/servers/[id]/roles/[roleId] - Delete role
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, roleId } = await params;
  const userId = getRequestUserId(req);
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

    const role = await prisma.serverRole.findUnique({
      where: { id: roleId },
    });

    if (role?.name === "@everyone") {
      return NextResponse.json(
        { error: "Cannot delete default everyone role" },
        { status: 400 },
      );
    }

    await prisma.serverRole.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete role", detail: String(err) },
      { status: 500 },
    );
  }
}
