'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MAX_RECENT = 12;

interface SearchState {
  recentSearches: string[];
  savedSearches: string[];
  mutedKeywords: string[];
}

interface SearchActions {
  addRecent: (q: string) => void;
  removeRecent: (q: string) => void;
  clearRecent: () => void;
  toggleSaved: (q: string) => void;
  isSaved: (q: string) => boolean;
  addMuted: (word: string) => void;
  removeMuted: (word: string) => void;
}

type SearchStore = SearchState & SearchActions;

const norm = (s: string) => s.trim();

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      savedSearches: [],
      mutedKeywords: [],

      addRecent: (q) => {
        const query = norm(q);
        if (!query) return;
        set((state) => ({
          recentSearches: [query, ...state.recentSearches.filter((s) => s !== query)].slice(
            0,
            MAX_RECENT
          ),
        }));
      },

      removeRecent: (q) =>
        set((state) => ({ recentSearches: state.recentSearches.filter((s) => s !== q) })),

      clearRecent: () => set({ recentSearches: [] }),

      toggleSaved: (q) => {
        const query = norm(q);
        if (!query) return;
        set((state) => ({
          savedSearches: state.savedSearches.includes(query)
            ? state.savedSearches.filter((s) => s !== query)
            : [query, ...state.savedSearches],
        }));
      },

      isSaved: (q) => get().savedSearches.includes(norm(q)),

      addMuted: (word) => {
        const w = norm(word).toLowerCase();
        if (!w) return;
        set((state) => ({
          mutedKeywords: state.mutedKeywords.includes(w)
            ? state.mutedKeywords
            : [...state.mutedKeywords, w],
        }));
      },

      removeMuted: (word) =>
        set((state) => ({
          mutedKeywords: state.mutedKeywords.filter((w) => w !== word.toLowerCase()),
        })),
    }),
    {
      name: 'wakka-search',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
