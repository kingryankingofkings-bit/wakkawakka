"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Search, UserPlus, LogIn, Server } from "lucide-react";
import { ServerListSidebar } from "@/components/servers/ServerListSidebar";
import { useServerStore } from "@/store/serverStore";
import { apiFetch } from "@/lib/apiClient";

export default function DiscoverServersPage() {
  const router = useRouter();
  const { addServer } = useServerStore();
  const [publicServers, setPublicServers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPublicServers = async (query = "") => {
    try {
      const res = await apiFetch(`/api/servers?publicOnly=true&query=${query}`);
      if (res.ok) {
        const data = await res.json();
        setPublicServers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPublicServers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicServers(searchQuery);
  };

  const handleJoinViaInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Find server using invite code by searching public ones first or hitting the members endpoint
      // We can post to `/api/servers/join` or `/api/servers/[id]/members`
      // Wait, we designed `/api/servers/[id]/members` with POST payload `{ inviteCode }`.
      // Since we don't know the server ID from the invite code directly in this route,
      // let's fetch all servers to find the one matching inviteCode, or we can look it up.
      // Wait! We can search all servers to locate the ID first.
      const searchRes = await apiFetch(`/api/servers?query=${inviteCode}`);
      if (!searchRes.ok) throw new Error("Invite check failed");
      const searchData = await searchRes.json();
      const serverMatch = (searchData.data || []).find(
        (s: any) => s.inviteCode === inviteCode.toUpperCase(),
      );

      if (!serverMatch) {
        setError("No server found with that invite code");
        setLoading(false);
        return;
      }

      // Join the server
      const joinRes = await apiFetch(`/api/servers/${serverMatch.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });

      if (joinRes.ok) {
        const joinData = await joinRes.json();
        addServer(serverMatch);
        // Navigate to server general channel (which was returned when creating or detail API)
        router.push(`/servers/${serverMatch.id}`);
      } else {
        const errData = await joinRes.json();
        setError(errData.error || "Failed to join server");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPublicServer = async (
    serverId: string,
    inviteCodeStr: string,
  ) => {
    try {
      const res = await apiFetch(`/api/servers/${serverId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCodeStr }),
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh servers state and redirect
        const serversRes = await apiFetch("/api/servers");
        if (serversRes.ok) {
          const sData = await serversRes.json();
          useServerStore.getState().setServers(sData.data || []);
        }
        router.push(`/servers/${serverId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Column 1: Server List Icons */}
      <ServerListSidebar />

      {/* Main Discover Layout */}
      <div className="flex-1 flex flex-col overflow-y-auto p-8 space-y-8 max-w-4xl mx-auto w-full">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-background border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Discover Communities
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Find and join public servers that fit your interests. Chat, speak,
              and hang out with friends.
            </p>
          </div>
          <Compass className="h-24 w-24 text-primary/30 flex-shrink-0" />
        </div>

        {/* Join via Invite Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-1.5 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Join Server via Invite Code
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Enter an invite code to join a private or public server instantly.
          </p>
          <form
            onSubmit={handleJoinViaInvite}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              required
              placeholder="e.g. WAKKADEV"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono font-bold placeholder:font-sans placeholder:font-normal uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Joining..." : "Join Server"}
            </button>
          </form>
          {error && (
            <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>
          )}
        </div>

        {/* Search & Public Server Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              Featured Public Servers
            </h2>
            <form
              onSubmit={handleSearchSubmit}
              className="relative max-w-xs w-full"
            >
              <input
                type="text"
                placeholder="Search public servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </form>
          </div>

          {publicServers.length === 0 ? (
            <div className="h-48 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
              <Compass className="h-10 w-10 mb-2 animate-spin duration-3000" />
              <p className="text-sm">
                No public servers discovered matching search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publicServers.map((server) => (
                <div
                  key={server.id}
                  className="bg-card border border-border hover:border-primary/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-base border border-primary/10">
                        {server.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-sm block leading-tight">
                          {server.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 leading-none block">
                          {server._count?.members || 1} members
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {server.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <button
                      onClick={() =>
                        handleJoinPublicServer(server.id, server.inviteCode)
                      }
                      className="px-4 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground border border-border hover:border-transparent rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                    >
                      Join Server
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
