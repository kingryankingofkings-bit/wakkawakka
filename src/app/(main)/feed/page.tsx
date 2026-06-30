'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, ChevronUp, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { StoriesRow } from '@/components/feed/StoriesRow';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostCard } from '@/components/feed/CreatePostCard';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { useFeedStore } from '@/store/feedStore';
import { useSearchStore } from '@/store/searchStore';
import { useSafetyStore } from '@/store/safetyStore';
import { isMuted } from '@/lib/searchQuery';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

const FEED_TABS = [
  { id: 'forYou', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
] as const;

export default function FeedPage() {
  return (
    <Suspense>
      <FeedPageInner />
    </Suspense>
  );
}

function FeedPageInner() {
  const { posts, feedType, setFeedType } = useFeedStore();
  const mutedKeywords = useSearchStore(s => s.mutedKeywords);
  const blocked = useSafetyStore(s => s.blocked);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewPosts, setShowNewPosts] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  // Persisted muted keywords hydrate client-side; only filter after mount to
  // keep the server-rendered list and first client render identical.
  useEffect(() => setMounted(true), []);

  const blockedIds = useMemo(() => new Set(blocked.map(b => b.id)), [blocked]);
  const visiblePosts = useMemo(
    () =>
      mounted
        ? posts.filter(p => !isMuted(p, mutedKeywords) && !blockedIds.has(p.authorId))
        : posts,
    [posts, mutedKeywords, blockedIds, mounted]
  );
  const hiddenCount = posts.length - visiblePosts.length;

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Simulate new posts arriving
  useEffect(() => {
    const t = setTimeout(() => setShowNewPosts(true), 15000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex">
          {FEED_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFeedType(tab.id)}
              className={cn(
                'flex-1 py-3.5 text-sm font-semibold transition-colors relative',
                feedType === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {feedType === tab.id && (
                <motion.div
                  layoutId="feed-tab-indicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* New posts notification */}
      <AnimatePresence>
        {showNewPosts && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-[49px] z-20 flex justify-center py-2 bg-background/0"
          >
            <button
              onClick={() => setShowNewPosts(false)}
              className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg hover:bg-primary/90 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              3 new posts
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories */}
      <div className="border-b border-border bg-card/30">
        <StoriesRow />
      </div>

      {/* Create post quick composer */}
      <div className="border-b border-border">
        <CreatePostCard onOpenModal={() => setShowCreateModal(true)} />
      </div>

      {/* Muted-keyword notice */}
      {hiddenCount > 0 && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
          <VolumeX className="h-3.5 w-3.5" />
          {hiddenCount} post{hiddenCount > 1 ? 's' : ''} hidden by muted keywords.
          <Link href="/explore" className="text-primary hover:underline font-medium">Manage</Link>
        </div>
      )}

      {/* Posts feed */}
      <div>
        <AnimatePresence mode="popLayout">
          {visiblePosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Load more */}
        <div className="py-8 flex justify-center">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-4 w-4" />
            Load more posts
          </button>
        </div>
      </div>

      {/* Create post modal */}
      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
