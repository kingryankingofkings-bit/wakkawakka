'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, BadgeCheck, Globe, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { apiFetch, apiGet } from '@/lib/apiClient';
import { cn, formatCount } from '@/lib/utils';

interface PageRow {
  id: string; name: string; slug: string; category: string; description?: string;
  avatarUrl?: string; coverImage?: string; isVerified: boolean; followerCount: number;
  followers?: { id: string }[];
  owner: { id: string; displayName: string; username: string };
}

const FILTERS = [
  { id: 'all', label: 'Discover' },
  { id: 'following', label: 'Following' },
  { id: 'mine', label: 'Your Pages' },
] as const;

export default function PagesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    setPages(await apiGet<PageRow[]>(`/api/pages?filter=${f}`, []));
    setLoading(false);
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function toggleFollow(id: string) {
    const res = await apiFetch(`/api/pages/${id}/follow`, { method: 'POST' });
    if (res.ok) {
      const { data } = await res.json();
      setPages(prev => prev.map(p => p.id === id
        ? { ...p, followers: data.following ? [{ id: 'me' }] : [], followerCount: p.followerCount + (data.following ? 1 : -1) }
        : p));
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Pages</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create</Button>
        </div>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === f.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading && <p className="col-span-full text-center text-muted-foreground py-12">Loading…</p>}
        {!loading && pages.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pages here yet. Create one for your business or brand.</p>
          </div>
        )}
        {pages.map(p => {
          const following = (p.followers?.length ?? 0) > 0;
          return (
            <Card key={p.id} padding="none" className="overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-primary/30 to-purple-500/30">
                {p.coverImage && <img src={p.coverImage} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="flex items-start gap-3 -mt-8">
                  <Avatar src={p.avatarUrl} name={p.name} size="lg" className="ring-2 ring-background" />
                  <div className="flex-1 min-w-0 pt-8">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold truncate">{p.name}</span>
                      {p.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.category} · {formatCount(p.followerCount)} followers</p>
                  </div>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                <Button size="sm" variant={following ? 'outline' : 'primary'} className="w-full mt-3"
                  onClick={() => toggleFollow(p.id)}>
                  {following ? 'Following' : 'Follow'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <CreatePageModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); setFilter('mine'); }} />
    </div>
  );
}

function CreatePageModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', category: '', description: '', website: '' });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.name) return;
    setSaving(true);
    const res = await apiFetch('/api/pages', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setForm({ name: '', category: '', description: '', website: '' }); onCreated(); }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Create Page">
      <div className="space-y-3">
        <Input placeholder="Page name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Category (e.g. Business, Artist, Brand)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <textarea placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[80px] resize-none" />
        <Input placeholder="Website (optional)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}><X className="h-4 w-4" /> Cancel</Button>
          <Button onClick={submit} isLoading={saving} disabled={!form.name}>Create Page</Button>
        </div>
      </div>
    </Modal>
  );
}
