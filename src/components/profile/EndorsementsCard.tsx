'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, ThumbsUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEndorsementStore, seedSkillsFor } from '@/store/endorsementStore';
import { formatCount, cn } from '@/lib/utils';

interface EndorsementsCardProps {
  userId: string;
  displayName: string;
  isOwnProfile: boolean;
}

/**
 * Recommendations & Endorsements (Category 3). LinkedIn-style skill endorsements:
 * visitors endorse a profile's skills; the owner curates which skills appear.
 * Persisted locally per profile so it survives reloads without a backend.
 */
export function EndorsementsCard({ userId, displayName, isOwnProfile }: EndorsementsCardProps) {
  const { byUser, ensureSeed, endorse, addSkill, removeSkill } = useEndorsementStore();
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const seeds = useMemo(() => seedSkillsFor(userId), [userId]);

  useEffect(() => {
    setMounted(true);
    ensureSeed(userId, seeds);
  }, [userId, seeds, ensureSeed]);

  // Before hydration/seed, fall back to the deterministic seeds so SSR matches.
  const skills = (mounted && byUser[userId]) || seeds;
  const sorted = [...skills].sort((a, b) => b.count - a.count);

  function handleEndorse(skill: string) {
    if (isOwnProfile) {
      toast('You can’t endorse your own skills');
      return;
    }
    endorse(userId, skill);
  }

  function handleAdd() {
    const v = draft.trim();
    if (!v) return;
    addSkill(userId, v);
    setDraft('');
    setAdding(false);
    toast.success(`Added “${v}”`);
  }

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Skills & endorsements</h3>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add skill
          </button>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. Motion Design"
                autoFocus
                className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={handleAdd} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {sorted.map((s) => (
          <div
            key={s.skill}
            className={cn(
              'group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border text-xs font-medium transition-colors',
              s.endorsedByMe
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground'
            )}
          >
            <span>{s.skill}</span>
            <span className="text-[10px] text-muted-foreground">{formatCount(s.count)}</span>
            {!isOwnProfile ? (
              <button
                onClick={() => handleEndorse(s.skill)}
                title={s.endorsedByMe ? 'Remove endorsement' : `Endorse ${displayName}`}
                className={cn(
                  'p-1 rounded-full transition-colors',
                  s.endorsedByMe ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <ThumbsUp className={cn('h-3.5 w-3.5', s.endorsedByMe && 'fill-current')} />
              </button>
            ) : (
              <button
                onClick={() => removeSkill(userId, s.skill)}
                title="Remove skill"
                className="p-1 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground">No skills yet.</p>
        )}
      </div>
    </div>
  );
}
