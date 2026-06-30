'use client';

import { motion } from 'framer-motion';
import { Moon, Clock, Coffee, BellOff } from 'lucide-react';
import { useNotificationPrefsStore } from '@/store/notificationPrefsStore';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';

const CATEGORY_LABELS: { type: NotificationType; label: string }[] = [
  { type: 'LIKE', label: 'Likes' },
  { type: 'COMMENT', label: 'Comments' },
  { type: 'FOLLOW', label: 'Follows' },
  { type: 'MENTION', label: 'Mentions' },
  { type: 'MESSAGE', label: 'Messages' },
  { type: 'LIVE', label: 'Live' },
  { type: 'TIP', label: 'Tips' },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('relative h-6 w-10 rounded-full transition-colors flex-shrink-0', on ? 'bg-primary' : 'bg-muted')}
      role="switch"
      aria-checked={on}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  );
}

export function NotificationPreferences() {
  const {
    doNotDisturb, quietHours, categoryEnabled,
    setDoNotDisturb, setQuietHours, toggleCategory,
  } = useNotificationPrefsStore();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="m-4 rounded-2xl border border-border bg-card/60 p-4 space-y-4">
        {/* Do Not Disturb */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <BellOff className="h-4 w-4 text-primary" /> Do Not Disturb
          </span>
          <Toggle on={doNotDisturb} onClick={() => setDoNotDisturb(!doNotDisturb)} />
        </div>

        {/* Quiet hours */}
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Moon className="h-4 w-4 text-primary" /> Quiet hours
            </span>
            <Toggle on={quietHours.enabled} onClick={() => setQuietHours({ enabled: !quietHours.enabled })} />
          </div>
          {quietHours.enabled && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="time"
                value={quietHours.start}
                onChange={(e) => setQuietHours({ start: e.target.value })}
                className="h-8 px-2 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="time"
                value={quietHours.end}
                onChange={(e) => setQuietHours({ end: e.target.value })}
                className="h-8 px-2 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Per-category */}
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notify me about</p>
          {CATEGORY_LABELS.map(({ type, label }) => {
            const on = categoryEnabled[type] ?? true;
            return (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Toggle on={on} onClick={() => toggleCategory(type)} />
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function WellbeingCard() {
  const { dailyLimitMinutes, setDailyLimit } = useNotificationPrefsStore();
  // Deterministic "used today" figure so it doesn't jump on every render.
  const usedMinutes = Math.round((new Date().getHours() * 60 + new Date().getMinutes()) / 9);
  const pct = Math.min(100, Math.round((usedMinutes / dailyLimitMinutes) * 100));
  const over = usedMinutes >= dailyLimitMinutes;

  return (
    <div className="m-4 rounded-2xl border border-border bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Coffee className="h-4 w-4 text-primary" /> Digital wellbeing
        </span>
        <span className={cn('text-xs font-semibold', over ? 'text-destructive' : 'text-muted-foreground')}>
          {usedMinutes} / {dailyLimitMinutes} min today
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      {over && (
        <p className="text-xs text-destructive font-medium">You’ve hit your daily limit — time for a break! ☕</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Daily limit</span>
        <input
          type="range"
          min={30}
          max={300}
          step={15}
          value={dailyLimitMinutes}
          onChange={(e) => setDailyLimit(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-xs font-semibold w-14 text-right">{dailyLimitMinutes} min</span>
      </div>
    </div>
  );
}
