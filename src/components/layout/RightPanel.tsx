'use client';

import Link from 'next/link';
import { TrendingUp, Radio } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatCount } from '@/lib/utils';
import { MOCK_USERS, MOCK_HASHTAGS, MOCK_LIVE_STREAMS, CURRENT_USER } from '@/lib/mockData';
import { useState } from 'react';

export function RightPanel() {
  const suggestions = MOCK_USERS.filter(u => u.id !== CURRENT_USER.id).slice(0, 3);
  const trending = MOCK_HASHTAGS.filter(h => h.isTrending).slice(0, 5);
  const liveNow = MOCK_LIVE_STREAMS.filter(s => s.isActive).slice(0, 2);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  return (
    <aside className="w-80 flex-shrink-0 py-6 px-4 space-y-6 overflow-y-auto">
      {/* Who to follow */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Suggested for you</h3>
        <div className="space-y-3">
          {suggestions.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <Link href={`/profile/${user.username}`}>
                <Avatar src={user.avatar} name={user.displayName} size="sm" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${user.username}`} className="text-sm font-semibold hover:underline truncate block">
                  {user.displayName}
                </Link>
                <p className="text-xs text-muted-foreground truncate">{formatCount(user.followersCount)} followers</p>
              </div>
              <Button
                size="xs"
                variant={followed.has(user.id) ? 'outline' : 'primary'}
                onClick={() => setFollowed(prev => {
                  const next = new Set(prev);
                  next.has(user.id) ? next.delete(user.id) : next.add(user.id);
                  return next;
                })}
              >
                {followed.has(user.id) ? 'Following' : 'Follow'}
              </Button>
            </div>
          ))}
        </div>
        <Link href="/explore?tab=people" className="block text-xs text-primary hover:underline mt-3">
          See more suggestions
        </Link>
      </div>

      {/* Trending */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Trending Topics</h3>
        </div>
        <div className="space-y-3">
          {trending.map((tag, i) => (
            <Link key={tag.id} href={`/explore?tag=${tag.name}`} className="flex items-center justify-between group">
              <div>
                <p className="text-xs text-muted-foreground">#{i + 1} · Trending</p>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">#{tag.name}</p>
                <p className="text-xs text-muted-foreground">{formatCount(tag.postCount)} posts</p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/explore" className="block text-xs text-primary hover:underline mt-3">
          Explore more topics
        </Link>
      </div>

      {/* Live now */}
      {liveNow.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-semibold text-sm">Live Now</h3>
          </div>
          <div className="space-y-3">
            {liveNow.map(stream => (
              <Link key={stream.id} href={`/live?stream=${stream.id}`} className="flex items-center gap-3 group">
                <div className="relative h-12 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-primary/30" />
                  <div className="absolute top-1 left-1">
                    <span className="text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">LIVE</span>
                  </div>
                  <Radio className="absolute bottom-1 right-1 h-3 w-3 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{stream.title}</p>
                  <p className="text-xs text-muted-foreground">{stream.host.displayName}</p>
                  <p className="text-xs text-muted-foreground">{formatCount(stream.viewerCount)} watching</p>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/live" className="block text-xs text-primary hover:underline mt-3">
            See all live streams
          </Link>
        </div>
      )}

      <p className="text-xs text-muted-foreground px-1">
        Privacy · Terms · Accessibility · Cookies · © 2025 Wakka
      </p>
    </aside>
  );
}
