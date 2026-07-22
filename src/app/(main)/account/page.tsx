'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCog, Download, Link2, KeyRound, ShieldAlert, Plus, Copy, Trash2, ArrowLeft, Check, MapPin, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAccountStore, LOGIN_PROVIDERS, RECENT_LOGINS } from '@/store/accountStore';
import { useComposerStore } from '@/store/composerStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useSearchStore } from '@/store/searchStore';
import { downloadJSON } from '@/lib/exportData';
import { CURRENT_USER } from '@/lib/mockData';
import { cn } from '@/lib/utils';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={cn('relative h-6 w-10 rounded-full transition-colors flex-shrink-0', on ? 'bg-primary' : 'bg-muted')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  );
}

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const account = useAccountStore();
  const [pwLabel, setPwLabel] = useState('');
  const [revealId, setRevealId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  function handleDownload() {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      profile: {
        username: CURRENT_USER.username,
        displayName: CURRENT_USER.displayName,
        email: (CURRENT_USER as any).email || 'user@example.com',
        followers: CURRENT_USER.followersCount,
        following: CURRENT_USER.followingCount,
      },
      drafts: useComposerStore.getState().draft,
      scheduledPosts: useComposerStore.getState().scheduledPosts,
      orders: useCommerceStore.getState().orders,
      tips: useCommerceStore.getState().tips,
      subscriptions: useCommerceStore.getState().subscriptions,
      blockedAccounts: useSafetyStore.getState().blocked,
      reports: useSafetyStore.getState().reports,
      savedSearches: useSearchStore.getState().savedSearches,
      mutedKeywords: useSearchStore.getState().mutedKeywords,
      connectedLogins: account.connected,
    };
    downloadJSON(`wakka-account-data-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
    toast.success('Your data archive is downloading');
  }

  function createPw() {
    const pw = account.createAppPassword(pwLabel);
    setRevealId(pw.id);
    setPwLabel('');
    toast.success('App password generated');
  }

  return (
    <div className="px-4 py-5 space-y-6">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <div className="flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Account & Authentication</h1>
        </div>
      </div>

      {/* Download your data */}
      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold"><Download className="h-4 w-4 text-primary" /> Download your data</h2>
            <p className="text-xs text-muted-foreground mt-1">A JSON archive of your profile, drafts, orders, and settings.</p>
          </div>
          <button onClick={handleDownload} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </section>

      {/* Connected accounts */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Link2 className="h-4 w-4 text-primary" /> Connected accounts</h2>
        {LOGIN_PROVIDERS.map((p: any) => {
          const on = mounted ? (account.connected as any)[p] : false;
          return (
            <div key={p} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3">
              <div>
                <p className="text-sm font-semibold">{p}</p>
                <p className="text-xs text-muted-foreground">{on ? 'Connected' : 'Not connected'}</p>
              </div>
              <button
                onClick={() => { account.toggleProvider(p); toast.success(`${on ? 'Disconnected' : 'Connected'} ${p}`); }}
                className={cn('text-xs font-semibold px-3 h-8 rounded-lg border transition-colors', on ? 'border-border hover:bg-muted' : 'border-primary bg-primary text-primary-foreground')}
              >
                {on ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </section>

      {/* App passwords */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><KeyRound className="h-4 w-4 text-primary" /> App passwords</h2>
        <div className="flex gap-2">
          <input
            value={pwLabel}
            onChange={(e) => setPwLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createPw()}
            placeholder="Label (e.g. Email client)"
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={createPw} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1">
            <Plus className="h-4 w-4" /> Generate
          </button>
        </div>
        {mounted && account.appPasswords.map((pw: any) => (
          <div key={pw.id} className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{pw.label}</p>
              <code className="text-xs font-mono text-muted-foreground">{revealId === pw.id ? pw.value : '••••-••••-••••-••••'}</code>
            </div>
            <button onClick={() => navigator.clipboard.writeText(pw.value).then(() => toast.success('Copied'))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Copy">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={() => account.revokeAppPassword(pw.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Revoke">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </section>

      {/* Login alerts & activity */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold"><ShieldAlert className="h-4 w-4 text-primary" /> Login alerts</h2>
          <Toggle on={mounted ? account.loginAlerts : false} onClick={() => account.setLoginAlerts(!account.loginAlerts)} />
        </div>
        <p className="text-xs text-muted-foreground">Get notified about logins from unrecognized devices.</p>
        {RECENT_LOGINS.map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
            <MapPin className={cn('h-4 w-4 flex-shrink-0', l.trusted ? 'text-muted-foreground' : 'text-destructive')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold flex items-center gap-2">
                {l.device}
                {!l.trusted && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Unrecognized</span>}
              </p>
              <p className="text-xs text-muted-foreground">{l.location} · {l.when}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Deactivate account */}
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-destructive"><PauseCircle className="h-4 w-4" /> Deactivate account</h2>
        <p className="text-xs text-muted-foreground">
          Pausing hides your profile and posts until you sign back in. Your data is kept.
        </p>
        {mounted && account.deactivated ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500"><Check className="h-3.5 w-3.5" /> Account paused</span>
            <button onClick={() => { account.setDeactivated(false); toast.success('Welcome back!'); }} className="text-xs font-semibold px-3 h-8 rounded-lg border border-border hover:bg-muted">
              Reactivate
            </button>
          </div>
        ) : !confirmDeactivate ? (
          <button onClick={() => setConfirmDeactivate(true)} className="text-xs font-semibold px-3 h-8 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10">
            Deactivate
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Are you sure?</span>
            <button onClick={() => { account.setDeactivated(true); setConfirmDeactivate(false); toast('Account paused'); }} className="text-xs font-semibold px-3 h-8 rounded-lg bg-destructive text-white">
              Yes, pause it
            </button>
            <button onClick={() => setConfirmDeactivate(false)} className="text-xs font-semibold px-3 h-8 rounded-lg border border-border hover:bg-muted">
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
