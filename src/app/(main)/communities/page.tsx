'use client';

import { useState } from 'react';
import { Plus, Users, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCount } from '@/lib/utils';
import { MOCK_COMMUNITIES } from '@/lib/mockData';
import Link from 'next/link';

const CATEGORIES = ['All', 'Art & Design', 'Technology', 'Health & Wellness', 'Music', 'Gaming', 'Education', 'Sports'];

export default function CommunitiesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [joined, setJoined] = useState<Set<string>>(
    new Set(MOCK_COMMUNITIES.filter(c => c.isMember).map(c => c.id))
  );

  const myCommunities = MOCK_COMMUNITIES.filter(c => joined.has(c.id));
  const discover = MOCK_COMMUNITIES.filter(c =>
    (activeCategory === 'All' || c.category === activeCategory) && !joined.has(c.id)
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Communities</h1>
        <Button size="sm" onClick={() => alert('Community creation coming soon!')}>
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* My communities */}
        {myCommunities.length > 0 && (
          <section>
            <h2 className="font-bold mb-3">Your Communities</h2>
            <div className="grid grid-cols-1 gap-3">
              {myCommunities.map(c => (
                <Link key={c.id} href={`/communities/${c.id}`}>
                  <Card padding="none" hover className="overflow-hidden">
                    {c.coverImage && (
                      <div className="h-16 bg-gradient-to-r from-primary/30 to-purple-500/30">
                        <img src={c.coverImage} alt="" className="h-full w-full object-cover opacity-70" />
                      </div>
                    )}
                    <div className="p-3 flex items-center gap-3">
                      {c.avatarUrl && <img src={c.avatarUrl} alt={c.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCount(c.memberCount)} members</p>
                      </div>
                      <span className="text-xs text-primary font-medium">View</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Discover */}
        <section>
          <h2 className="font-bold mb-3">Discover Communities</h2>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {discover.map(c => (
              <Card key={c.id} padding="none" className="overflow-hidden">
                {c.coverImage && (
                  <div className="h-28 bg-gradient-to-r from-primary/30 to-purple-500/30 relative">
                    <img src={c.coverImage} alt="" className="h-full w-full object-cover opacity-70" />
                    <div className="absolute bottom-3 left-3">
                      {c.avatarUrl && <img src={c.avatarUrl} alt={c.name} className="h-14 w-14 rounded-xl object-cover ring-2 ring-background" />}
                    </div>
                    <div className="absolute top-3 right-3">
                      {c.isPrivate
                        ? <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3" />Private</span>
                        : <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Globe className="h-3 w-3" />Public</span>
                      }
                    </div>
                  </div>
                )}
                <div className="p-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/communities/${c.id}`} className="font-bold hover:underline">{c.name}</Link>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatCount(c.memberCount)} members</span>
                        <span>{c.category}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setJoined(prev => { const n = new Set(prev); n.add(c.id); return n; })}
                      className="flex-shrink-0"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
