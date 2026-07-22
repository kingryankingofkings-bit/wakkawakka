'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Post, Visibility } from '@/types';

/** A post the user scheduled to publish later (Auto-Scheduling & Queue System). */
export interface ScheduledPost {
  id: string;
  content: string;
  mediaUrls: string[];
  altTexts: string[];
  hashtags: string[];
  visibility: Visibility;
  /** ISO timestamp for when it should publish. */
  scheduledFor: string;
  createdAt: string;
}

/** An autosaved composer draft. */
export interface ComposerDraft {
  content: string;
  visibility: Visibility;
  updatedAt: string;
}

interface ComposerState {
  draft: ComposerDraft | null;
  scheduledPosts: ScheduledPost[];
}

interface ComposerActions {
  saveDraft: (draft: Omit<ComposerDraft, 'updatedAt'>) => void;
  clearDraft: () => void;
  schedulePost: (post: Omit<ScheduledPost, 'id' | 'createdAt'>) => ScheduledPost;
  removeScheduled: (id: string) => void;
  updateScheduled: (id: string, updates: Partial<ScheduledPost>) => void;
  /** Returns scheduled posts whose time has passed (ready to publish). */
  dueScheduled: (now?: number) => ScheduledPost[];
}

type ComposerStore = ComposerState & ComposerActions;

export const useComposerStore = create<ComposerStore>()(
  persist(
    (set, get) => ({
      draft: null,
      scheduledPosts: [],

      saveDraft: (draft) =>
        set({ draft: { ...draft, updatedAt: new Date().toISOString() } }),

      clearDraft: () => set({ draft: null }),

      schedulePost: (post) => {
        const scheduled: ScheduledPost = {
          ...post,
          id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          scheduledPosts: [...state.scheduledPosts, scheduled].sort(
            (a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor)
          ),
        }));
        return scheduled;
      },

      removeScheduled: (id) =>
        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((p) => p.id !== id),
        })),

      updateScheduled: (id, updates) =>
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      dueScheduled: (now = Date.now()) =>
        get().scheduledPosts.filter((p) => +new Date(p.scheduledFor) <= now),
    }),
    {
      name: 'wakka-composer',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Build a full Post from a scheduled entry (used when publishing). */
export function scheduledToPost(s: ScheduledPost, author: Post['author']): Post {
  return {
    id: `post_${Date.now()}`,
    content: s.content,
    author,
    authorId: author.id,
    mediaUrls: s.mediaUrls,
    type: s.mediaUrls.length > 0 ? 'IMAGE' : 'TEXT',
    visibility: s.visibility,
    isEphemeral: false,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    hashtags: s.hashtags,
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
