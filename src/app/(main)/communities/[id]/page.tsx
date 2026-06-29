'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Users, Lock, Globe, Settings, Plus, ArrowLeft, Check, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { PostCard } from '@/components/feed/PostCard';
import { formatCount, formatRelativeTime } from '@/lib/utils';
import { MOCK_COMMUNITIES, MOCK_POSTS } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const COMMUNITY_TABS = ['Posts', 'Members', 'Requests', 'About', 'Rules'] as const;

interface JoinRequest {
  id: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  requestedAt: string;
}

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const community = MOCK_COMMUNITIES.find(c => c.id === id) || MOCK_COMMUNITIES[0];
  const [tab, setTab] = useState<typeof COMMUNITY_TABS[number]>('Posts');
  const [joined, setJoined] = useState(community.isMember ?? false);
  const [memberCount, setMemberCount] = useState(community.memberCount);

  // Members list local state
  const [members, setMembers] = useState<any[]>(community.members || []);

  // Join Requests state
  const [requests, setRequests] = useState<JoinRequest[]>([
    {
      id: 'req1',
      user: {
        id: 'u_req1',
        displayName: 'Marcus Aurelius',
        username: 'philosopher',
        avatar: 'https://picsum.photos/seed/marcus/100/100'
      },
      requestedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'req2',
      user: {
        id: 'u_req2',
        displayName: 'Ada Lovelace',
        username: 'ada_coder',
        avatar: 'https://picsum.photos/seed/ada/100/100'
      },
      requestedAt: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ]);

  const COMMUNITY_RULES = [
    'Be kind and respectful to all members',
    'No spam or self-promotion without moderator approval',
    'Share original content or properly credit sources',
    'Keep discussions on-topic and relevant to the community',
    'No harassment or hate speech of any kind',
    'Follow Wakka\'s Community Guidelines at all times',
  ];

  const handleApprove = (req: JoinRequest) => {
    // Remove from requests
    setRequests(prev => prev.filter(r => r.id !== req.id));
    // Add to members
    setMembers(prev => [...prev, {
      id: req.user.id,
      displayName: req.user.displayName,
      username: req.user.username,
      avatar: req.user.avatar || 'https://picsum.photos/seed/avatar/100/100'
    }]);
    // Increment member count
    setMemberCount(prev => prev + 1);
    toast.success(`Approved ${req.user.displayName}'s request to join!`);
  };

  const handleReject = (req: JoinRequest) => {
    // Remove from requests
    setRequests(prev => prev.filter(r => r.id !== req.id));
    toast.error(`Rejected ${req.user.displayName}'s request`);
  };

  const handleToggleJoin = () => {
    if (joined) {
      setJoined(false);
      setMemberCount(prev => prev - 1);
      toast.success(`Left ${community.name}`);
    } else {
      setJoined(true);
      setMemberCount(prev => prev + 1);
      toast.success(`Joined ${community.name}!`);
    }
  };

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
                <h1 className="text-xl font-bold text-foreground">{community.name}</h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {community.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {community.isPrivate ? 'Private' : 'Public'} · {community.category}
                </div>
              </div>
              <Button
                size="sm"
                variant={joined ? 'outline' : 'primary'}
                onClick={handleToggleJoin}
              >
                {joined ? 'Joined' : 'Join'}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{community.description}</p>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">{formatCount(memberCount)}</span>
            <span className="text-muted-foreground font-normal">members</span>
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
              'flex-1 py-3 text-xs font-semibold transition-colors relative',
              tab === t ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'Requests' && requests.length > 0 ? (
              <span className="flex items-center justify-center gap-1">
                Requests
                <span className="h-4 w-4 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-extrabold animate-pulse">
                  {requests.length}
                </span>
              </span>
            ) : t}
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
        <div className="p-4 space-y-4">
          <div>
            <h2 className="font-bold text-sm text-foreground mb-3">Moderators</h2>
            <div className="grid grid-cols-2 gap-3">
              {community.moderators.map(m => (
                <Card key={m.id} padding="sm" className="flex items-center gap-3">
                  <Avatar src={m.avatar} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{m.displayName}</p>
                    <p className="text-[10px] text-primary font-bold">Moderator</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground mb-3">Members</h2>
            <div className="grid grid-cols-2 gap-3">
              {members.map(m => (
                <Card key={m.id} padding="sm" className="flex items-center gap-3">
                  <Avatar src={m.avatar} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{m.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{m.username}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Moderation Tab */}
      {tab === 'Requests' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl p-3 text-xs text-primary font-semibold">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Moderator view: Review requests to join this community.</span>
          </div>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 bg-card border border-border border-dashed rounded-3xl">
              <Check className="h-8 w-8 text-success" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">Inbox completely clean!</p>
                <p className="text-xs text-muted-foreground max-w-xs">No pending requests to review.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <Card key={req.id} padding="md" className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={req.user.avatar} name={req.user.displayName} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{req.user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{req.user.username}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Requested {formatRelativeTime(req.requestedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(req)}
                      className="p-2 border border-border rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all active:scale-95 shadow-sm"
                      title="Reject request"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleApprove(req)}
                      className="p-2 border border-border rounded-xl text-success hover:bg-success/10 hover:border-success/30 transition-all active:scale-95 shadow-sm"
                      title="Approve request"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'About' && (
        <div className="p-4 space-y-5">
          <Card padding="md">
            <h3 className="font-semibold mb-3 text-foreground text-sm">About this community</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{community.description}</p>
          </Card>
          <Card padding="md">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-foreground">{community.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <span className="font-semibold text-foreground">{community.isPrivate ? 'Private' : 'Public'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-semibold text-foreground">{formatCount(memberCount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created by</span>
                <div className="flex items-center gap-2">
                  <Avatar src={community.creator.avatar} name={community.creator.displayName} size="xs" />
                  <span className="font-semibold text-foreground">{community.creator.displayName}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold text-foreground">{formatRelativeTime(community.createdAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Rules' && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Please follow these rules to keep the community healthy and welcoming.</p>
          {COMMUNITY_RULES.map((rule, i) => (
            <Card key={i} padding="md">
              <div className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed">{rule}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
