"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Search, Edit, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useMessageStore } from "@/store/messageStore";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime, cn } from "@/lib/utils";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { SponsoredAd } from "@/components/ads/SponsoredAd";
import toast from "react-hot-toast";

import { NewMessageModal } from "@/components/messaging/NewMessageModal";
import { MessagingFeaturesConsole } from "@/components/messaging/MessagingFeaturesConsole";
import { useSocket } from "@/hooks/useSocket";

export default function MessagesPage() {
  const conversations = useMessageStore((s) => s.conversations);
  const setConversations = useMessageStore((s) => s.setConversations);
  const [query, setQuery] = useState("");
  const { onlineUsers } = useSocket();
  const [messageTab, setMessageTab] = useState<"chats" | "status" | "channels">(
    "chats",
  );

  const [showNewMessage, setShowNewMessage] = useState(false);

  // Status Notes States
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/messages/notes");
      if (res.ok) {
        const json = await res.json();
        if (json.data) setNotes(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote) return;

    try {
      const res = await fetch("/api/messages/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": useAuthStore.getState().activeProfile?.id || "current",
        },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        toast.success("Status note updated!");
        setNewNote("");
        setShowNoteModal(false);
        fetchNotes();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to post note");
      }
    } catch {
      toast.error("Network error posting note");
    }
  };

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/messages/conversations");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setConversations(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    }
    fetchConversations();
  }, [setConversations]);

  const filtered = conversations.filter(
    (c) =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.members.some((m) =>
        m.displayName.toLowerCase().includes(query.toLowerCase()),
      ),
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            title="New message"
            onClick={() => setShowNewMessage(true)}
          >
            <Edit className="h-5 w-5" />
          </button>
        </div>
      </div>

      <NewMessageModal 
        isOpen={showNewMessage} 
        onClose={() => setShowNewMessage(false)} 
      />

      <div className="px-4 mt-4">
        <MessagingFeaturesConsole />
      </div>

      {/* DirectChat sub-tabs */}
      <div className="flex bg-muted rounded-2xl p-1 border border-border mx-4 my-2 shrink-0">
        {["chats", "status", "channels"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMessageTab(tab as any)}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-xl capitalize transition-all",
              messageTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      {messageTab === "chats" && (
        <>
          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <Input
              placeholder="Search conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* PhotoFeed Notes Bar */}
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex gap-4 overflow-x-auto scrollbar-hide items-center">
            {/* Post note trigger */}
            <div
              className="flex flex-col items-center shrink-0 cursor-pointer"
              onClick={() => setShowNoteModal(true)}
            >
              <div className="relative h-12 w-12 rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-card hover:bg-muted transition-colors">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">
                Leave note
              </span>
            </div>

            {/* Notes list */}
            {notes.map((note) => (
              <div
                key={note.userId}
                className="flex flex-col items-center shrink-0 max-w-[80px] text-center relative group"
              >
                {/* Note Bubble */}
                <div className="absolute -top-3 bg-card border border-border shadow-md rounded-2xl px-2 py-1 text-[9px] max-w-[70px] truncate leading-tight font-medium text-foreground z-10 select-none pointer-events-none">
                  {note.note}
                </div>
                <Avatar src={note.avatar} name={note.displayName} size="lg" />
                <span className="text-[10px] text-muted-foreground mt-1 truncate w-full">
                  {note.displayName}
                </span>
              </div>
            ))}
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="font-semibold">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a conversation with someone
                </p>
              </div>
            ) : (
              filtered.map((conv) => {
                const otherMember = conv.isGroup
                  ? null
                  : conv.members.find((m) => m.id !== "current");
                const displayName = conv.isGroup
                  ? conv.name
                  : otherMember?.displayName;
                const avatar = conv.isGroup
                  ? conv.avatarUrl
                  : otherMember?.avatar;
                const avatarName = displayName || "Group";

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/50"
                  >
                    {conv.isGroup ? (
                      <div className="relative h-12 w-12 flex-shrink-0">
                        {conv.members.slice(0, 4).map((m, i) => (
                          <div
                            key={m.id}
                            className="absolute h-7 w-7 rounded-full overflow-hidden border-2 border-background"
                            style={{
                              top: i < 2 ? 0 : "50%",
                              left: i % 2 === 0 ? 0 : "50%",
                              transform:
                                i >= 2 ? "translateY(-50%)" : undefined,
                            }}
                          >
                            <Avatar
                              src={m.avatar}
                              name={m.displayName}
                              size="xs"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Avatar
                        src={avatar}
                        name={avatarName}
                        size="lg"
                        isOnline={
                          otherMember && otherMember.id
                            ? onlineUsers.has(otherMember.id)
                            : false
                        }
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={cn(
                            "text-sm font-semibold truncate",
                            conv.unreadCount > 0 && "text-foreground",
                          )}
                        >
                          {displayName}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {conv.lastMessage &&
                            formatRelativeTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-sm truncate",
                            conv.unreadCount > 0
                              ? "text-foreground font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {conv.lastMessage?.content || "Start a conversation"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}

      {messageTab === "status" && (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <h2 className="font-bold text-sm text-foreground">
            Recent Status Updates
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
              <Avatar
                src="https://i.pravatar.cc/100?img=47"
                name="Alice Dev"
                size="md"
              />
              <div>
                <p className="font-semibold text-xs text-foreground">
                  Alice Dev
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Updated 10m ago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
              <Avatar
                src="https://i.pravatar.cc/100?img=12"
                name="Bob Builder"
                size="md"
              />
              <div>
                <p className="font-semibold text-xs text-foreground">
                  Bob Builder
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Updated 1h ago
                </p>
              </div>
            </div>
          </div>

          {/* DirectChat Status Placement Ad */}
          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">
              Sponsored Status
            </p>
            <SponsoredAd placement="WHATSAPP_STATUS" />
          </div>
        </div>
      )}

      {messageTab === "channels" && (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <h2 className="font-bold text-sm text-foreground">
            Popular Channels
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-card border border-border rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-semibold text-xs text-foreground">
                  Wakka Tech News
                </p>
                <p className="text-[10px] text-muted-foreground">
                  15,400 followers · Daily tech digests
                </p>
              </div>
              <Button
                size="xs"
                onClick={() => toast.success("Followed Channel!")}
              >
                Follow
              </Button>
            </div>
            <div className="p-3 bg-card border border-border rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-semibold text-xs text-foreground">
                  Creator Studio Hub
                </p>
                <p className="text-[10px] text-muted-foreground">
                  8,200 followers · Summer albums promo
                </p>
              </div>
              <Button
                size="xs"
                onClick={() => toast.success("Followed Channel!")}
              >
                Follow
              </Button>
            </div>
          </div>

          {/* DirectChat Channel Placement Ad */}
          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">
              Sponsored Channel Updates
            </p>
            <SponsoredAd placement="WHATSAPP_CHANNEL" />
          </div>
        </div>
      )}

      {/* Note post modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Update Status Note"
      >
        <form onSubmit={handlePostNote} className="p-4 space-y-3 text-xs">
          <p className="text-xs text-muted-foreground">
            Share what&apos;s on your mind. Notes disappear after 24 hours.
          </p>
          <Input
            required
            maxLength={60}
            placeholder="Share a thought (max 60 chars)..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Share Note</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
