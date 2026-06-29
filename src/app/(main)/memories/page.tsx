'use client';

import { useEffect, useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { apiGet } from '@/lib/apiClient';

interface Memory {
  id: string; content?: string; mediaUrls: string; createdAt: string; yearsAgo: number;
  author: { id: string; displayName: string; username: string; avatar?: string };
}

function media(m: string): string[] {
  try { const a = JSON.parse(m); return Array.isArray(a) ? a : []; } catch { return []; }
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Memory[]>('/api/memories', []).then(m => { setMemories(m); setLoading(false); });
  }, []);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> On This Day</h1>
        <p className="text-sm text-muted-foreground">Looking back at {today}</p>
      </div>

      <div className="p-4 space-y-3">
        {loading && <p className="text-center text-muted-foreground py-12">Loading…</p>}
        {!loading && memories.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground max-w-xs">No memories from this day yet. As you post over time, they’ll resurface here.</p>
          </div>
        )}
        {memories.map(m => {
          const imgs = media(m.mediaUrls);
          return (
            <Card key={m.id}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{m.yearsAgo} year{m.yearsAgo > 1 ? 's' : ''} ago today</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={m.author.avatar} name={m.author.displayName} size="sm" />
                <div>
                  <p className="text-sm font-medium">{m.author.displayName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {m.content && <p className="text-sm mb-2">{m.content}</p>}
              {imgs.length > 0 && (
                <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
                  {imgs.slice(0, 4).map((u, i) => <img key={i} src={u} alt="" className="w-full h-32 object-cover" />)}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
