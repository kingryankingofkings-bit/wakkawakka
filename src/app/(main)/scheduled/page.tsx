'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Send, Trash2, ArrowLeft, ImageIcon, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useComposerStore, scheduledToPost } from '@/store/composerStore';
import { useFeedStore } from '@/store/feedStore';
import { CURRENT_USER } from '@/lib/mockData';
import { cn } from '@/lib/utils';

function relativeTime(iso: string): string {
  const diff = +new Date(iso) - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const phrase = days >= 1 ? `${days}d` : hrs >= 1 ? `${hrs}h` : `${mins}m`;
  return diff >= 0 ? `in ${phrase}` : `${phrase} ago`;
}

export default function ScheduledPage() {
  // Avoid hydration mismatch: persisted store is client-only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scheduledPosts = useComposerStore(s => s.scheduledPosts);
  const removeScheduled = useComposerStore(s => s.removeScheduled);
  const addPost = useFeedStore(s => s.addPost);

  function publishNow(id: string) {
    const post = scheduledPosts.find(p => p.id === id);
    if (!post) return;
    addPost(scheduledToPost(post, CURRENT_USER));
    removeScheduled(id);
    toast.success('Published');
  }

  function remove(id: string) {
    removeScheduled(id);
    toast('Removed from queue');
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Scheduled posts</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your publishing queue. Posts go live automatically once their time arrives while Wakka is open, or publish any of them now.
        </p>
      </div>

      {!mounted ? null : scheduledPosts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">Nothing scheduled</p>
          <p className="text-sm text-muted-foreground mb-4">Schedule a post from the composer to see it here.</p>
          <Link
            href="/feed?create=1"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create a post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {scheduledPosts.map(post => {
              const isDue = +new Date(post.scheduledFor) <= Date.now();
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl border border-border bg-card/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                        isDue ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                      )}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {isDue ? 'Ready to publish' : new Date(post.scheduledFor).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">{relativeTime(post.scheduledFor)}</span>
                  </div>

                  {post.content && <p className="text-sm whitespace-pre-wrap">{post.content}</p>}

                  {post.mediaUrls.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {post.mediaUrls.length} attachment{post.mediaUrls.length > 1 ? 's' : ''}
                      {post.altTexts.some(a => !a.trim()) && (
                        <span className="text-yellow-500">· some missing alt text</span>
                      )}
                    </div>
                  )}

                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.map(h => (
                        <span key={h} className="text-xs text-primary">#{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => publishNow(post.id)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors active:scale-95"
                    >
                      <Send className="h-3.5 w-3.5" /> Publish now
                    </button>
                    <button
                      onClick={() => remove(post.id)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
