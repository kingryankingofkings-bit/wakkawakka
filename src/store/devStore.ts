'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
}

export type WebhookEvent = 'post.published' | 'follower.new' | 'message.received' | 'order.created';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: string;
}

export interface ConnectedApp {
  id: string;
  name: string;
  scopes: string[];
  authorizedAt: string;
}

interface DevState {
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  connectedApps: ConnectedApp[];
  seeded: boolean;
}

interface DevActions {
  createKey: (name: string, scopes: string[]) => ApiKey;
  revokeKey: (id: string) => void;
  addWebhook: (url: string, events: WebhookEvent[]) => void;
  removeWebhook: (id: string) => void;
  toggleWebhook: (id: string) => void;
  revokeApp: (id: string) => void;
  ensureSeed: () => void;
}

type DevStore = DevState & DevActions;

function randomKey(): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `wakka_sk_${hex}`;
}

const SEED_APPS: ConnectedApp[] = [
  { id: 'app_buffer', name: 'Buffer', scopes: ['posts:read', 'posts:write'], authorizedAt: new Date(Date.now() - 86400000 * 9).toISOString() },
  { id: 'app_zapier', name: 'Zapier', scopes: ['posts:read', 'webhooks:manage'], authorizedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
];

export const useDevStore = create<DevStore>()(
  persist(
    (set) => ({
      apiKeys: [],
      webhooks: [],
      connectedApps: [],
      seeded: false,

      ensureSeed: () =>
        set((state) =>
          state.seeded ? state : { connectedApps: SEED_APPS, seeded: true }
        ),

      createKey: (name, scopes) => {
        const key: ApiKey = {
          id: `key_${Date.now()}`,
          name: name.trim() || 'Untitled key',
          key: randomKey(),
          scopes,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ apiKeys: [key, ...state.apiKeys] }));
        return key;
      },

      revokeKey: (id) =>
        set((state) => ({ apiKeys: state.apiKeys.filter((k) => k.id !== id) })),

      addWebhook: (url, events) =>
        set((state) => ({
          webhooks: [
            {
              id: `wh_${Date.now()}`,
              url: url.trim(),
              events,
              active: true,
              createdAt: new Date().toISOString(),
            },
            ...state.webhooks,
          ],
        })),

      removeWebhook: (id) =>
        set((state) => ({ webhooks: state.webhooks.filter((w) => w.id !== id) })),

      toggleWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, active: !w.active } : w
          ),
        })),

      revokeApp: (id) =>
        set((state) => ({ connectedApps: state.connectedApps.filter((a) => a.id !== id) })),
    }),
    {
      name: 'wakka-developer',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const ALL_SCOPES = ['posts:read', 'posts:write', 'profile:read', 'messages:read', 'webhooks:manage'];
export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = ['post.published', 'follower.new', 'message.received', 'order.created'];
