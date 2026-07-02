import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Account, Profile } from "@/types";
import { MOCK_ACCOUNT, MOCK_PROFILES } from "@/lib/mockData";

interface AuthState {
  account: Account | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

interface AuthActions {
  setAccount: (_account: Account | null) => void;
  setProfiles: (_profiles: Profile[]) => void;
  setActiveProfile: (_profile: Profile | null) => void;
  addProfile: (_profile: Profile) => void;
  logout: () => void;
  updateActiveProfile: (_updates: Partial<Profile>) => void;
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
      account: MOCK_ACCOUNT,
      profiles: MOCK_PROFILES,
      activeProfile: MOCK_PROFILES[4],
      isLoading: true,
      isAuthenticated: true,
      token: "mock-token-123",

      // Actions
      setAccount: (account) =>
        set({
          account,
          isAuthenticated: !!account,
          isLoading: false,
        }),

      setProfiles: (profiles) => set({ profiles }),
      
      setActiveProfile: (activeProfile) => set({ activeProfile }),

      addProfile: (profile) => set({ profiles: [...get().profiles, profile] }),

      logout: () =>
        set({
          account: null,
          profiles: [],
          activeProfile: null,
          isAuthenticated: false,
          token: null,
          isLoading: false,
        }),

      updateActiveProfile: (updates) => {
        const current = get().activeProfile;
        if (!current) return;
        const updated = { ...current, ...updates };
        set({
          activeProfile: updated,
          profiles: get().profiles.map(p => p.id === updated.id ? updated : p),
        });
      },

      incrementStreak: () => {
        const current = get().activeProfile;
        if (!current) return;
        const updated = { ...current, streakDays: current.streakDays + 1 };
        set({
          activeProfile: updated,
          profiles: get().profiles.map(p => p.id === updated.id ? updated : p),
        });
      },

      resetStreak: () => {
        const current = get().activeProfile;
        if (!current) return;
        const updated = { ...current, streakDays: 0 };
        set({
          activeProfile: updated,
          profiles: get().profiles.map(p => p.id === updated.id ? updated : p),
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setToken: (token) => set({ token }),
    }),
    {
      name: "wakka-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist account, token, and profiles
      partialize: (state) => ({
        account: state.account,
        profiles: state.profiles,
        activeProfile: state.activeProfile,
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
