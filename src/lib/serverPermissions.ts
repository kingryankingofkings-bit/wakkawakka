import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

// =============================================================================
// WakkaWakka — Server Permission Checking
// Server owner and members with ADMIN/ADMINISTRATOR role bypass all checks.
// =============================================================================

const log = createLogger("Permissions");

/** Schema for a single permission overwrite entry stored as JSON. */
const permissionOverwriteSchema = z.object({
  type: z.enum(["MEMBER", "ROLE"]),
  id: z.string(),
  allow: z.array(z.string()).default([]),
  deny: z.array(z.string()).default([]),
});

type PermissionOverwrite = z.infer<typeof permissionOverwriteSchema>;

/**
 * Safely parse a JSON permission overwrites string into typed objects.
 * Returns an empty array on invalid input instead of crashing.
 */
function parseOverwrites(raw: string | null | undefined): PermissionOverwrite[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const results: PermissionOverwrite[] = [];
    for (const item of parsed) {
      const result = permissionOverwriteSchema.safeParse(item);
      if (result.success) {
        results.push(result.data);
      } else {
        log.warn("Invalid permission overwrite entry skipped", {
          data: { item, errors: result.error.issues },
        });
      }
    }
    return results;
  } catch (err) {
    log.warn("Failed to parse permission overwrites JSON", { error: err });
    return [];
  }
}

/**
 * Safely parse a JSON role permissions string into an array of permission names.
 */
function parseRolePermissions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string");
  } catch (err) {
    log.warn("Failed to parse role permissions JSON", { error: err });
    return [];
  }
}

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

  // 3. Aggregate all permissions from roles
  const permissions = new Set<string>();

  for (const memberRole of member.roles) {
    const rolePermissions = parseRolePermissions(memberRole.role.permissions);
    rolePermissions.forEach((p) => permissions.add(p));
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
      const overwrites = parseOverwrites(channel.permissionOverwrites);
      const memberRoleIds = member.roles.map((r) => r.role.id);

      // MEMBER overrides take highest precedence
      const memberOverwrites = overwrites.filter(
        (ow) =>
          ow.type === "MEMBER" && (ow.id === userId || ow.id === member.id),
      );

      let hasMemberDeny = false;
      let hasMemberAllow = false;
      for (const ow of memberOverwrites) {
        if (ow.deny.includes(requiredPermission)) hasMemberDeny = true;
        if (ow.allow.includes(requiredPermission)) hasMemberAllow = true;
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
        if (ow.deny.includes(requiredPermission)) hasRoleDeny = true;
        if (ow.allow.includes(requiredPermission)) hasRoleAllow = true;
      }

      if (hasRoleDeny) return false;
      if (hasRoleAllow) return true;
    }
  }

  // 6. Evaluate target permission (server-wide fallback)
  return permissions.has(requiredPermission);
}
