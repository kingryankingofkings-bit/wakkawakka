"use client";

import { useServer } from "@/hooks/useServer";
import { useSocket } from "@/hooks/useSocket";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface MemberListSidebarProps {
  serverId: string;
}

export function MemberListSidebar({ serverId }: MemberListSidebarProps) {
  const { members, roles } = useServer(serverId);
  const { onlineUsers } = useSocket();

  // Helper to determine if a member is online
  const isUserOnline = (userId: string) =>
    onlineUsers.has(userId) || userId === "u1"; // 'u1' is default user fallback

  // Group members into categories
  // Let's sort roles by position descending
  const _sortedRoles = [...roles].sort((a, b) => b.position - a.position);

  // Map members to their highest role
  const membersWithHighestRole = members.map((member) => {
    // Filter member roles from server role cache
    const memberRoleIds = member.roles.map((r) => r.role.id);
    const memberServerRoles = roles.filter((r) => memberRoleIds.includes(r.id));

    // Sort roles by position to find highest
    const highestRole =
      [...memberServerRoles].sort((a, b) => b.position - a.position)[0] || null;

    return {
      ...member,
      highestRole,
      isOnline: isUserOnline(member.userId),
    };
  });

  // Group by highest role or online/offline status
  const onlineMembers = membersWithHighestRole.filter((m) => m.isOnline);
  const offlineMembers = membersWithHighestRole.filter((m) => !m.isOnline);

  return (
    <div className="w-60 bg-muted/20 border-l border-border flex flex-col flex-shrink-0 h-full p-4 overflow-y-auto no-scrollbar">
      {/* Online List */}
      {onlineMembers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
            Online — {onlineMembers.length}
          </h3>
          <div className="space-y-2">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <Avatar src={member.user.avatar || ""} className="h-8 w-8" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div className="truncate text-sm">
                  <span
                    className="font-medium block truncate"
                    style={{ color: member.highestRole?.color || undefined }}
                  >
                    {member.nickname || member.user.displayName}
                  </span>
                  {member.highestRole && (
                    <span className="text-[10px] text-muted-foreground block -mt-0.5 leading-none">
                      {member.highestRole.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline List */}
      {offlineMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
            Offline — {offlineMembers.length}
          </h3>
          <div className="space-y-2">
            {offlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-muted/30 transition-colors group opacity-60 hover:opacity-100 cursor-pointer"
              >
                <Avatar
                  src={member.user.avatar || ""}
                  className="h-8 w-8 gray-scale"
                />
                <div className="truncate text-sm">
                  <span
                    className="font-medium block truncate"
                    style={{ color: member.highestRole?.color || undefined }}
                  >
                    {member.nickname || member.user.displayName}
                  </span>
                  {member.highestRole && (
                    <span className="text-[10px] text-muted-foreground block -mt-0.5 leading-none">
                      {member.highestRole.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
