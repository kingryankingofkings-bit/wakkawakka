'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Users, Lock, Globe, Settings, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { PostCard } from '@/components/feed/PostCard';
import { formatCount, formatRelativeTime } from '@/lib/utils';
import { MOCK_COMMUNITIES, MOCK_POSTS } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const COMMUNITY_TABS = ['Posts', 'Members', 'About', 'Rules'] as const;

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const community = MOCK_COMMUNITIES.find(c => c.id === id) || MOCK_COMMUNITIES[0];
  const [tab, setTab] = useState<typeof COMMUNITY_TABS[number]>('Posts');
  const [joined, setJoined] = useState(community.isMember ?? false);

  const COMMUNITY_RULES = [
    'Be kind and respectful to all members',
    'No spam or self-promotion without moderator approval',
    'Share original content or properly credit sources',
    'Keep discussions on-topic and relevant to the community',
    'No harassment or hate speech of any kind',
    'Follow Wakka\'s Community Guidelines at all times',
  ];

  return (
    <div className="min-h-screen">
      {/* Back */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <Link href="/communities" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Communities
        </Link>
      </div>

      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-r from-primary/40 to-purple-600/40">
        {community.coverImage && (
          <img src={community.coverImage} alt={community.name} className="h-full w-full object-cover opacity-70" />
        )}
      </div>

      {/* Header */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-end gap-4 -mt-8 mb-3">
          {community.avatarUrl && (
            <img src={community.avatarUrl} alt={community.name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-background flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">{community.name}</h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {community.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {community.isPrivate ? 'Private' : 'Public'} · {community.category}
                </div>
              </div>
              <Button
                size="sm"
                variant={joined ? 'outline' : 'primary'}
                onClick={() => setJoined(!joined)}
              >
                {joined ? 'Joined' : 'Join'}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{community.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{formatCount(community.memberCount)}</span>
            <span className="text-muted-foreground">members</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-background/80 backdrop-blur-md border-b border-border flex">
        {COMMUNITY_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors relative',
              tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'Posts' && (
        <div>
          {joined && (
            <div className="p-4 border-b border-border">
              <Button variant="outline" className="w-full" onClick={() => alert('Post creation coming soon!')}>
                <Plus className="h-4 w-4" />
                Post to {community.name}
              </Button>
            </div>
          )}
          {MOCK_POSTS.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {tab === 'Members' && (
        <div className="p-4">
          <h2 className="font-semibold mb-3">Moderators</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {community.moderators.map(m => (
              <Card key={m.id} padding="sm" className="flex items-center gap-3">
                <Avatar src={m.avatar} name={m.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.displayName}</p>
                  <p className="text-xs text-primary">Moderator</p>
                </div>
              </Card>
            ))}
          </div>
          <h2 className="font-semibold mb-3">Members</h2>
          <div className="grid grid-cols-2 gap-3">
            {community.members.map(m => (
              <Card key={m.id} padding="sm" className="flex items-center gap-3">
                <Avatar src={m.avatar} name={m.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{m.username}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'About' && (
        <div className="p-4 space-y-5">
          <Card padding="md">
            <h3 className="font-semibold mb-3">About this community</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{community.description}</p>
          </Card>
          <Card padding="md">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{community.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <span className="font-medium">{community.isPrivate ? 'Private' : 'Public'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{formatCount(community.memberCount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created by</span>
                <div className="flex items-center gap-2">
                  <Avatar src={community.creator.avatar} name={community.creator.displayName} size="xs" />
                  <span className="font-medium">{community.creator.displayName}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatRelativeTime(community.createdAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Rules' && (
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Please follow these rules to keep the community healthy and welcoming.</p>
          {COMMUNITY_RULES.map((rule, i) => (
            <Card key={i} padding="md">
              <div className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm">{rule}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
