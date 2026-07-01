"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Lock, Globe, Sparkles, Radio, ShieldCheck, Coins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCount } from "@/lib/utils";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/apiClient";

const CATEGORIES = [
  "All",
  "Art & Design",
  "Technology",
  "Health & Wellness",
  "Music",
  "Gaming",
  "Education",
  "Sports",
];

export default function CommunitiesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState<"explore" | "console">(
    "explore",
  );

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommPrivate, setNewCommPrivate] = useState(false);

  // Database-backed state
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, [activeCategory]);

  async function loadCommunities() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/communities?category=${activeCategory}`);
      if (res.ok) {
        const json = await res.json();
        setCommunities(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(commId: string) {
    try {
      const res = await apiFetch(`/api/communities/${commId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.status === "MEMBER") {
          toast.success("Joined community successfully!");
        } else if (json.data?.status === "PENDING") {
          toast.success("Join request sent!");
        }
        loadCommunities();
      } else {
        toast.error("Failed to join community");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCommName,
          description: newCommDesc,
          visibility: newCommPrivate ? "PRIVATE" : "PUBLIC",
        }),
      });
      if (res.ok) {
        toast.success("Community created successfully!");
        setIsCreateOpen(false);
        setNewCommName("");
        setNewCommDesc("");
        setNewCommPrivate(false);
        loadCommunities();
      } else {
        const errJson = await res.json();
        toast.error(errJson.error || "Failed to create community");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  const myCommunities = communities.filter((c) => c.isMember);
  const discover = communities.filter((c) => !c.isMember);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Communities</h1>
        <div className="flex items-center gap-2">
          {/* Tab selectors to toggle console */}
          <div className="flex bg-muted/80 p-0.5 rounded-xl border border-border text-xs">
            <button
              onClick={() => setActiveView("explore")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === "explore"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveView("console")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeView === "console"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Console ⚡
            </button>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeView === "console" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Community Tools</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" onClick={() => toast("Add Yours prompt sent!")}>
                  <Sparkles className="w-4 h-4 mr-2" /> Create &quot;Add Yours&quot; Prompt
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => toast("Broadcast Channel created.")}>
                  <Radio className="w-4 h-4 mr-2" /> Start Broadcast Channel
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => toast("Affiliation badging settings opened.")}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Manage Affiliation Badges
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Engagement Console</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("Channel Points configured.")}>
                  <Coins className="w-4 h-4 mr-2 text-yellow-500" /> Channel Points Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("No pending requests right now.")}>
                  <Users className="w-4 h-4 mr-2" /> Pending Join Requests
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Promotional Launch Card */}
            <Card className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-background border border-primary/20 p-5 rounded-2xl relative overflow-hidden">
              <div className="max-w-md space-y-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Profiles & Communities Console
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Interactive simulations for collaborative posts, &ldquo;Add
                  Yours&rdquo; prompts, broadcast channels, affiliation badges,
                  channel points, and community join requests.
                </p>
                <Button
                  size="xs"
                  onClick={() => setActiveView("console")}
                  className="mt-1 font-bold"
                >
                  Launch Console ⚡
                </Button>
              </div>
            </Card>

            {/* My communities */}
            {myCommunities.length > 0 && (
              <section>
                <h2 className="font-bold mb-3">Your Communities</h2>
                <div className="grid grid-cols-1 gap-3">
                  {myCommunities.map((c) => (
                    <Link key={c.id} href={`/communities/${c.id}`}>
                      <Card padding="none" hover className="overflow-hidden">
                        {c.coverImage && (
                          <div className="h-16 bg-gradient-to-r from-primary/30 to-purple-500/30">
                            <img
                              src={c.coverImage}
                              alt=""
                              className="h-full w-full object-cover opacity-70"
                            />
                          </div>
                        )}
                        <div className="p-3 flex items-center gap-3">
                          {c.avatarUrl && (
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCount(c.memberCount)} members
                            </p>
                          </div>
                          <span className="text-xs text-primary font-medium">
                            View
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Discover */}
            <section>
              <h2 className="font-bold mb-3">Discover Communities</h2>

              {/* Category filters */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {discover.map((c) => (
                  <Card key={c.id} padding="none" className="overflow-hidden">
                    {c.coverImage && (
                      <div className="h-28 bg-gradient-to-r from-primary/30 to-purple-500/30 relative">
                        <img
                          src={c.coverImage}
                          alt=""
                          className="h-full w-full object-cover opacity-70"
                        />
                        <div className="absolute bottom-3 left-3">
                          {c.avatarUrl && (
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="h-14 w-14 rounded-xl object-cover ring-2 ring-background"
                            />
                          )}
                        </div>
                        <div className="absolute top-3 right-3">
                          {c.isPrivate ? (
                            <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </span>
                          ) : (
                            <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="p-4 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/communities/${c.id}`}
                            className="font-bold hover:underline"
                          >
                            {c.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {c.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {formatCount(c.memberCount)} members
                            </span>
                            <span>{c.category}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoin(c.id)}
                          className="flex-shrink-0"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create a Community"
      >
        <form className="p-5 flex flex-col gap-4" onSubmit={handleCreate}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Community Name</label>
            <input
              type="text"
              value={newCommName}
              onChange={(e) => setNewCommName(e.target.value)}
              placeholder="e.g. Next.js Developers"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={newCommDesc}
              onChange={(e) => setNewCommDesc(e.target.value)}
              placeholder="What is this community about?"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none h-20"
              required
            />
          </div>
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="newCommPrivate"
              checked={newCommPrivate}
              onChange={(e) => setNewCommPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary"
            />
            <label
              htmlFor="newCommPrivate"
              className="text-sm font-medium cursor-pointer"
            >
              Private Community (requires approval to join)
            </label>
          </div>
          <Button type="submit" className="w-full mt-2">
            Create Community
          </Button>
        </form>
      </Modal>
    </div>
  );
}
