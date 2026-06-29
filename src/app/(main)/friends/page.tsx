'use client';

import { useEffect, useState, useCallback } from 'react';
import { Suspense } from 'react';
import { UserPlus, UserCheck, UserX, Users, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { apiFetch, apiGet } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface FriendUser {
  id: string; username: string; displayName: string; avatar?: string;
  bio?: string; isVerified?: boolean; verificationTier?: string; mutualFriends?: number;
}
interface FriendRequestRow {
  id: string; status: string; message?: string;
  sender: FriendUser; receiver: FriendUser;
}

const TABS = [
  { id: 'all', label: 'All Friends', icon: Users },
  { id: 'requests', label: 'Requests', icon: UserPlus },
  { id: 'suggestions', label: 'Suggestions', icon: Sparkles },
] as const;

export default function FriendsPage() {
  return (
    <Suspense>
      <FriendsInner />
    </Suspense>
  );
}

function FriendsInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get('tab') ?? 'all');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequestRow[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const [f, r, s] = await Promise.all([
      apiGet<FriendUser[]>('/api/friends', []),
      apiGet<FriendRequestRow[]>('/api/friends/requests?box=incoming', []),
      apiGet<FriendUser[]>('/api/friends/suggestions', []),
    ]);
    setFriends(f); setRequests(r); setSuggestions(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const mark = (id: string, on: boolean) =>
    setBusy(prev => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });

  async function respond(requestId: string, action: 'accept' | 'decline') {
    mark(requestId, true);
    await apiFetch('/api/friends/requests', { method: 'PATCH', body: JSON.stringify({ requestId, action }) });
    setRequests(prev => prev.filter(r => r.id !== requestId));
    if (action === 'accept') await load();
    mark(requestId, false);
  }

  async function addFriend(receiverId: string) {
    mark(receiverId, true);
    await apiFetch('/api/friends/requests', { method: 'POST', body: JSON.stringify({ receiverId }) });
    setSuggestions(prev => prev.filter(s => s.id !== receiverId));
    mark(receiverId, false);
  }

  async function removeFriend(friendId: string) {
    mark(friendId, true);
    await apiFetch(`/api/friends?friendId=${friendId}`, { method: 'DELETE' });
    setFriends(prev => prev.filter(f => f.id !== friendId));
    mark(friendId, false);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold mb-3">Friends</h1>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.id === 'requests' && requests.length > 0 && (
                <span className="ml-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading && <p className="text-center text-muted-foreground py-12">Loading…</p>}

        {!loading && tab === 'all' && (
          friends.length === 0
            ? <EmptyState icon={Users} text="No friends yet. Check Suggestions to connect with people." />
            : friends.map(f => (
                <PersonRow key={f.id} user={f}
                  action={
                    <Button variant="outline" size="sm" isLoading={busy.has(f.id)} onClick={() => removeFriend(f.id)}>
                      <UserX className="h-4 w-4" /> Remove
                    </Button>
                  } />
              ))
        )}

        {!loading && tab === 'requests' && (
          requests.length === 0
            ? <EmptyState icon={UserPlus} text="No pending friend requests." />
            : requests.map(r => (
                <PersonRow key={r.id} user={r.sender}
                  action={
                    <div className="flex gap-2">
                      <Button size="sm" isLoading={busy.has(r.id)} onClick={() => respond(r.id, 'accept')}>
                        <UserCheck className="h-4 w-4" /> Confirm
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => respond(r.id, 'decline')}>Delete</Button>
                    </div>
                  } />
              ))
        )}

        {!loading && tab === 'suggestions' && (
          suggestions.length === 0
            ? <EmptyState icon={Sparkles} text="No suggestions right now. Come back later." />
            : suggestions.map(s => (
                <PersonRow key={s.id} user={s}
                  subtitle={s.mutualFriends ? `${s.mutualFriends} mutual friend${s.mutualFriends > 1 ? 's' : ''}` : undefined}
                  action={
                    <Button size="sm" isLoading={busy.has(s.id)} onClick={() => addFriend(s.id)}>
                      <UserPlus className="h-4 w-4" /> Add Friend
                    </Button>
                  } />
              ))
        )}
      </div>
    </div>
  );
}

function PersonRow({ user, action, subtitle }: { user: FriendUser; action: React.ReactNode; subtitle?: string }) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <Link href={`/profile/${user.username}`}>
        <Avatar src={user.avatar} name={user.displayName} size="lg" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`} className="flex items-center gap-1 hover:underline">
          <span className="font-semibold truncate">{user.displayName}</span>
          {user.isVerified && <VerificationBadge tier={(user.verificationTier as never) || 'BLUE'} size="sm" />}
        </Link>
        <p className="text-xs text-muted-foreground truncate">
          {subtitle ?? (user.bio || `@${user.username}`)}
        </p>
      </div>
      {action}
    </Card>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-muted-foreground max-w-xs">{text}</p>
    </div>
  );
}
