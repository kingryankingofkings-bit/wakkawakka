"use client";

import { useState, useEffect } from "react";
import { useProfessionalStore, Article } from "@/store/professionalStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Newspaper, Send, FileText, BookOpen, Clock, Heart, Eye } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ArticlesPage() {
  const { articles, loading, fetchArticles, createArticle } = useProfessionalStore();

  const [activeTab, setActiveTab] = useState<"feed" | "write">("feed");

  // Write Article form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Please enter a title and content.");
      return;
    }

    try {
      setSubmitting(true);
      await createArticle(title, content, coverImage || undefined);
      toast.success("Article published successfully!");
      setTitle("");
      setSummary("");
      setContent("");
      setCoverImage("");
      setActiveTab("feed");
      fetchArticles(); // refresh list
    } catch (err) {
      toast.error("Failed to publish article.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white space-y-2 shadow-md">
        <h1 className="text-2xl font-black">Professional Articles</h1>
        <p className="text-sm opacity-90">Publish long-form thoughts, newsletters, and industry insights.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "feed"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Articles Feed
        </button>
        <button
          onClick={() => setActiveTab("write")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "write"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Write Article
        </button>
      </div>

      {activeTab === "feed" ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading newsletter feed...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6">
              No articles have been published yet. Be the first to share an insight!
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      By {article.authorName} • {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {article.coverImage && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted">
                      <Image src={article.coverImage} alt={article.title} fill className="object-cover" unoptimized />
                    </div>
                  )}

                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                    {article.content.length > 250 ? `${article.content.slice(0, 250)}...` : article.content}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="flex gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> 12 views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> 4 likes
                      </span>
                    </div>
                    {article.content.length > 250 && (
                      <Button size="xs" variant="ghost" onClick={() => toast.success("Opening full reader view...")}>
                        Read More
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Write tab */
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
              <Input
                required
                placeholder="e.g. Scaling Next.js Apps with Redis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Cover Image URL (optional)</label>
              <Input
                placeholder="https://example.com/images/cover.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Summary / TL;DR (optional)</label>
              <Input
                placeholder="A quick overview of what this article covers..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Body Content (Markdown / Text)</label>
              <textarea
                required
                className="w-full min-h-[300px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Write your article here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Publishing..." : "Publish Article"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
