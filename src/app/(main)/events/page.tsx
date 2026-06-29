'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Globe, Plus, Star, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { apiFetch, apiGet } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface EventRow {
  id: string; title: string; description?: string; coverImage?: string;
  location?: string; isOnline: boolean; category?: string;
  startsAt: string; endsAt?: string;
  goingCount: number; interestedCount: number;
  creator: { id: string; displayName: string; username: string; avatar?: string };
  attendees?: { status: string }[];
}

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'going', label: 'Going' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'past', label: 'Past' },
] as const;

export default function EventsPage() {
  const [filter, setFilter] = useState<string>('upcoming');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    setEvents(await apiGet<EventRow[]>(`/api/events?filter=${f}`, []));
    setLoading(false);
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function rsvp(eventId: string, status: string) {
    const res = await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) });
    if (res.ok) {
      const { data } = await res.json();
      setEvents(prev => prev.map(e => e.id === eventId
        ? { ...e, attendees: [{ status }], goingCount: data.goingCount, interestedCount: data.interestedCount }
        : e));
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Events</h1>
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
        {!loading && events.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No events here yet. Create one to get started.</p>
          </div>
        )}
        {events.map(e => {
          const myStatus = e.attendees?.[0]?.status;
          return (
            <Card key={e.id} padding="none" className="overflow-hidden flex flex-col">
              <div className="h-28 bg-gradient-to-br from-primary/30 to-purple-500/30 relative">
                {e.coverImage && <img src={e.coverImage} alt="" className="h-full w-full object-cover" />}
                <div className="absolute top-2 left-2 bg-background/90 rounded-lg px-2 py-1 text-center leading-none">
                  <div className="text-[10px] uppercase text-primary font-bold">{fmtMonth(e.startsAt)}</div>
                  <div className="text-lg font-bold">{fmtDay(e.startsAt)}</div>
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold leading-tight">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {e.isOnline ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  {e.isOnline ? 'Online' : e.location || 'Location TBA'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtFull(e.startsAt)}</p>
                <p className="text-xs text-muted-foreground mt-1">{e.goingCount} going · {e.interestedCount} interested</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant={myStatus === 'GOING' ? 'primary' : 'outline'} className="flex-1"
                    onClick={() => rsvp(e.id, 'GOING')}>
                    <Check className="h-4 w-4" /> Going
                  </Button>
                  <Button size="sm" variant={myStatus === 'INTERESTED' ? 'primary' : 'outline'} className="flex-1"
                    onClick={() => rsvp(e.id, 'INTERESTED')}>
                    <Star className="h-4 w-4" /> Interested
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); setFilter('hosting'); }} />
    </div>
  );
}

function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', isOnline: false, startsAt: '', category: '' });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.title || !form.startsAt) return;
    setSaving(true);
    const res = await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setForm({ title: '', description: '', location: '', isOnline: false, startsAt: '', category: '' }); onCreated(); }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Create Event">
      <div className="space-y-3">
        <Input placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[80px] resize-none" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isOnline} onChange={e => setForm({ ...form, isOnline: e.target.checked })} />
          Online event
        </label>
        {!form.isOnline && (
          <Input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        )}
        <div>
          <label className="text-xs text-muted-foreground">Starts at</label>
          <Input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
        </div>
        <Input placeholder="Category (optional)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}><X className="h-4 w-4" /> Cancel</Button>
          <Button onClick={submit} isLoading={saving} disabled={!form.title || !form.startsAt}>Create Event</Button>
        </div>
      </div>
    </Modal>
  );
}

function fmtMonth(s: string) { return new Date(s).toLocaleString('en-US', { month: 'short' }); }
function fmtDay(s: string) { return new Date(s).getDate(); }
function fmtFull(s: string) { return new Date(s).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
