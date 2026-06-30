'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  blockedAt: string;
}

export type ReportReason = 'SPAM' | 'HARASSMENT' | 'HATE' | 'MISINFORMATION' | 'NUDITY' | 'INAPPROPRIATE' | 'OTHER';

export interface Report {
  id: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  detail?: string;
  createdAt: string;
  status: 'submitted' | 'reviewing';
}

interface SafetyState {
  blocked: BlockedUser[];
  reports: Report[];
}

interface SafetyActions {
  blockUser: (user: { id: string; username: string; displayName: string }) => void;
  unblockUser: (id: string) => void;
  isBlocked: (id: string) => boolean;
  addReport: (r: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
}

type SafetyStore = SafetyState & SafetyActions;

export const useSafetyStore = create<SafetyStore>()(
  persist(
    (set, get) => ({
      blocked: [],
      reports: [],

      blockUser: (user) =>
        set((state) =>
          state.blocked.some((b) => b.id === user.id)
            ? state
            : {
                blocked: [
                  { ...user, blockedAt: new Date().toISOString() },
                  ...state.blocked,
                ],
              }
        ),

      unblockUser: (id) =>
        set((state) => ({ blocked: state.blocked.filter((b) => b.id !== id) })),

      isBlocked: (id) => get().blocked.some((b) => b.id === id),

      addReport: (r) =>
        set((state) => ({
          reports: [
            {
              ...r,
              id: `rep_${Date.now()}`,
              createdAt: new Date().toISOString(),
              status: 'submitted',
            },
            ...state.reports,
          ],
        })),
    }),
    {
      name: 'wakka-safety',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam or scam' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'HATE', label: 'Hate speech' },
  { value: 'MISINFORMATION', label: 'False information' },
  { value: 'NUDITY', label: 'Nudity or sexual content' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'OTHER', label: 'Something else' },
];
