"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessageSquare, X } from "lucide-react";

export function ChannelForumView({
  serverId,
  channelId,
  createChannel,
}: {
  serverId: string;
  channelId: string;
  createChannel: any;
}) {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/channels`);
      if (res.ok) {
        const data = await res.json();
        const subThreads = (data.data || []).filter(
          (c: any) => c.parentId === channelId,
        );
        setThreads(subThreads);
      }
    } catch (err) {
      console.error(err);
    }
  }, [serverId, channelId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim()) return;

    const res = await fetch(
      `/api/servers/${serverId}/channels/${channelId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: threadTitle }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      setShowCreateModal(false);
      setThreadTitle("");
      fetchThreads();
      router.push(`/servers/${serverId}/${data.data.id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div>
          <h2 className="text-base font-bold">Forum Board</h2>
          <p className="text-xs text-muted-foreground">
            Browse topic discussions or start a new thread
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/95 transition-colors shadow-sm"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Post
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-2xl">
          <MessageSquare className="h-8 w-8 mb-2" />
          <p className="text-sm font-medium">
            No threads created yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/servers/${serverId}/${thread.id}`}
              className="flex items-center justify-between p-4 bg-card hover:bg-muted/10 border border-border hover:border-muted-foreground/20 rounded-xl transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <span className="font-semibold block text-foreground hover:underline text-sm">
                    {thread.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Started recently
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-muted rounded-full font-medium text-muted-foreground">
                View Thread
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">
              Start a Discussion Thread
            </h2>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                  Thread Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="What do you want to talk about?"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                  Start Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
