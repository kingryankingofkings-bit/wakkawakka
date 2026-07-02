"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  BadgeCheck,
  Globe,
  X,
  ArrowLeft,
  TrendingUp,
  Users,
  Eye,
  FileText,
  BarChart3,
  Edit3,
} from "lucide-react";
import _Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { apiFetch, apiGet } from "@/lib/apiClient";
import { cn, formatCount } from "@/lib/utils";
import toast from "react-hot-toast";

interface PageRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  avatarUrl?: string;
  coverImage?: string;
  isVerified: boolean;
  followerCount: number;
  followers?: { id: string }[];
  owner: { id: string; displayName: string; username: string };
}

interface Article {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  views: number;
  likes: number;
  createdAt: string;
}

const FILTERS = [
  { id: "all", label: "Discover" },
  { id: "following", label: "Following" },
  { id: "mine", label: "Your Pages" },
] as const;

// SVG Line Chart Helpers
const _CHART_DATA = [1200, 1900, 1500, 2800, 2200, 3400, 3100];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PagesPage() {
  const [filter, setFilter] = useState<string>("all");
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Creator Dashboard States
  const [activeDashboardPage, setActiveDashboardPage] =
    useState<PageRow | null>(null);
  const [articles, setArticles] = useState<Record<string, Article[]>>({});
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    coverImage: "",
  });

  const load = useCallback(async (f: string) => {
    setLoading(true);
    setPages(await apiGet<PageRow[]>(`/api/pages?filter=${f}`, []));
    setLoading(false);
  }, []);

  useEffect(() => {
    load(filter);
    // Reset active dashboard when switching tabs
    setActiveDashboardPage(null);
  }, [filter, load]);

  async function toggleFollow(id: string) {
    const res = await apiFetch(`/api/pages/${id}/follow`, { method: "POST" });
    if (res.ok) {
      const { data } = await res.json();
      setPages((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                followers: data.following ? [{ id: "me" }] : [],
                followerCount: p.followerCount + (data.following ? 1 : -1),
              }
            : p,
        ),
      );
    }
  }

  // Handle Publish Article as Page
  const handlePublishArticle = () => {
    if (!activeDashboardPage || !articleForm.title || !articleForm.content)
      return;

    const newArticle: Article = {
      id: `art_${Date.now()}`,
      title: articleForm.title,
      content: articleForm.content,
      coverImage: articleForm.coverImage || undefined,
      views: Math.floor(Math.random() * 200) + 10,
      likes: Math.floor(Math.random() * 50) + 2,
      createdAt: new Date().toISOString(),
    };

    setArticles((prev) => ({
      ...prev,
      [activeDashboardPage.id]: [
        newArticle,
        ...(prev[activeDashboardPage.id] || []),
      ],
    }));

    toast.success("Article published to Page feed!");
    setArticleForm({ title: "", content: "", coverImage: "" });
    setShowCreateArticle(false);
  };

  // Get Page Articles list
  const getPageArticles = (pageId: string): Article[] => {
    return (
      articles[pageId] || [
        {
          id: "mock-art-1",
          title: "Top 5 Strategies for Organic Social Media Growth in 2026",
          content:
            "Building a presence without paid advertising is harder than ever, but these core steps will help you stay ahead.",
          coverImage:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
          views: 1245,
          likes: 98,
          createdAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "mock-art-2",
          title: "Why Micro-Communities are the Future of Brand Loyalty",
          content:
            "Broad marketing is dying. Brands must cultivate niche networks of super-fans to drive engagement.",
          coverImage:
            "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=400&q=80",
          views: 840,
          likes: 54,
          createdAt: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ]
    );
  };

  // Render Creator Dashboard View
  if (activeDashboardPage) {
    const pageArticles = getPageArticles(activeDashboardPage.id);
    const totalViews = pageArticles.reduce((sum, a) => sum + a.views, 0);

    return (
      <div className="min-h-screen bg-background p-6 space-y-6 max-w-5xl mx-auto">
        {/* Back navigation & Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <button
            onClick={() => setActiveDashboardPage(null)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors self-start py-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pages
          </button>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateArticle(true)}
            >
              <Edit3 className="h-4 w-4 mr-1.5" /> Publish Post
            </Button>
          </div>
        </div>

        {/* Page Identity Block */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-purple-500/20 relative">
            {activeDashboardPage.coverImage && (
              <img
                src={activeDashboardPage.coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="px-6 pb-6 pt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-start gap-4 -mt-10">
              <Avatar
                src={activeDashboardPage.avatarUrl}
                name={activeDashboardPage.name}
                size="xl"
                className="ring-4 ring-card bg-background"
              />
              <div className="pt-10 space-y-1">
                <h2 className="text-xl font-bold flex items-center gap-1.5">
                  {activeDashboardPage.name}
                  {activeDashboardPage.isVerified && (
                    <BadgeCheck className="h-5 w-5 text-primary" />
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeDashboardPage.category} · Creator Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Followers",
              val: activeDashboardPage.followerCount,
              icon: Users,
              change: "+4.2%",
            },
            {
              label: "Impressions",
              val: formatCount(totalViews * 12),
              icon: TrendingUp,
              change: "+14.6%",
            },
            {
              label: "Reach",
              val: formatCount(totalViews * 8),
              icon: BarChart3,
              change: "+8.1%",
            },
            {
              label: "Page Views",
              val: formatCount(totalViews * 3),
              icon: Eye,
              change: "-2.4%",
              negative: true,
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="p-4 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {stat.label}
                </span>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.val}</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "font-semibold",
                      stat.negative ? "text-destructive" : "text-success",
                    )}
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs last week</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Analytics SVG Chart Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-semibold text-base">Reach Analytics</h3>
              <p className="text-xs text-muted-foreground">
                Organic Page Reach over the past 7 days
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">12.8k total</p>
              <p className="text-[10px] text-muted-foreground">
                Estimated Reach
              </p>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-48 pt-2">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(59, 130, 246)"
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(59, 130, 246)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1="0"
                y1="40"
                x2="600"
                y2="40"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="80"
                x2="600"
                y2="80"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="120"
                x2="600"
                y2="120"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />

              {/* Chart Line Path */}
              <path
                d={`M 0 120 L 100 100 L 200 115 L 300 70 L 400 90 L 500 50 L 600 60`}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Gradient Area Path */}
              <path
                d={`M 0 120 L 100 100 L 200 115 L 300 70 L 400 90 L 500 50 L 600 60 L 600 160 L 0 160 Z`}
                fill="url(#chartGrad)"
              />

              {/* Data Points */}
              <circle
                cx="100"
                cy="100"
                r="4"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle
                cx="300"
                cy="70"
                r="4"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle
                cx="500"
                cy="50"
                r="4"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-2 px-1">
              {DAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Content list & Post Feed */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Published Posts & Articles
          </h3>
          <div className="space-y-3">
            {pageArticles.map((art) => (
              <Card
                key={art.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {art.coverImage && (
                    <div className="h-20 w-28 rounded-xl overflow-hidden shrink-0 bg-muted">
                      <img
                        src={art.coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {art.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {art.content}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1.5 font-semibold">
                      <span>
                        {new Date(art.createdAt).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {art.views} views
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {art.likes} likes
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Publish Article Modal */}
        <Modal
          isOpen={showCreateArticle}
          onClose={() => setShowCreateArticle(false)}
          title="Publish as Page"
        >
          <div className="space-y-3">
            <Input
              placeholder="Article/Post Title"
              value={articleForm.title}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, title: e.target.value }))
              }
            />
            <Input
              placeholder="Cover Image URL (optional)"
              value={articleForm.coverImage}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, coverImage: e.target.value }))
              }
            />
            <textarea
              placeholder="Write your article content here..."
              value={articleForm.content}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, content: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[140px] resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreateArticle(false)}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                onClick={handlePublishArticle}
                disabled={!articleForm.title || !articleForm.content}
              >
                Publish Post
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Pages</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            Loading…
          </p>
        )}
        {!loading && pages.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No pages here yet. Create one for your business or brand.
            </p>
          </div>
        )}
        {pages.map((p) => {
          const following = (p.followers?.length ?? 0) > 0;
          const isMine = filter === "mine";

          return (
            <Card
              key={p.id}
              padding="none"
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-24 bg-gradient-to-r from-primary/30 to-purple-500/30">
                {p.coverImage && (
                  <img
                    src={p.coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3 -mt-10">
                  <Avatar
                    src={p.avatarUrl}
                    name={p.name}
                    size="lg"
                    className="ring-2 ring-background bg-card"
                  />
                  <div className="flex-1 min-w-0 pt-8">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold truncate text-foreground">
                        {p.name}
                      </span>
                      {p.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.category} · {formatCount(p.followerCount)} followers
                    </p>
                  </div>
                </div>
                {p.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                )}

                <div className="flex gap-2">
                  {isMine ? (
                    <button
                      onClick={() => setActiveDashboardPage(p)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors active:scale-[0.98]"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Creator Dashboard
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      variant={following ? "outline" : "primary"}
                      className="w-full"
                      onClick={() => toggleFollow(p.id)}
                    >
                      {following ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <CreatePageModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          setFilter("mine");
        }}
      />
    </div>
  );
}

function CreatePageModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.name) return;
    setSaving(true);
    const res = await apiFetch("/api/pages", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ name: "", category: "", description: "", website: "" });
      onCreated();
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Create Page">
      <div className="space-y-3">
        <Input
          placeholder="Page name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Category (e.g. Business, Artist, Brand)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        />
        <Input
          placeholder="Website (optional)"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button onClick={submit} isLoading={saving} disabled={!form.name}>
            Create Page
          </Button>
        </div>
      </div>
    </Modal>
  );
}
