import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme } from '@/types';

type ActiveModal =
  | null
  | 'createPost'
  | 'editProfile'
  | 'newConversation'
  | 'reportContent'
  | 'settings';

interface UIState {
  theme: Theme;
  accentColor: string;
  sidebarOpen: boolean;
  activeModal: ActiveModal;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: ActiveModal) => void;
  closeModal: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'system',
      accentColor: 'blue',
      sidebarOpen: true,
      activeModal: null,

      // Actions
      setTheme: (theme) => set({ theme }),

      setAccentColor: (accentColor) => set({ accentColor }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setActiveModal: (activeModal) => set({ activeModal }),

      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'wakka-ui',
      storage: createJSONStorage(() => localStorage),
      // Persist preferences but not transient modal state
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
