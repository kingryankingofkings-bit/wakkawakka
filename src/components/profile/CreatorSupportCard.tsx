'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Coffee, Star, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCommerceStore } from '@/store/commerceStore';
import { formatCurrency, cn } from '@/lib/utils';

interface CreatorSupportCardProps {
  creatorId: string;
  creatorName: string;
  isOwnProfile: boolean;
}

const TIP_PRESETS = [3, 5, 10, 25];

const TIERS = [
  { id: 'fan', label: 'Fan', monthly: 5, perks: ['Supporter badge', 'Members-only posts'] },
  { id: 'super', label: 'Super Fan', monthly: 15, perks: ['Everything in Fan', 'Monthly Q&A', 'Early access'] },
];

/**
 * Creator monetization (Category 5): tip jar + subscription tiers.
 * Tips and subscriptions are recorded in the persisted commerce store and
 * surfaced on the Orders page. Mock payment — no real charge.
 */
export function CreatorSupportCard({ creatorId, creatorName, isOwnProfile }: CreatorSupportCardProps) {
  const { addTip, subscribe, unsubscribe, isSubscribed, subscriptions } = useCommerceStore();
  const [tipOpen, setTipOpen] = useState(false);
  const [amount, setAmount] = useState<number>(5);
  const [custom, setCustom] = useState('');
  const [message, setMessage] = useState('');
  const [subOpen, setSubOpen] = useState(false);

  const subscribed = isSubscribed(creatorId);
  const currentSub = subscriptions.find((s) => s.creatorId === creatorId);

  if (isOwnProfile) return null;

  const finalAmount = custom ? Math.max(1, Math.round(Number(custom) || 0)) : amount;

  function sendTip() {
    if (finalAmount < 1) {
      toast.error('Enter a tip amount');
      return;
    }
    addTip(creatorId, creatorName, finalAmount, message.trim() || undefined);
    toast.success(`Tipped ${formatCurrency(finalAmount)} to ${creatorName} 💜`);
    setTipOpen(false);
    setMessage('');
    setCustom('');
  }

  function handleSubscribe(tier: (typeof TIERS)[number]) {
    subscribe(creatorId, creatorName, tier.label, tier.monthly);
    toast.success(`Subscribed to ${creatorName} · ${tier.label}`);
    setSubOpen(false);
  }

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Support {creatorName}</h3>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTipOpen((v) => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold transition-colors"
        >
          <Coffee className="h-4 w-4" /> Send a tip
        </button>
        <button
          onClick={() => (subscribed ? unsubscribe(creatorId) : setSubOpen((v) => !v))}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-semibold transition-colors',
            subscribed
              ? 'border border-primary/40 bg-primary/10 text-primary'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Star className={cn('h-4 w-4', subscribed && 'fill-current')} />
          {subscribed ? `Subscribed · ${currentSub?.tier}` : 'Subscribe'}
        </button>
      </div>

      {/* Tip panel */}
      <AnimatePresence>
        {tipOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <div className="flex gap-2">
                {TIP_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setAmount(p); setCustom(''); }}
                    className={cn(
                      'flex-1 h-9 rounded-lg border text-sm font-semibold transition-colors',
                      !custom && amount === p
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:bg-muted'
                    )}
                  >
                    {formatCurrency(p)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Custom amount"
                className="w-full h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message (optional)"
                maxLength={140}
                className="w-full h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button onClick={() => setTipOpen(false)} className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
                <button onClick={sendTip} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  Tip {formatCurrency(finalAmount)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscribe tiers */}
      <AnimatePresence>
        {subOpen && !subscribed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => handleSubscribe(tier)}
                  className="w-full text-left rounded-xl border border-border hover:border-primary/40 p-3 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">{tier.label}</span>
                    <span className="text-sm font-bold text-primary">{formatCurrency(tier.monthly)}/mo</span>
                  </div>
                  <ul className="space-y-0.5">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary" /> {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
