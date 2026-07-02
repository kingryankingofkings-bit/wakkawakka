import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme } from "@/types";

type ActiveModal =
  | null
  | "createPost"
  | "editProfile"
  | "newConversation"
  | "reportContent"
  | "settings";

interface UIState {
  theme: Theme;
  accentColor: string;
  sidebarOpen: boolean;
  activeModal: ActiveModal;
  userLocation: { latitude: number; longitude: number } | null;
}

interface UIActions {
  setTheme: (_theme: Theme) => void;
  setAccentColor: (_color: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (_open: boolean) => void;
  setActiveModal: (_modal: ActiveModal) => void;
  closeModal: () => void;
  setUserLocation: (_location: { latitude: number; longitude: number } | null) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      theme: "system",
      accentColor: "blue",
      sidebarOpen: true,
      activeModal: null,
      userLocation: { latitude: 37.7749, longitude: -122.4194 },

      // Actions
      setTheme: (theme) => set({ theme }),

      setAccentColor: (accentColor) => set({ accentColor }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setActiveModal: (activeModal) => set({ activeModal }),

      closeModal: () => set({ activeModal: null }),

      setUserLocation: (userLocation) => set({ userLocation }),
    }),
    {
      name: "wakka-ui",
      storage: createJSONStorage(() => localStorage),
      // Persist preferences but not transient modal state
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        sidebarOpen: state.sidebarOpen,
        userLocation: state.userLocation,
      }),
    },
  ),
);
