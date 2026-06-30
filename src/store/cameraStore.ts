import { create } from "zustand";

export type CameraMode = "NORMAL" | "BE_REAL" | "DISAPPEARING";

export interface Lens {
  id: string;
  name: string;
  effect: string;
}

interface CameraState {
  activeLensId: string | null;
  availableLenses: Lens[];
  cameraMode: CameraMode;
  capturedMediaUrls: string[];
}

interface CameraActions {
  setActiveLensId: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  addCapturedMediaUrl: (url: string) => void;
  clearCapturedMediaUrls: () => void;
}

type CameraStore = CameraState & CameraActions;

export const useCameraStore = create<CameraStore>((set) => ({
  // Initial state
  activeLensId: null,
  availableLenses: [
    { id: "dog-ears", name: "Dog Ears", effect: "sepia(0.3) saturate(1.2)" },
    { id: "smooth-skin", name: "Smooth Skin", effect: "contrast(0.9) brightness(1.05)" },
    { id: "neon-glow", name: "Neon Glow", effect: "hue-rotate(90deg) saturate(2)" },
  ],
  cameraMode: "NORMAL",
  capturedMediaUrls: [],

  // Actions
  setActiveLensId: (activeLensId) => set({ activeLensId }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  addCapturedMediaUrl: (url) =>
    set((state) => ({
      capturedMediaUrls: [...state.capturedMediaUrls, url],
    })),
  clearCapturedMediaUrls: () => set({ capturedMediaUrls: [] }),
}));
