'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { Shield, Check, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ReporterInfo {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface TargetContentAuthor {
  id: string;
  username: string;
  displayName: string;
}

interface PostTarget {
  id: string;
  content: string | null;
  author: TargetContentAuthor;
  labels?: string;
}

interface CommentTarget {
  id: string;
  content: string;
  author: TargetContentAuthor;
}

interface ReportItem {
  id: string;
  reporterId: string;
  reporter: ReporterInfo;
  targetId: string;
  targetType: 'POST' | 'COMMENT';
  reason: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  post: PostTarget | null;
  comment: CommentTarget | null;
}

export default function ModerationQueuePage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bluesky Labelers custom labels states
  const [customLabels, setCustomLabels] = useState<string[]>(['NSFW', 'Clickbait', 'Misinformation']);
  const [newLabelInput, setNewLabelInput] = useState('');

  async function loadReports() {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/admin/reports');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setReports(json.data);
        }
      } else {
        toast.error('Failed to load moderation queue');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const handleToggleLabel = async (postId: string, currentLabelsStr: string | undefined, label: string) => {
    let currentLabels: string[] = [];
    try {
      currentLabels = JSON.parse(currentLabelsStr || '[]');
    } catch {
      currentLabels = [];
    }

    const updatedLabels = currentLabels.includes(label)
      ? currentLabels.filter(l => l !== label)
      : [...currentLabels, label];

    try {
      const res = await fetch('/api/admin/posts/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, labels: updatedLabels }),
      });
      if (res.ok) {
        toast.success(`Labels updated!`);
        loadReports();
      } else {
        toast.error('Failed to update labels');
      }
    } catch {
      toast.error('Network error updating labels');
    }
  };

  const handleAction = async (reportId: string, status: string, action?: string) => {
    try {
      const res = await apiFetch('/api/admin/reports', {
        method: 'PATCH',
        body: JSON.stringify({ reportId, status, action }),
      });
      if (res.ok) {
        toast.success(`Report resolved successfully`);
        loadReports();
      } else {
        toast.error('Failed to update report');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update report');
    }
  };

  const getTargetText = (report: ReportItem) => {
    if (report.targetType === 'POST') {
      return report.post?.content || '(No text content)';
    }
    if (report.targetType === 'COMMENT') {
      return report.comment?.content || '';
    }
    return '';
  };

  const getTargetAuthor = (report: ReportItem) => {
    if (report.targetType === 'POST') {
      return report.post?.author;
    }
    if (report.targetType === 'COMMENT') {
      return report.comment?.author;
    }
    return null;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Moderation Queue</h1>
          <p className="text-xs text-muted-foreground">Review and take action on user reports</p>
        </div>
      </div>

      {/* Bluesky Labeler Manager */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">Bluesky Labeler custom definitions</h2>
        <div className="flex flex-wrap gap-2">
          {customLabels.map(l => (
            <span key={l} className="px-2.5 py-1 bg-muted rounded-xl text-xs font-bold text-foreground">{l}</span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newLabelInput && !customLabels.includes(newLabelInput)) {
              setCustomLabels([...customLabels, newLabelInput]);
              setNewLabelInput('');
              toast.success(`Custom moderation label "${newLabelInput}" registered!`);
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Add new custom label (e.g., Clickbait)..."
            value={newLabelInput}
            onChange={e => setNewLabelInput(e.target.value)}
            className="flex-1 h-9 px-3 border border-border rounded-xl bg-transparent text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <button type="submit" className="px-4 bg-primary text-primary-foreground text-xs font-bold rounded-xl active:scale-95 transition-all">
            Register Label
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">Queue is clean!</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              There are no pending user reports in the queue right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const author = getTargetAuthor(report);
            const contentText = getTargetText(report);
            const isPending = report.status === 'PENDING';

            return (
              <div
                key={report.id}
                className={cn(
                  "p-5 rounded-2xl border bg-card transition-all space-y-4",
                  isPending ? "border-border" : "border-border/40 opacity-75"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                      {report.targetType} Report
                    </span>
                    <h2 className="text-sm font-bold text-foreground mt-2">
                      Reason: <span className="text-destructive capitalize">{report.reason.toLowerCase().replace('_', ' ')}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by <span className="font-semibold text-foreground">@{report.reporter?.username}</span> · {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-bold",
                      report.status === 'PENDING' && "bg-yellow-500/10 text-yellow-600",
                      report.status === 'RESOLVED' && "bg-green-500/10 text-green-600",
                      report.status === 'DISMISSED' && "bg-muted text-muted-foreground"
                    )}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/40 rounded-xl p-3.5 border border-border/40 text-sm space-y-2">
                  {author && (
                    <p className="text-xs text-muted-foreground">
                      Author: <span className="font-semibold text-foreground">@{author.username}</span> ({author.displayName})
                    </p>
                  )}
                  <p className="text-foreground italic">&quot;{contentText}&quot;</p>
                  {report.description && (
                    <div className="pt-2 border-t border-border/40 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground">Reporter details:</p>
                      <p className="text-xs text-foreground mt-0.5">{report.description}</p>
                    </div>
                  )}

                  {report.targetType === 'POST' && report.post && (
                    <div className="pt-2 border-t border-border/40 mt-2 space-y-1.5 text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Content Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {customLabels.map(label => {
                          let parsed: string[] = [];
                          try {
                            parsed = JSON.parse(report.post?.labels || '[]');
                          } catch {}
                          const isAttached = parsed.includes(label);
                          return (
                            <button
                              key={label}
                              onClick={() => handleToggleLabel(report.post!.id, report.post!.labels, label)}
                              className={cn(
                                "px-2 py-0.5 rounded border text-[10px] font-bold transition-all active:scale-95",
                                isAttached ? "bg-red-500 text-white border-red-500" : "bg-card text-muted-foreground hover:bg-muted border-border"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="flex flex-wrap gap-2.5 justify-end pt-2">
                    <button
                      onClick={() => handleAction(report.id, 'DISMISSED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-muted text-foreground transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'RESOLVED', 'REMOVE_CONTENT')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Content
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'RESOLVED', 'BAN_USER')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 transition-colors"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Ban User
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
