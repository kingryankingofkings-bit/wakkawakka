'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserX, VolumeX, Flag, Monitor, Plus, X, ArrowLeft, Smartphone, Laptop } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSafetyStore, REPORT_REASONS } from '@/store/safetyStore';
import { useSearchStore } from '@/store/searchStore';
import { formatRelativeTime, cn } from '@/lib/utils';

const ACTIVE_SESSIONS = [
  { id: 's1', device: 'Chrome · macOS', location: 'San Francisco, US', current: true, icon: Laptop },
  { id: 's2', device: 'Wakka iOS App', location: 'San Francisco, US', current: false, icon: Smartphone },
  { id: 's3', device: 'Firefox · Windows', location: 'Austin, US', current: false, icon: Monitor },
];

export default function SafetyPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { blocked, reports, unblockUser } = useSafetyStore();
  const { mutedKeywords, addMuted, removeMuted } = useSearchStore();
  const [mutedDraft, setMutedDraft] = useState('');
  const [revoked, setRevoked] = useState<Set<string>>(new Set());

  const reasonLabel = (v: string) => REPORT_REASONS.find(r => r.value === v)?.label ?? v;

  return (
    <div className="px-4 py-5 space-y-6">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Privacy & Safety</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Manage blocked accounts, muted words, reports, and active sessions.</p>
      </div>

      {/* Blocked accounts */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><UserX className="h-4 w-4 text-primary" /> Blocked accounts</h2>
        {!mounted ? null : blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven’t blocked anyone. Block from a post’s menu to hide their content.</p>
        ) : (
          blocked.map(b => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3">
              <div>
                <p className="text-sm font-semibold">{b.displayName}</p>
                <p className="text-xs text-muted-foreground">@{b.username} · blocked {formatRelativeTime(b.blockedAt)}</p>
              </div>
              <button
                onClick={() => { unblockUser(b.id); toast.success(`Unblocked @${b.username}`); }}
                className="text-xs font-semibold px-3 h-8 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </section>

      {/* Muted words */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><VolumeX className="h-4 w-4 text-primary" /> Muted words</h2>
        <div className="flex gap-2">
          <input
            value={mutedDraft}
            onChange={e => setMutedDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && mutedDraft.trim()) { addMuted(mutedDraft); setMutedDraft(''); } }}
            placeholder="Add a word to mute from your feed…"
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => { if (mutedDraft.trim()) { addMuted(mutedDraft); setMutedDraft(''); } }}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Mute
          </button>
        </div>
        {mounted && mutedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mutedKeywords.map(w => (
              <span key={w} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                {w}
                <button onClick={() => removeMuted(w)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Active sessions */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Monitor className="h-4 w-4 text-primary" /> Active sessions</h2>
        {ACTIVE_SESSIONS.map(s => {
          const Icon = s.icon;
          const isRevoked = revoked.has(s.id);
          return (
            <div key={s.id} className={cn('flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3', isRevoked && 'opacity-50')}>
              <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {s.device}
                  {s.current && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">This device</span>}
                </p>
                <p className="text-xs text-muted-foreground">{s.location}</p>
              </div>
              {!s.current && (
                <button
                  disabled={isRevoked}
                  onClick={() => { setRevoked(prev => new Set(prev).add(s.id)); toast.success('Session signed out'); }}
                  className="text-xs font-semibold px-3 h-8 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isRevoked ? 'Signed out' : 'Sign out'}
                </button>
              )}
            </div>
          );
        })}
      </section>

      {/* Report history */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Flag className="h-4 w-4 text-primary" /> Your reports</h2>
        {!mounted ? null : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports submitted.</p>
        ) : (
          reports.map(r => (
            <div key={r.id} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{r.targetLabel}</p>
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{reasonLabel(r.reason)} · {formatRelativeTime(r.createdAt)}</p>
              {r.detail && <p className="text-xs text-muted-foreground mt-1 italic">“{r.detail}”</p>}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
