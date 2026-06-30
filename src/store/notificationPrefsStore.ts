'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NotificationType } from '@/types';

export interface QuietHours {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

interface NotificationPrefsState {
  doNotDisturb: boolean;
  quietHours: QuietHours;
  /** Per-category enabled flags. Missing key = enabled. */
  categoryEnabled: Partial<Record<NotificationType, boolean>>;
  dailyLimitMinutes: number;
}

interface NotificationPrefsActions {
  setDoNotDisturb: (v: boolean) => void;
  setQuietHours: (q: Partial<QuietHours>) => void;
  toggleCategory: (type: NotificationType) => void;
  isCategoryEnabled: (type: NotificationType) => boolean;
  setDailyLimit: (minutes: number) => void;
}

type NotificationPrefsStore = NotificationPrefsState & NotificationPrefsActions;

export const useNotificationPrefsStore = create<NotificationPrefsStore>()(
  persist(
    (set, get) => ({
      doNotDisturb: false,
      quietHours: { enabled: false, start: '22:00', end: '07:00' },
      categoryEnabled: {},
      dailyLimitMinutes: 120,

      setDoNotDisturb: (v) => set({ doNotDisturb: v }),

      setQuietHours: (q) => set((state) => ({ quietHours: { ...state.quietHours, ...q } })),

      toggleCategory: (type) =>
        set((state) => ({
          categoryEnabled: {
            ...state.categoryEnabled,
            [type]: !(state.categoryEnabled[type] ?? true),
          },
        })),

      isCategoryEnabled: (type) => get().categoryEnabled[type] ?? true,

      setDailyLimit: (minutes) => set({ dailyLimitMinutes: minutes }),
    }),
    {
      name: 'wakka-notif-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** True if `now` falls inside the quiet-hours window (handles overnight ranges). */
export function isQuietNow(q: QuietHours, now: Date = new Date()): boolean {
  if (!q.enabled) return false;
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMin(q.start);
  const end = toMin(q.end);
  if (start === end) return false;
  // Overnight window (e.g. 22:00 -> 07:00) wraps past midnight.
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}
