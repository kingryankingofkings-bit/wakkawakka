'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Trophy, Plus, CheckCircle, Flame, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Bounty States
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');

  // Claims Log States
  const [claims, setClaims] = useState<any[]>([
    { id: '1', bountyTitle: 'Stream for 5 hours', user: 'SpeedyGamer', reward: 50.00, date: '2026-06-29' },
    { id: '2', bountyTitle: 'Get 100 followers', user: 'VibeCreator', reward: 25.00, date: '2026-06-30' }
  ]);

  const fetchBounties = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bounties');
      const json = await res.json();
      if (json.data) setBounties(json.data);
    } catch {
      toast.error('Failed to load bounties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rewardAmount) return;

    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          rewardAmount: parseFloat(rewardAmount),
        }),
      });

      if (res.ok) {
        toast.success('Bounty created successfully!');
        setShowCreate(false);
        setTitle('');
        setDescription('');
        setRewardAmount('');
        fetchBounties();
      }
    } catch {
      toast.error('Failed to create bounty');
    }
  };

  const handleClaim = (bounty: any) => {
    toast.success(`Bounty "${bounty.title}" claimed! Payout of $${bounty.rewardAmount} initiated.`);
    const newClaim = {
      id: String(claims.length + 1),
      bountyTitle: bounty.title,
      user: 'Current User',
      reward: bounty.rewardAmount,
      date: new Date().toISOString().split('T')[0]
    };
    setClaims([newClaim, ...claims]);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-amber-500">
          <Trophy className="h-5 w-5 fill-current" /> Kick Bounties
        </h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Bounty
        </Button>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {showCreate && (
          <Card padding="md" className="border-amber-500/20 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm">New Creator Incentive Bounty</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateBounty} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Bounty Title *</label>
                <Input required placeholder="E.g., Host a 2 hour stream" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Target / Goal Goal</label>
                <Input placeholder="E.g., Streaming overlay active" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Reward Amount ($) *</label>
                <Input required type="number" placeholder="50.00" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="xs" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" size="xs">Publish</Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-xs bg-card border border-border border-dashed rounded-3xl">
            No active bounties yet. Create incentives to boost user streams and follows!
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-bold text-sm text-foreground flex items-center gap-1">
              <Flame className="h-4 w-4 text-amber-500 fill-current" /> Active Bounties ({bounties.length})
            </h2>
            {bounties.map(b => (
              <Card key={b.id} padding="md" className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{b.title}</h4>
                    <p className="text-xs text-muted-foreground">{b.description || 'Goal Incentive'}</p>
                  </div>
                  <span className="text-sm font-black text-amber-500">${b.rewardAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/50 pt-2 text-xs">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users className="h-3.5 w-3.5" /> Participants: {b.participantsCount || 0}</span>
                  <Button size="xs" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleClaim(b)}>
                    Claim Reward
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Claims log */}
        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-500" /> Claims Payout Log
          </h3>
          <div className="space-y-2">
            {claims.map(c => (
              <div key={c.id} className="p-3 bg-muted/40 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-foreground">{c.bountyTitle}</p>
                  <p className="text-[10px] text-muted-foreground">Claimed by @{c.user}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-500">+${c.reward.toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {c.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
