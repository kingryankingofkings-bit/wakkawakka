import { useServerStore } from "@/store/serverStore";
import { useAuthStore } from "@/store/authStore";

export function useServerPermissions(serverId: string) {
  const store = useServerStore();
  const currentUser = useAuthStore((s) => s.user);

  const server = store.servers.find((s) => s.id === serverId);
  const members = store.members[serverId] || [];
  const member = members.find((m) => m.userId === currentUser?.id);

  const isOwner = server?.ownerId === currentUser?.id;

  const hasPermission = (permission: string): boolean => {
    if (isOwner) return true;
    if (!member) return false;

    return member.roles.some((mr) => {
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
