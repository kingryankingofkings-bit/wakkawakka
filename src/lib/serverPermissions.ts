import { prisma } from "@/lib/prisma";

/**
 * Checks if a user has a specific permission in a server.
 * Server owner and members with ADMIN/ADMINISTRATOR role bypass all checks.
 */
export async function checkPermission(
  userId: string,
  serverId: string,
  requiredPermission: string,
  channelId?: string,
): Promise<boolean> {
  // 1. Fetch server and verify owner
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) return false;
  if (server.ownerId === userId) return true; // Owner has all permissions

  // 2. Fetch member with their roles
  const member = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId, userId } },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!member) return false;

  // 3. Aggregate all permissions
  const permissions = new Set<string>();

  for (const memberRole of member.roles) {
    try {
      const rolePermissions: string[] = JSON.parse(
        memberRole.role.permissions || "[]",
      );
      rolePermissions.forEach((p) => permissions.add(p));
    } catch {
      // Ignore JSON parse errors
    }
  }

  // 4. Admin permission bypasses other checks
  if (permissions.has("ADMIN") || permissions.has("ADMINISTRATOR")) return true;

  // 5. Evaluate channel-level overrides if channelId is provided
  if (channelId) {
    const channel = await prisma.serverChannel.findUnique({
      where: { id: channelId },
      select: { permissionOverwrites: true },
    });

    if (channel) {
      let overwrites: any[] = [];
      try {
        overwrites = JSON.parse(channel.permissionOverwrites || "[]");
      } catch {
        // Ignore JSON parse errors
      }

      const memberRoleIds = member.roles.map((r) => r.role.id);

      // MEMBER overrides take highest precedence
      const memberOverwrites = overwrites.filter(
        (ow) =>
          ow.type === "MEMBER" && (ow.id === userId || ow.id === member.id),
      );

      let hasMemberDeny = false;
      let hasMemberAllow = false;
      for (const ow of memberOverwrites) {
        const allowArr = Array.isArray(ow.allow) ? ow.allow : [];
        const denyArr = Array.isArray(ow.deny) ? ow.deny : [];
        if (denyArr.includes(requiredPermission)) hasMemberDeny = true;
        if (allowArr.includes(requiredPermission)) hasMemberAllow = true;
      }

      if (hasMemberDeny) return false;
      if (hasMemberAllow) return true;

      // ROLE overrides
      const roleOverwrites = overwrites.filter(
        (ow) => ow.type === "ROLE" && memberRoleIds.includes(ow.id),
      );

      let hasRoleDeny = false;
      let hasRoleAllow = false;
      for (const ow of roleOverwrites) {
        const allowArr = Array.isArray(ow.allow) ? ow.allow : [];
        const denyArr = Array.isArray(ow.deny) ? ow.deny : [];
        if (denyArr.includes(requiredPermission)) hasRoleDeny = true;
        if (allowArr.includes(requiredPermission)) hasRoleAllow = true;
      }

      if (hasRoleDeny) return false;
      if (hasRoleAllow) return true;
    }
  }

  // 6. Evaluate target permission (server-wide fallback)
  return permissions.has(requiredPermission);
}
