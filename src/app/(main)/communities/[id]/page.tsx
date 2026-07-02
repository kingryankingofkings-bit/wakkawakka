"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users,
  Lock,
  Globe,
  Plus,
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
  Edit3,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn, formatCount, formatRelativeTime } from "@/lib/utils";
import { maskText } from "@/lib/contentFilter";
import Link from "next/link";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/apiClient";

const COMMUNITY_TABS = [
  "Posts",
  "Members",
  "Events",
  "Requests",
  "About",
  "Rules",
] as const;

interface JoinRequest {
  id: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();

  // Backend state variables
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [tab, setTab] = useState<(typeof COMMUNITY_TABS)[number]>("Posts");
  const [loading, setLoading] = useState(true);

  // Post creation state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [postFlairText, setPostFlairText] = useState("");
  const [postFlairBg, setPostFlairBg] = useState("#3b82f6");
  const [postFlairTextCol, setPostFlairTextCol] = useState("#ffffff");

  // Edit About state
  const [isEditAboutOpen, setIsEditAboutOpen] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editRules, setEditRules] = useState("");
  const [editVisibility, setEditVisibility] = useState("PUBLIC");
  const [editCategory, setEditCategory] = useState("GENERAL");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editCoverImage, setEditCoverImage] = useState("");

  // Member Flair Modal state
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberFlairText, setMemberFlairText] = useState("");
  const [memberFlairBg, setMemberFlairBg] = useState("#10b981");
  const [memberFlairTextCol, setMemberFlairTextCol] = useState("#ffffff");

  // Community Events state
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    isOnline: false,
    startsAt: "",
    category: "Community",
  });

  useEffect(() => {
    if (id) {
      loadAll();
    }
  }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([
        loadCommunityDetails(),
        loadPosts(),
        loadMembers(),
        loadCommunityEvents(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCommunityDetails() {
    const res = await apiFetch(`/api/communities/${id}`);
    if (res.ok) {
      const json = await res.json();
      setCommunity(json.data);
      setEditDesc(json.data.description || "");
      setEditRules(json.data.rules || "");
      setEditVisibility(json.data.visibility || "PUBLIC");
      setEditCategory(json.data.category || "GENERAL");
      setEditAvatarUrl(json.data.avatarUrl || "");
      setEditCoverImage(json.data.coverImage || "");

      // Load requests only if moderator
      if (json.data.isModerator) {
        loadRequests();
      }
    }
  }

  async function loadPosts() {
    const res = await apiFetch(`/api/communities/${id}/posts`);
    if (res.ok) {
      const json = await res.json();
      setPosts(json.data || []);
    }
  }

  async function loadMembers() {
    const res = await apiFetch(`/api/communities/${id}/members`);
    if (res.ok) {
      const json = await res.json();
      setMembers(json.data || []);
    }
  }

  async function loadRequests() {
    const res = await apiFetch(`/api/communities/${id}/requests`);
    if (res.ok) {
      const json = await res.json();
      setRequests(json.data || []);
    }
  }

  async function loadCommunityEvents() {
    const res = await apiFetch(`/api/events?communityId=${id}`);
    if (res.ok) {
      const json = await res.json();
      setCommunityEvents(json.data || []);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title || !eventForm.startsAt) return;
    try {
      const res = await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventForm,
          communityId: id,
        }),
      });

      if (res.ok) {
        toast.success("Community event created!");
        setIsCreateEventOpen(false);
        setEventForm({
          title: "",
          description: "",
          location: "",
          isOnline: false,
          startsAt: "",
          category: "Community",
        });
        loadCommunityEvents();
      } else {
        toast.error("Failed to create community event");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  async function handleToggleJoin() {
    if (!community) return;
    try {
      const res = await apiFetch(`/api/communities/${id}/join`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.status === "MEMBER") {
          toast.success(`Joined ${community.name}!`);
        } else if (json.data?.status === "PENDING") {
          toast.success("Join request sent successfully!");
        }
        await loadAll();
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  async function handleApprove(reqId: string) {
    try {
      const res = await apiFetch(`/api/communities/${id}/requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        toast.success("Approved join request!");
        loadAll();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve request");
    }
  }

  async function handleReject(reqId: string) {
    try {
      const res = await apiFetch(`/api/communities/${id}/requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        toast("Request rejected.");
        loadAll();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request");
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    try {
      const flair = postFlairText
        ? `${postFlairText}|${postFlairBg}|${postFlairTextCol}`
        : "";
      const res = await apiFetch(`/api/communities/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          flair,
        }),
      });

      if (res.ok) {
        toast.success("Post published successfully!");
        localStorage.removeItem(`communityPostDraft_${id}`);
        setIsCreatePostOpen(false);
        setNewPostContent("");
        setPostFlairText("");
        loadPosts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create post");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  // Load draft when modal opens
  useEffect(() => {
    if (isCreatePostOpen && id) {
      const draft = localStorage.getItem(`communityPostDraft_${id}`);
      if (draft && !newPostContent) {
        setNewPostContent(draft);
      }
    }
  }, [isCreatePostOpen, id]);

  async function handleSaveAbout(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDesc,
          rules: editRules,
          visibility: editVisibility,
          category: editCategory,
          avatarUrl: editAvatarUrl,
          coverImage: editCoverImage,
        }),
      });

      if (res.ok) {
        toast.success("Community details updated!");
        setIsEditAboutOpen(false);
        loadCommunityDetails();
      } else {
        toast.error("Failed to update details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  function openMemberFlairModal(member: any) {
    setSelectedMember(member);
    if (member.flair && member.flair.includes("|")) {
      const parts = member.flair.split("|");
      setMemberFlairText(parts[0]);
      setMemberFlairBg(parts[1]);
      setMemberFlairTextCol(parts[2]);
    } else {
      setMemberFlairText("");
      setMemberFlairBg("#10b981");
      setMemberFlairTextCol("#ffffff");
    }
  }

  async function handleSaveMemberFlair(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const flair = memberFlairText
        ? `${memberFlairText}|${memberFlairBg}|${memberFlairTextCol}`
        : "";
      const res = await apiFetch(
        `/api/communities/${id}/members/${selectedMember.userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flair }),
        },
      );

      if (res.ok) {
        toast.success("Member flair updated!");
        setSelectedMember(null);
        loadMembers();
      } else {
        toast.error("Failed to update member flair");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="w-80 hidden md:block space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="p-8 text-center text-sm text-destructive">
        Community not found
      </div>
    );
  }

  const COMMUNITY_RULES = community.rules
    ? community.rules.split("\n").filter((r: string) => r.trim().length > 0)
    : [
        "Be kind and respectful to all members",
        "No spam or self-promotion without moderator approval",
        "Share original content or properly credit sources",
        "Keep discussions on-topic and relevant to the community",
        "No harassment or hate speech of any kind",
        "Follow Wakka's Community Guidelines at all times",
      ];

  const filteredTabs = COMMUNITY_TABS.filter(
    (t) => t !== "Requests" || community.isModerator,
  );

  return (
    <div className="min-h-screen">
      {/* Back */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <Link
          href="/communities"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Communities
        </Link>
      </div>

      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-r from-primary/40 to-purple-600/40">
        {community.coverImage && (
          <img
            src={community.coverImage}
            alt={community.name}
            className="h-full w-full object-cover opacity-70"
          />
        )}
      </div>

      {/* Header */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-end gap-4 -mt-8 mb-3">
          {community.avatarUrl ? (
            <img
              src={community.avatarUrl}
              alt={community.name}
              className="h-20 w-20 rounded-2xl object-cover ring-4 ring-background flex-shrink-0"
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-muted border-4 border-background flex items-center justify-center flex-shrink-0">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {community.name}
                </h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {community.isPrivate ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  {community.isPrivate ? "Private" : "Public"} ·{" "}
                  {community.category}
                </div>
              </div>
              <Button
                size="sm"
                variant={community.isMember ? "outline" : "primary"}
                onClick={handleToggleJoin}
              >
                {community.isMember ? "Joined" : "Join"}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {community.description}
        </p>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">
              {formatCount(community.memberCount)}
            </span>
            <span className="text-muted-foreground font-normal">members</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-background/80 backdrop-blur-md border-b border-border flex">
        {filteredTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-xs font-semibold transition-colors relative",
              tab === t
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "Requests" && requests.length > 0 ? (
              <span className="flex items-center justify-center gap-1">
                Requests
                <span className="h-4 w-4 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-extrabold animate-pulse">
                  {requests.length}
                </span>
              </span>
            ) : (
              t
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "Posts" && (
        <div className="divide-y divide-border">
          {community.isMember && (
            <div className="p-4 border-b border-border/40 space-y-2 bg-card">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCreatePostOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Post to {community.name}
              </Button>
              {/* Mock typing indicator for real-time feel */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse px-1">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </span>
                Several members are typing...
              </div>
            </div>
          )}
          {posts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No posts yet. Be the first to share something!
            </div>
          ) : (
            posts
              .filter((p: any) => !p.isNSFW)
              .map((post: any) => {
              // Parse flair
              let flairText = "";
              let flairBg = "";
              let flairTextCol = "";
              if (post.flair && post.flair.includes("|")) {
                const parts = post.flair.split("|");
                flairText = parts[0];
                flairBg = parts[1];
                flairTextCol = parts[2];
              }

              return (
                <div key={post.id} className="p-4 bg-card space-y-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={post.author.avatar}
                        name={post.author.displayName}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {post.author.displayName}
                          </span>
                          {flairText && (
                            <span
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: flairBg,
                                color: flairTextCol,
                              }}
                            >
                              {flairText}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          @{post.author.username} ·{" "}
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {maskText(post.content)}
                  </p>
                  
                  {/* Real-time Reactions Bar */}
                  <div className="flex items-center gap-2 mt-2 pt-2">
                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground transition-colors border border-transparent hover:border-border">
                      <span className="text-sm">🔥</span> 
                      <span>{(post.id.charCodeAt(0) % 20) + 1}</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground transition-colors border border-transparent hover:border-border">
                      <span className="text-sm">💯</span> 
                      <span>{(post.id.charCodeAt(1) % 10) + 1}</span>
                    </button>
                    <button className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "Members" && (
        <div className="p-4 space-y-4">
          <div>
            <h2 className="font-bold text-sm text-foreground mb-3">
              Moderators & Admins
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {members
                .filter((m: any) => ["ADMIN", "MODERATOR"].includes(m.role))
                .map((m: any) => {
                  let flairText = "";
                  let flairBg = "";
                  let flairTextCol = "";
                  if (m.flair && m.flair.includes("|")) {
                    const parts = m.flair.split("|");
                    flairText = parts[0];
                    flairBg = parts[1];
                    flairTextCol = parts[2];
                  }
                  return (
                    <Card
                      key={m.id}
                      padding="sm"
                      className="flex items-center justify-between gap-2 relative"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={m.user.avatar}
                          name={m.user.displayName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate text-foreground">
                              {m.user.displayName}
                            </p>
                            {flairText && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: flairBg,
                                  color: flairTextCol,
                                }}
                              >
                                {flairText}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-primary font-bold">
                            {m.role}
                          </p>
                        </div>
                      </div>
                      {community.isModerator && (
                        <button
                          onClick={() => openMemberFlairModal(m)}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Edit Flair
                        </button>
                      )}
                    </Card>
                  );
                })}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground mb-3">Members</h2>
            <div className="grid grid-cols-2 gap-3">
              {members
                .filter((m: any) => !["ADMIN", "MODERATOR"].includes(m.role))
                .map((m: any) => {
                  let flairText = "";
                  let flairBg = "";
                  let flairTextCol = "";
                  if (m.flair && m.flair.includes("|")) {
                    const parts = m.flair.split("|");
                    flairText = parts[0];
                    flairBg = parts[1];
                    flairTextCol = parts[2];
                  }
                  return (
                    <Card
                      key={m.id}
                      padding="sm"
                      className="flex items-center justify-between gap-2 relative"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={m.user.avatar}
                          name={m.user.displayName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate text-foreground">
                              {m.user.displayName}
                            </p>
                            {flairText && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: flairBg,
                                  color: flairTextCol,
                                }}
                              >
                                {flairText}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            @{m.user.username}
                          </p>
                        </div>
                      </div>
                      {community.isModerator && (
                        <button
                          onClick={() => openMemberFlairModal(m)}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Edit Flair
                        </button>
                      )}
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {tab === "Events" && (
        <div className="p-4 space-y-4">
          {community.isMember && (
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCreateEventOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Schedule Event in {community.name}
              </Button>
            </div>
          )}
          {communityEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border border-dashed rounded-3xl">
              No events scheduled for this community yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {communityEvents.map((e: any) => (
                <Card
                  key={e.id}
                  padding="md"
                  className="flex flex-col justify-between space-y-3 bg-card"
                >
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-foreground line-clamp-1 leading-tight">
                      {e.title}
                    </h4>
                    {e.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {e.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-1 pt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {e.isOnline ? (
                          <Globe className="h-3 w-3 text-primary" />
                        ) : (
                          <MapPin className="h-3 w-3 text-primary" />
                        )}
                        <span>
                          {e.isOnline
                            ? "Online via Wakka Live"
                            : e.location || "Location TBA"}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Starts: {new Date(e.startsAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Requests Moderation Tab */}
      {tab === "Requests" && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl p-3 text-xs text-primary font-semibold">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Moderator view: Review requests to join this community.</span>
          </div>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 bg-card border border-border border-dashed rounded-3xl">
              <Check className="h-8 w-8 text-success" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">
                  Inbox completely clean!
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  No pending requests to review.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card
                  key={req.id}
                  padding="md"
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={req.user.avatar}
                      name={req.user.displayName}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">
                        {req.user.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{req.user.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Requested {formatRelativeTime(req.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      className="p-2 border border-border rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all active:scale-95 shadow-sm"
                      title="Reject request"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="p-2 border border-border rounded-xl text-success hover:bg-success/10 hover:border-success/30 transition-all active:scale-95 shadow-sm"
                      title="Approve request"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "About" && (
        <div className="p-4 space-y-5">
          <Card padding="md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground text-sm">
                About this community
              </h3>
              {community.isModerator && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsEditAboutOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit About
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {community.description || "No description provided."}
            </p>
          </Card>
          <Card padding="md">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-foreground">
                  {community.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <span className="font-semibold text-foreground">
                  {community.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-semibold text-foreground">
                  {formatCount(community.memberCount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created by</span>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={community.creator?.avatar}
                    name={community.creator?.displayName}
                    size="xs"
                  />
                  <span className="font-semibold text-foreground">
                    {community.creator?.displayName}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold text-foreground">
                  {formatRelativeTime(community.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "Rules" && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Please follow these rules to keep the community healthy and
            welcoming.
          </p>
          {COMMUNITY_RULES.map((rule: string, i: number) => (
            <Card key={i} padding="md">
              <div className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                  {rule}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Creation Modal with flair selection */}
      <Modal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        title={`Post to ${community.name}`}
      >
        <form className="p-5 flex flex-col gap-4" onSubmit={handleCreatePost}>
          <div className="space-y-1.5">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share something with the community..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none h-28 text-sm"
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewPostContent(prev => prev + "**bold**")}
                className="text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => setNewPostContent(prev => prev + "*italic*")}
                className="text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded"
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => setNewPostContent(prev => prev + "[link](url)")}
                className="text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded"
              >
                Link
              </button>
            </div>
          </div>

          <div className="border border-border p-3 rounded-xl space-y-3">
            <label className="text-xs font-bold text-muted-foreground block">
              Add Post Flair (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={postFlairText}
                onChange={(e) => setPostFlairText(e.target.value)}
                placeholder="e.g. Announcement, Question"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {postFlairText && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    Bg Color
                  </span>
                  <input
                    type="color"
                    value={postFlairBg}
                    onChange={(e) => setPostFlairBg(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    Text Color
                  </span>
                  <input
                    type="color"
                    value={postFlairTextCol}
                    onChange={(e) => setPostFlairTextCol(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                </div>
                <div className="flex flex-col gap-1 pl-4">
                  <span className="text-[10px] text-muted-foreground">
                    Preview
                  </span>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: postFlairBg,
                      color: postFlairTextCol,
                    }}
                  >
                    {postFlairText}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                if (newPostContent.trim()) {
                  localStorage.setItem(`communityPostDraft_${id}`, newPostContent);
                  toast.success("Draft saved to browser");
                  setIsCreatePostOpen(false);
                } else {
                  toast.error("Nothing to save");
                }
              }}
              disabled={!newPostContent.trim()}
            >
              Save Draft
            </Button>
            <Button type="submit" className="flex-1">
              Publish Post
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit About Modal */}
      <Modal
        isOpen={isEditAboutOpen}
        onClose={() => setIsEditAboutOpen(false)}
        title={`Edit ${community.name} details`}
      >
        <form
          className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
          onSubmit={handleSaveAbout}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold">Description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none h-20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">Rules (one per line)</label>
            <textarea
              value={editRules}
              onChange={(e) => setEditRules(e.target.value)}
              placeholder="Rules..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GENERAL">General</option>
                <option value="Art & Design">Art & Design</option>
                <option value="Technology">Technology</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
                <option value="Education">Education</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Visibility</label>
              <select
                value={editVisibility}
                onChange={(e) => setEditVisibility(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">Avatar URL</label>
            <input
              type="text"
              value={editAvatarUrl}
              onChange={(e) => setEditAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">Cover Image URL</label>
            <input
              type="text"
              value={editCoverImage}
              onChange={(e) => setEditCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Save Changes
          </Button>
        </form>
      </Modal>

      {/* Member Flair Edit Modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Edit Member Flair"
      >
        <form
          className="p-5 flex flex-col gap-4"
          onSubmit={handleSaveMemberFlair}
        >
          <p className="text-xs text-muted-foreground">
            Assign a custom flair tag to {selectedMember?.user?.displayName}.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold">Flair Text</label>
            <input
              type="text"
              value={memberFlairText}
              onChange={(e) => setMemberFlairText(e.target.value)}
              placeholder="e.g. Founder, VIP (Leave blank to remove)"
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {memberFlairText && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">
                  Bg Color
                </span>
                <input
                  type="color"
                  value={memberFlairBg}
                  onChange={(e) => setMemberFlairBg(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">
                  Text Color
                </span>
                <input
                  type="color"
                  value={memberFlairTextCol}
                  onChange={(e) => setMemberFlairTextCol(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
              </div>
              <div className="flex flex-col gap-1 pl-4">
                <span className="text-[10px] text-muted-foreground">
                  Preview
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: memberFlairBg,
                    color: memberFlairTextCol,
                  }}
                >
                  {memberFlairText}
                </span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full mt-2">
            Save Flair
          </Button>
        </form>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        title="Create Community Event"
      >
        <form
          onSubmit={handleCreateEvent}
          className="space-y-4 p-5 max-h-[80vh] overflow-y-auto"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Community Meetup"
              value={eventForm.title}
              onChange={(e) =>
                setEventForm({ ...eventForm, title: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">Description</label>
            <textarea
              placeholder="Describe the event..."
              value={eventForm.description}
              onChange={(e) =>
                setEventForm({ ...eventForm, description: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[90px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex items-center gap-2 py-1.5">
            <input
              type="checkbox"
              id="communityEventIsOnline"
              checked={eventForm.isOnline}
              onChange={(e) =>
                setEventForm({ ...eventForm, isOnline: e.target.checked })
              }
              className="h-4 w-4 accent-primary rounded cursor-pointer"
            />
            <label
              htmlFor="communityEventIsOnline"
              className="text-xs text-foreground font-semibold cursor-pointer"
            >
              This is an online virtual event
            </label>
          </div>
          {!eventForm.isOnline && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Location</label>
              <input
                type="text"
                placeholder="e.g. ServerLobby, Zoom or physical location"
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Starts At</label>
              <input
                type="datetime-local"
                required
                value={eventForm.startsAt}
                onChange={(e) =>
                  setEventForm({ ...eventForm, startsAt: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Category</label>
              <input
                type="text"
                placeholder="e.g. Meetup"
                value={eventForm.category}
                onChange={(e) =>
                  setEventForm({ ...eventForm, category: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <Button type="submit" className="w-full mt-2">
            Schedule Event
          </Button>
        </form>
      </Modal>
    </div>
  );
}
