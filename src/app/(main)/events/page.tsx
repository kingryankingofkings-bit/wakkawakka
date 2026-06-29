'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, MapPin, Globe, Plus, Star, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { apiFetch, apiGet } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface EventRow {
  id: string; 
  title: string; 
  description?: string; 
  coverImage?: string;
  location?: string; 
  isOnline: boolean; 
  category?: string;
  startsAt: string; 
  endsAt?: string;
  goingCount: number; 
  interestedCount: number;
  creator: { id: string; displayName: string; username: string; avatar?: string };
  attendees?: { status: string }[];
}

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'going', label: 'Going' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'past', label: 'Past' },
] as const;

const MOCK_EVENTS: EventRow[] = [
  {
    id: 'e1',
    title: 'Wakka Developer Hackathon 🚀',
    description: 'Build awesome modules for Wakka Social Network and win prizes!',
    coverImage: 'https://picsum.photos/seed/hackathon/800/400',
    location: 'Silicon Valley Hackerspace',
    isOnline: false,
    category: 'Tech',
    startsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    goingCount: 142,
    interestedCount: 290,
    creator: { id: 'u_current', displayName: 'You', username: 'you', avatar: 'https://picsum.photos/seed/you/100/100' },
    attendees: []
  },
  {
    id: 'e2',
    title: 'Electronic Music Festival 🎵',
    description: 'Live DJ sets from international and local artists.',
    coverImage: 'https://picsum.photos/seed/musicfest/800/400',
    location: 'Wakka Virtual Arena',
    isOnline: true,
    category: 'Music',
    startsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    goingCount: 890,
    interestedCount: 1540,
    creator: { id: 'u2', displayName: 'SoundVibes', username: 'soundvibes', avatar: 'https://picsum.photos/seed/sound/100/100' },
    attendees: []
  },
  {
    id: 'e3',
    title: 'Modern Art Exhibition 🎨',
    description: 'Showcase of visual canvas arts and digital illustrations.',
    coverImage: 'https://picsum.photos/seed/artexpo/800/400',
    location: 'Metropolitan Art Gallery',
    isOnline: false,
    category: 'Art',
    startsAt: new Date(Date.now() - 86400000 * 1).toISOString(), // Past event
    goingCount: 64,
    interestedCount: 110,
    creator: { id: 'u3', displayName: 'Creative Lab', username: 'creativelab', avatar: 'https://picsum.photos/seed/creative/100/100' },
    attendees: []
  }
];

export default function EventsPage() {
  const [filter, setFilter] = useState<string>('upcoming');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const serverEvents = await apiGet<EventRow[]>('/api/events', []);
      if (serverEvents && serverEvents.length > 0) {
        setEvents(serverEvents);
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch (e) {
      setEvents(MOCK_EVENTS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const isPast = new Date(e.startsAt).getTime() < Date.now();
      const myStatus = e.attendees?.[0]?.status;
      
      if (filter === 'past') return isPast;
      if (filter === 'upcoming') return !isPast;
      if (filter === 'going') return myStatus === 'GOING';
      if (filter === 'hosting') return e.creator.id === 'u_current';
      return true;
    });
  }, [events, filter]);

  async function rsvp(eventId: string, status: 'GOING' | 'INTERESTED') {
    // Optimistic Local State Update
    let selectedStatus: string | undefined = status;
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const isCurrentStatus = e.attendees?.[0]?.status === status;
        selectedStatus = isCurrentStatus ? undefined : status;
        
        let goingOffset = 0;
        let interestedOffset = 0;
        
        const oldStatus = e.attendees?.[0]?.status;
        if (oldStatus === 'GOING') goingOffset--;
        if (oldStatus === 'INTERESTED') interestedOffset--;
        
        if (selectedStatus === 'GOING') goingOffset++;
        if (selectedStatus === 'INTERESTED') interestedOffset++;
        
        return {
          ...e,
          attendees: selectedStatus ? [{ status: selectedStatus }] : [],
          goingCount: Math.max(0, e.goingCount + goingOffset),
          interestedCount: Math.max(0, e.interestedCount + interestedOffset)
        };
      }
      return e;
    }));

    if (selectedStatus) {
      toast.success(`Marked as ${selectedStatus.toLowerCase()}!`);
    } else {
      toast.success('RSVP removed');
    }

    try {
      await apiFetch(`/api/events/${eventId}/rsvp`, { 
        method: 'POST', 
        body: JSON.stringify({ status: selectedStatus || 'NONE' }) 
      });
    } catch (err) {
      console.error('Failed to sync RSVP:', err);
      toast.error('Failed to sync with server');
    }
  }

  const handleCreateCreated = (newEvent: EventRow) => {
    setEvents(prev => [newEvent, ...prev]);
    setShowCreate(false);
    setFilter('hosting');
    toast.success('Event created successfully!');
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Events</h1>
          <Button size="sm" onClick={() => setShowCreate(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border active:scale-95',
                filter === f.id ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 'bg-card border-border text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading && <p className="col-span-full text-center text-muted-foreground py-12">Loading events…</p>}
        {!loading && filteredEvents.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-20 text-center bg-card border border-border border-dashed rounded-3xl space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">No events found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No events matched your category filters. Create a new event to get started.
              </p>
            </div>
          </div>
        )}
        {filteredEvents.map(e => {
          const myStatus = e.attendees?.[0]?.status;
          return (
            <Card key={e.id} padding="none" className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-primary/30 to-purple-500/30 relative">
                {e.coverImage && <img src={e.coverImage} alt="" className="h-full w-full object-cover" />}
                <div className="absolute top-3 left-3 bg-background/90 rounded-xl p-2 text-center shadow-md min-w-[40px] leading-tight">
                  <div className="text-[10px] uppercase text-primary font-extrabold">{fmtMonth(e.startsAt)}</div>
                  <div className="text-base font-extrabold text-foreground">{fmtDay(e.startsAt)}</div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-card">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-foreground line-clamp-1 leading-tight">{e.title}</h3>
                  {e.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{e.description}</p>}
                  <div className="flex flex-col gap-1 pt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {e.isOnline ? <Globe className="h-3 w-3 text-primary" /> : <MapPin className="h-3 w-3 text-primary" />}
                      <span>{e.isOnline ? 'Online via Wakka Live' : e.location || 'Location TBA'}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{fmtFull(e.startsAt)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {e.goingCount} going · {e.interestedCount} interested
                  </p>
                  <div className="flex gap-2">
                    <Button size="xs" variant={myStatus === 'GOING' ? 'primary' : 'outline'} className="flex-1 text-xs py-1.5 h-8 font-semibold rounded-xl"
                      onClick={() => rsvp(e.id, 'GOING')}>
                      <Check className="h-3.5 w-3.5" /> Going
                    </Button>
                    <Button size="xs" variant={myStatus === 'INTERESTED' ? 'primary' : 'outline'} className="flex-1 text-xs py-1.5 h-8 font-semibold rounded-xl"
                      onClick={() => rsvp(e.id, 'INTERESTED')}>
                      <Star className="h-3.5 w-3.5" /> Interested
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreateCreated} />
    </div>
  );
}

function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (newEvent: EventRow) => void }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', isOnline: false, startsAt: '', category: '' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.startsAt) return;
    setSaving(true);
    
    const newEvent: EventRow = {
      id: `e_${Date.now()}`,
      title: form.title,
      description: form.description,
      location: form.location,
      isOnline: form.isOnline,
      category: form.category,
      startsAt: new Date(form.startsAt).toISOString(),
      goingCount: 1,
      interestedCount: 0,
      creator: { id: 'u_current', displayName: 'You', username: 'you', avatar: 'https://picsum.photos/seed/you/100/100' },
      attendees: [{ status: 'GOING' }]
    };

    try {
      await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(form) });
    } catch (err) {
      console.error('Failed to save event:', err);
      toast.error('Failed to sync with server');
    }

    setSaving(false);
    setForm({ title: '', description: '', location: '', isOnline: false, startsAt: '', category: '' });
    onCreated(newEvent);
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Create Event">
      <form onSubmit={submit} className="space-y-4 p-1">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
          <Input required placeholder="e.g. Design Sync & Coffee ☕" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Description</label>
          <textarea placeholder="Describe what attendees can expect..." value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-2xl border border-border bg-background p-3 text-xs min-h-[90px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <input type="checkbox" id="isOnline" checked={form.isOnline} onChange={e => setForm({ ...form, isOnline: e.target.checked })} className="h-4 w-4 accent-primary rounded cursor-pointer" />
          <label htmlFor="isOnline" className="text-xs text-foreground font-semibold cursor-pointer">
            This is an online virtual event
          </label>
        </div>

        {!form.isOnline && (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Location</label>
            <Input placeholder="e.g. Cafe HQ, San Francisco" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Starts At</label>
            <Input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
            <Input placeholder="e.g. Design, Tech" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!form.title || !form.startsAt}>Create Event</Button>
        </div>
      </form>
    </Modal>
  );
}

function fmtMonth(s: string) { return new Date(s).toLocaleString('en-US', { month: 'short' }); }
function fmtDay(s: string) { return new Date(s).getDate(); }
function fmtFull(s: string) { return new Date(s).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
