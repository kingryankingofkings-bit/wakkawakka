'use client';

import { useState } from 'react';
import { Plus, Users, Lock, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCount } from '@/lib/utils';
import { MOCK_COMMUNITIES } from '@/lib/mockData';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import ProfileCommunityConsole from '@/components/profile/ProfileCommunityConsole';

const CATEGORIES = ['All', 'Art & Design', 'Technology', 'Health & Wellness', 'Music', 'Gaming', 'Education', 'Sports'];

export default function CommunitiesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeView, setActiveView] = useState<'explore' | 'console'>('explore');
  const [joined, setJoined] = useState<Set<string>>(
    new Set(MOCK_COMMUNITIES.filter(c => c.isMember).map(c => c.id))
  );
  
  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  const myCommunities = MOCK_COMMUNITIES.filter(c => joined.has(c.id));
  const discover = MOCK_COMMUNITIES.filter(c =>
    (activeCategory === 'All' || c.category === activeCategory) && !joined.has(c.id)
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Communities</h1>
        <div className="flex items-center gap-2">
          {/* Tab selectors to toggle console */}
          <div className="flex bg-muted/80 p-0.5 rounded-xl border border-border text-xs">
            <button
              onClick={() => setActiveView('explore')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'explore' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveView('console')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeView === 'console' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Console ⚡
            </button>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeView === 'console' ? (
          <ProfileCommunityConsole />
        ) : (
          <>
            {/* Promotional Launch Card */}
            <Card className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-background border border-primary/20 p-5 rounded-2xl relative overflow-hidden">
              <div className="max-w-md space-y-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Profiles & Communities Console
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Interactive simulations for collaborative posts, &ldquo;Add Yours&rdquo; prompts, broadcast channels, affiliation badges, channel points, and community join requests.
                </p>
                <Button size="xs" onClick={() => setActiveView('console')} className="mt-1 font-bold">
                  Launch Console ⚡
                </Button>
              </div>
            </Card>

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
          </>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create a Community">
        <form 
          className="p-5 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setIsCreateOpen(false);
            setNewCommName('');
            setNewCommDesc('');
          }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Community Name</label>
            <input 
              type="text" 
              value={newCommName}
              onChange={(e) => setNewCommName(e.target.value)}
              placeholder="e.g. Next.js Developers"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              value={newCommDesc}
              onChange={(e) => setNewCommDesc(e.target.value)}
              placeholder="What is this community about?"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none h-20"
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2">
            Create Community
          </Button>
        </form>
      </Modal>
    </div>
  );
}

