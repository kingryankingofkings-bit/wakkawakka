'use client';

import { useState, useEffect } from 'react';
import { Code2, Key, Webhook as WebhookIcon, Plug, Plus, Copy, Trash2, Eye, EyeOff, Check, Send, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDevStore, ALL_SCOPES, ALL_WEBHOOK_EVENTS, type WebhookEvent } from '@/store/devStore';
import { formatRelativeTime, cn } from '@/lib/utils';

const TABS = [
  { id: 'keys', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
  { id: 'apps', label: 'Connected Apps', icon: Plug },
  { id: 'embed', label: 'Embed', icon: Code2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

function copy(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text).then(() => toast.success(label)).catch(() => {});
}

export default function DeveloperPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabId>('keys');
  const store = useDevStore();

  useEffect(() => {
    setMounted(true);
    store.ensureSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Developer Portal</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Build on Wakka Wakka: manage API keys, webhooks, connected apps, and embeds.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {!mounted ? null : (
        <>
          {tab === 'keys' && <ApiKeysTab />}
          {tab === 'webhooks' && <WebhooksTab />}
          {tab === 'apps' && <ConnectedAppsTab />}
          {tab === 'embed' && <EmbedTab />}
        </>
      )}
    </div>
  );
}

function ApiKeysTab() {
  const { apiKeys, createKey, revokeKey } = useDevStore();
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['posts:read']);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function toggleScope(s: string) {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function create() {
    if (scopes.length === 0) { toast.error('Pick at least one scope'); return; }
    const key = createKey(name, scopes);
    setRevealed((prev) => new Set(prev).add(key.id));
    setName('');
    toast.success('API key created');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
        <h2 className="text-sm font-bold">Create a new key</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Production server)"
          className="w-full h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-wrap gap-1.5">
          {ALL_SCOPES.map((s: any) => (
            <button
              key={s}
              onClick={() => toggleScope(s)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                scopes.includes(s) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={create} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="h-4 w-4" /> Generate key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No API keys yet.</p>
      ) : (
        apiKeys.map((k: any) => {
          const isRevealed = revealed.has(k.id);
          return (
            <div key={k.id} className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{k.name}</span>
                <span className="text-[10px] text-muted-foreground">created {formatRelativeTime(k.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded-lg px-2 py-1.5 truncate">
                  {isRevealed ? k.key : `${k.key.slice(0, 12)}${'•'.repeat(16)}`}
                </code>
                <button onClick={() => setRevealed((p) => { const n = new Set(p); n.has(k.id) ? n.delete(k.id) : n.add(k.id); return n; })} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title={isRevealed ? 'Hide' : 'Reveal'}>
                  {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => copy(k.key, 'Key copied')} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Copy">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => { revokeKey(k.id); toast('Key revoked'); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Revoke">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {k.scopes.map((s: any) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{s}</span>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function WebhooksTab() {
  const { webhooks, addWebhook, removeWebhook, toggleWebhook } = useDevStore();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['post.published']);

  function toggleEvent(e: WebhookEvent) {
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  function add() {
    if (!/^https?:\/\/.+/.test(url.trim())) { toast.error('Enter a valid https URL'); return; }
    if (events.length === 0) { toast.error('Select at least one event'); return; }
    addWebhook(url, events);
    setUrl('');
    toast.success('Webhook added');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
        <h2 className="text-sm font-bold">Add an endpoint</h2>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhooks/wakka"
          className="w-full h-9 px-3 rounded-lg border border-border bg-transparent text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-wrap gap-1.5">
          {ALL_WEBHOOK_EVENTS.map((e: any) => (
            <button
              key={e}
              onClick={() => toggleEvent(e)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-mono border transition-colors',
                events.includes(e) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {e}
            </button>
          ))}
        </div>
        <button onClick={add} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No webhooks configured.</p>
      ) : (
        webhooks.map((w: any) => (
          <div key={w.id} className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full flex-shrink-0', w.active ? 'bg-green-500' : 'bg-muted-foreground')} />
              <code className="flex-1 text-xs font-mono truncate">{w.url}</code>
              <button onClick={() => { toast.success('Test event sent (200 OK)'); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Send test">
                <Send className="h-4 w-4" />
              </button>
              <button onClick={() => toggleWebhook(w.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title={w.active ? 'Disable' : 'Enable'}>
                <Power className={cn('h-4 w-4', w.active && 'text-green-500')} />
              </button>
              <button onClick={() => { removeWebhook(w.id); toast('Webhook removed'); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {w.events.map((e: any) => (
                <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{e}</span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ConnectedAppsTab() {
  const { connectedApps, revokeApp } = useDevStore();
  return (
    <div className="space-y-3">
      {connectedApps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No connected apps.</p>
      ) : (
        connectedApps.map((a: any) => (
          <div key={a.id} className="rounded-xl border border-border bg-card/60 p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {a.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{a.name}</p>
              <p className="text-xs text-muted-foreground">Authorized {formatRelativeTime(a.authorizedAt)} · {a.scopes.join(', ')}</p>
            </div>
            <button onClick={() => { revokeApp(a.id); toast('Access revoked'); }} className="text-xs font-semibold px-3 h-8 rounded-lg border border-border hover:bg-muted transition-colors">
              Revoke
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function EmbedTab() {
  const [type, setType] = useState<'profile' | 'post'>('profile');
  const [slug, setSlug] = useState('you_user');
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://wakka.app';
  const src = type === 'profile' ? `${origin}/embed/profile/${slug}` : `${origin}/embed/post/${slug}`;
  const snippet = `<iframe src="${src}" width="400" height="${type === 'profile' ? 240 : 480}" frameborder="0" loading="lazy" title="Wakka ${type}"></iframe>`;

  function doCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      toast.success('Embed code copied');
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
        <div className="flex gap-2">
          {(['profile', 'post'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn('flex-1 h-9 rounded-lg text-sm font-semibold border transition-colors capitalize', type === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={type === 'profile' ? 'username' : 'post id'}
          className="w-full h-9 px-3 rounded-lg border border-border bg-transparent text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Embed code</span>
          <button onClick={doCopy} className="flex items-center gap-1 text-xs font-semibold text-primary">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">{snippet}</pre>
      </div>
    </div>
  );
}
