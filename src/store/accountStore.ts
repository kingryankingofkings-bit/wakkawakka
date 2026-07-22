'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LoginProvider = 'Google' | 'Apple' | 'GitHub' | 'X';

export interface AppPassword {
  id: string;
  label: string;
  value: string;
  createdAt: string;
}

interface AccountState {
  connected: Record<LoginProvider, boolean>;
  appPasswords: AppPassword[];
  loginAlerts: boolean;
  deactivated: boolean;
}

interface AccountActions {
  toggleProvider: (p: LoginProvider) => void;
  createAppPassword: (label: string) => AppPassword;
  revokeAppPassword: (id: string) => void;
  setLoginAlerts: (v: boolean) => void;
  setDeactivated: (v: boolean) => void;
}

type AccountStore = AccountState & AccountActions;

function randomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const groups = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return groups.join('-');
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      connected: { Google: true, Apple: false, GitHub: false, X: false },
      appPasswords: [],
      loginAlerts: true,
      deactivated: false,

      toggleProvider: (p) =>
        set((state) => ({ connected: { ...state.connected, [p]: !state.connected[p] } })),

      createAppPassword: (label) => {
        const pw: AppPassword = {
          id: `app_${Date.now()}`,
          label: label.trim() || 'Untitled',
          value: randomPassword(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ appPasswords: [pw, ...state.appPasswords] }));
        return pw;
      },

      revokeAppPassword: (id) =>
        set((state) => ({ appPasswords: state.appPasswords.filter((p) => p.id !== id) })),

      setLoginAlerts: (v) => set({ loginAlerts: v }),

      setDeactivated: (v) => set({ deactivated: v }),
    }),
    {
      name: 'wakka-account',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const LOGIN_PROVIDERS: LoginProvider[] = ['Google', 'Apple', 'GitHub', 'X'];

export const RECENT_LOGINS = [
  { id: 'l1', device: 'Chrome · macOS', location: 'San Francisco, US', when: 'Just now', trusted: true },
  { id: 'l2', device: 'Wakka iOS App', location: 'San Francisco, US', when: '2h ago', trusted: true },
  { id: 'l3', device: 'Unknown · Linux', location: 'Berlin, DE', when: 'Yesterday', trusted: false },
];
