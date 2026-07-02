import { useServerStore } from "@/store/serverStore";
import { useAuthStore } from "@/store/authStore";

export function useServerPermissions(serverId: string) {
  const servers = useServerStore((s) => s.servers);
  const serverMembers = useServerStore((s) => s.members[serverId]) || [];
  const currentUser = useAuthStore((s) => s.user);

  const server = servers.find((s) => s.id === serverId);
  const member = serverMembers.find((m) => m.userId === currentUser?.id);

  const isOwner = server?.ownerId === currentUser?.id;

  const hasPermission = (permission: string): boolean => {
    if (isOwner) return true;
    if (!member) return false;

    return member.roles.some((mr: any) => {
      const perms = mr.role.permissions || [];
      return (
        perms.includes("ADMIN") ||
        perms.includes("ADMINISTRATOR") ||
        perms.includes(permission)
      );
    });
  };

  return {
    hasPermission,
    isOwner,
    member,
  };
}
