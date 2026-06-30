'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { RefreshCw, ChevronUp, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoriesRow } from '@/components/feed/StoriesRow';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostCard } from '@/components/feed/CreatePostCard';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { Modal } from '@/components/ui/Modal';
import { ContentFeedConsole } from '@/components/feed/ContentFeedConsole';
import { useFeedStore } from '@/store/feedStore';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewPosts, setShowNewPosts] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const searchParams = useSearchParams();

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
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-1">
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
          <button
            onClick={() => setShowConsole(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-xs font-bold shrink-0 ml-2"
          >
            <Sliders className="h-3.5 w-3.5" />
            Launch Console
          </button>
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

      {/* Posts feed */}
      <div>
        <AnimatePresence mode="popLayout">
          {posts.map((post, i) => (
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

      {/* Feed console modal */}
      <Modal isOpen={showConsole} onClose={() => setShowConsole(false)} title="Batch 3 Content Creation, Feeds & Discovery Console" size="full">
        <ContentFeedConsole />
      </Modal>
    </div>
  );
}

