'use client';

import { useState, useMemo } from 'react';
import { Search, TrendingUp, Users, Hash, Compass, Radio, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCount, cn } from '@/lib/utils';
import { MOCK_USERS, MOCK_POSTS, MOCK_HASHTAGS, MOCK_COMMUNITIES, MOCK_LIVE_STREAMS, MOCK_AUDIO_ROOMS } from '@/lib/mockData';
import { useState as useSt } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const EXPLORE_TABS = ['All', 'People', 'Posts', 'Tags', 'Communities', 'Live', 'Audio'] as const;
type ExploreTab = typeof EXPLORE_TABS[number];

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ExploreTab>('All');
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(
    new Set(MOCK_COMMUNITIES.filter(c => c.isMember).map(c => c.id))
  );

  const filteredUsers = useMemo(() =>
    query ? MOCK_USERS.filter(u =>
      u.displayName.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
    ) : MOCK_USERS,
    [query]
  );

  const filteredPosts = useMemo(() =>
    query ? MOCK_POSTS.filter(p => p.content.toLowerCase().includes(query.toLowerCase())) : MOCK_POSTS,
    [query]
  );

  const filteredTags = useMemo(() =>
    query ? MOCK_HASHTAGS.filter(h => h.name.toLowerCase().includes(query.toLowerCase())) : MOCK_HASHTAGS,
    [query]
  );

  const filteredCommunities = useMemo(() =>
    query ? MOCK_COMMUNITIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : MOCK_COMMUNITIES,
    [query]
  );

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 space-y-3">
        <Input
          placeholder="Search Wakka..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {EXPLORE_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* People */}
        {(tab === 'All' || tab === 'People') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">People</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.map(user => (
                <Card key={user.id} padding="md">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${user.username}`}>
                      <Avatar src={user.avatar} name={user.displayName} size="lg" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${user.username}`} className="font-semibold hover:underline block truncate">
                        {user.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.bio && <p className="text-sm mt-0.5 line-clamp-1">{user.bio}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{formatCount(user.followersCount)} followers</p>
                    </div>
                    <Button
                      size="sm"
                      variant={followedUsers.has(user.id) ? 'outline' : 'primary'}
                      onClick={() => setFollowedUsers(prev => {
                        const n = new Set(prev);
                        n.has(user.id) ? n.delete(user.id) : n.add(user.id);
                        return n;
                      })}
                    >
                      {followedUsers.has(user.id) ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trending Tags */}
        {(tab === 'All' || tab === 'Tags') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Trending Topics</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredTags.map(tag => (
                <Link
                  key={tag.id}
                  href={`/explore?tag=${tag.name}&tab=Tags`}
                  className="rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4 text-primary" />
                    {tag.isTrending && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Trending</span>}
                  </div>
                  <p className="font-bold">#{tag.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCount(tag.postCount)} posts</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Communities */}
        {(tab === 'All' || tab === 'Communities') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Communities</h2>
            </div>
            <div className="space-y-3">
              {filteredCommunities.map(c => (
                <Card key={c.id} padding="none" className="overflow-hidden">
                  {c.coverImage && (
                    <div className="h-20 bg-gradient-to-r from-primary/30 to-purple-500/30 relative">
                      <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover opacity-60" />
                    </div>
                  )}
                  <div className="p-4 flex items-start gap-3">
                    {c.avatarUrl && <img src={c.avatarUrl} alt={c.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0 -mt-6 ring-2 ring-background" />}
                    <div className="flex-1 min-w-0">
                      <Link href={`/communities/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatCount(c.memberCount)} members · {c.category}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={joinedCommunities.has(c.id) ? 'outline' : 'primary'}
                      onClick={() => setJoinedCommunities(prev => {
                        const n = new Set(prev);
                        n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                        return n;
                      })}
                    >
                      {joinedCommunities.has(c.id) ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Live */}
        {(tab === 'All' || tab === 'Live') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-bold text-lg">Live Now</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_LIVE_STREAMS.map(stream => (
                <Link key={stream.id} href={`/live?stream=${stream.id}`} className="rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                  <div className="relative aspect-video bg-gradient-to-br from-red-500/30 to-primary/30">
                    {stream.thumbnailUrl && <img src={stream.thumbnailUrl} alt={stream.title} className="h-full w-full object-cover" />}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
                      {formatCount(stream.viewerCount)} watching
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-semibold line-clamp-1">{stream.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Avatar src={stream.host.avatar} name={stream.host.displayName} size="xs" />
                      <p className="text-xs text-muted-foreground">{stream.host.displayName}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Audio rooms */}
        {(tab === 'All' || tab === 'Audio') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mic className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Audio Rooms</h2>
            </div>
            <div className="space-y-3">
              {MOCK_AUDIO_ROOMS.map(room => (
                <Link key={room.id} href={`/audio-rooms?room=${room.id}`}>
                  <Card padding="md" hover>
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-primary/30 flex items-center justify-center flex-shrink-0">
                        <Mic className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{room.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{room.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex -space-x-1">
                            {room.speakers.slice(0, 4).map(s => (
                              <Avatar key={s.id} src={s.avatar} name={s.displayName} size="xs" className="ring-1 ring-background" />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">{room.speakers.length} speakers · {formatCount(room.listenerCount)} listening</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-medium flex-shrink-0">Live</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Posts grid */}
        {(tab === 'All' || tab === 'Posts') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Featured Posts</h2>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {filteredPosts.filter(p => p.mediaUrls.length > 0).map(post => (
                <Link key={post.id} href={`/feed`} className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                  <img src={post.mediaUrls[0]} alt="" className="h-full w-full object-cover" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
