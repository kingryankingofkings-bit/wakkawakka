import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
import { CURRENT_USER } from "@/lib/mockData";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

interface AuthActions {
  setUser: (_user: User | null) => void;
  logout: () => void;
  updateUser: (_updates: Partial<User>) => void;
  setLoading: (_isLoading: boolean) => void;
  setToken: (_token: string | null) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: CURRENT_USER,
      isLoading: true,
      isAuthenticated: true,
      token: "mock-token-123",

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          isLoading: false,
        }),

      updateUser: (updates) => {
        const current = get().user;
        if (!current) return;
        set({
          user: { ...current, ...updates },
        });
      },

      incrementStreak: () => {
        const current = get().user;
        if (!current) return;
        set({
          user: { ...current, streakDays: current.streakDays + 1 },
        });
      },

      resetStreak: () => {
        const current = get().user;
        if (!current) return;
        set({
          user: { ...current, streakDays: 0 },
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setToken: (token) => set({ token }),
    }),
    {
      name: "wakka-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist user and token, not transient loading state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Rehydrate with isLoading: true so the app can check auth on mount
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    },
  ),
);
