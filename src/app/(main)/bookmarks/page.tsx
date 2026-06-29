'use client';

import { useState } from 'react';
import { BookMarked, Search, Grid, List, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedStore } from '@/store/feedStore';
import { PostCard } from '@/components/feed/PostCard';
import { cn } from '@/lib/utils';

const FILTER_TYPES = [
  { id: 'ALL', label: 'All Saved' },
  { id: 'TEXT', label: 'Text' },
  { id: 'IMAGE', label: 'Photos' },
  { id: 'VIDEO', label: 'Videos' },
] as const;

export default function BookmarksPage() {
  const { posts, updatePost } = useFeedStore();
  const [filter, setFilter] = useState<'ALL' | 'TEXT' | 'IMAGE' | 'VIDEO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter bookmarked posts
  const bookmarkedPosts = posts.filter(post => {
    if (!post.isBookmarked) return false;
    
    // Type filter
    if (filter !== 'ALL' && post.type !== filter) return false;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const contentMatch = post.content?.toLowerCase().includes(query);
      const authorMatch = post.author.displayName.toLowerCase().includes(query) || 
                          post.author.username.toLowerCase().includes(query);
      return contentMatch || authorMatch;
    }
    
    return true;
  });

  const handleClearAll = () => {
    // Unbookmark all posts in local store
    posts.forEach(post => {
      if (post.isBookmarked) {
        updatePost(post.id, { isBookmarked: false });
      }
    });
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Saved Bookmarks</h1>
            <p className="text-sm text-muted-foreground">Keep track of your favorite posts and links</p>
          </div>
        </div>

        {bookmarkedPosts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-destructive/20 hover:bg-destructive/10 text-destructive text-sm font-semibold transition-colors active:scale-95 self-start"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Controls: Search + Filters + View Mode */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search saved bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>

        {/* Filters and Layout Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-muted p-1 rounded-xl">
            {FILTER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setFilter(type.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  filter === type.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex border border-border p-1 rounded-xl bg-card">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bookmarks Display */}
      <AnimatePresence mode="popLayout">
        {bookmarkedPosts.length > 0 ? (
          <motion.div
            layout
            className={cn(
              'gap-6',
              viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col'
            )}
          >
            {bookmarkedPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  viewMode === 'grid' && 'bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow'
                )}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <BookMarked className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No saved bookmarks found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery || filter !== 'ALL'
                  ? "We couldn't find any saved posts matching your active filters."
                  : "Tap the bookmark icon on any post in the feed to save it here for later."}
              </p>
            </div>
            {(searchQuery || filter !== 'ALL') && (
              <button
                onClick={() => {
                  setFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
