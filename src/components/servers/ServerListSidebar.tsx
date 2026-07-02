"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Compass, Home } from "lucide-react";
import { useServerStore } from "@/store/serverStore";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

import { apiFetch } from "@/lib/apiClient";

export function ServerListSidebar({ _className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    servers,
    setServers,
    addServer,
    activeServerId,
    setActiveServerId,
    _removeServer,
  } = useServerStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverDesc, setServerDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    // Fetch user joined servers
    const fetchServers = async () => {
      try {
        const res = await apiFetch("/api/servers");
        if (res.ok) {
          const data = await res.json();
          setServers(data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchServers();
  }, [setServers]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    try {
      const res = await apiFetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serverName,
          description: serverDesc,
          isPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addServer(data.data);
        setShowCreateModal(false);
        setServerName("");
        setServerDesc("");
        setIsPublic(false);

        // Redirect to default channel of new server
        router.push(`/servers/${data.data.id}/${data.defaultChannel.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-[72px] bg-background border-r border-border flex flex-col items-center py-3 space-y-2 flex-shrink-0 z-30 h-full">
      {/* Home Button (DMs) */}
      <Link
        href="/messages"
        aria-label="Direct Messages"
        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-muted hover:bg-primary transition-all duration-200 flex items-center justify-center group"
      >
        <Home className="h-5 w-5 text-foreground group-hover:text-primary-foreground transition-colors duration-200" />
      </Link>

      <div className="w-8 h-[2px] bg-border my-1 rounded" />

      {/* Servers List */}
      <div className="flex-1 w-full space-y-2 overflow-y-auto no-scrollbar flex flex-col items-center">
        {servers.map((server) => {
          const isActive = server.id === activeServerId;
          const initials = server.name.substring(0, 2).toUpperCase();

          return (
            <div
              key={server.id}
              className="relative group flex items-center justify-center w-full"
            >
              {/* Left Indicator bar */}
              <div
                className={cn(
                  "absolute left-0 w-1 bg-foreground rounded-r transition-all duration-200 origin-left",
                  isActive ? "h-10" : "h-0 group-hover:h-5",
                )}
              />
              <Link
                href={`/servers/${server.id}`}
                onClick={() => setActiveServerId(server.id)}
                className={cn(
                  "w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-muted hover:bg-primary transition-all duration-200 flex items-center justify-center overflow-hidden font-bold text-sm",
                  isActive &&
                    "rounded-[16px] bg-primary text-primary-foreground",
                )}
              >
                {server.iconUrl ? (
                  <Image
                    src={server.iconUrl}
                    alt={server.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span
                    className={cn(
                      "text-muted-foreground group-hover:text-primary-foreground",
                      isActive && "text-primary-foreground",
                    )}
                  >
                    {initials}
                  </span>
                )}
              </Link>
            </div>
          );
        })}

        {/* Create Server Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          aria-label="Create a Server"
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-muted hover:bg-green-500 transition-all duration-200 flex items-center justify-center group"
        >
          <Plus className="h-5 w-5 text-foreground group-hover:text-white transition-colors duration-200" />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-border my-1 rounded" />

      {/* Server Discovery Compass */}
      <Link
        href="/servers"
        onClick={() => setActiveServerId(null)}
        aria-label="Discover Public Servers"
        className={cn(
          "w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-muted hover:bg-primary transition-all duration-200 flex items-center justify-center group",
          pathname === "/servers" &&
            "rounded-[16px] bg-primary text-primary-foreground",
        )}
      >
        <Compass
          className={cn(
            "h-5 w-5 text-foreground group-hover:text-primary-foreground transition-colors duration-200",
            pathname === "/servers" && "text-primary-foreground",
          )}
        />
      </Link>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Your Server"
      >
        <form onSubmit={handleCreateServer} className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Server Name
            </label>
            <input
              type="text"
              required
              placeholder="My Awesome Server"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Description
            </label>
            <textarea
              placeholder="Describe your server..."
              value={serverDesc}
              onChange={(e) => setServerDesc(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm h-20 resize-none"
            />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-b border-border">
            <div>
              <span className="text-sm font-semibold block">Public Server</span>
              <span className="text-xs text-muted-foreground">
                Anyone can discover and join this server
              </span>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-sm font-semibold transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
