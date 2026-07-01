import { Sparkles } from "lucide-react";
import { CameraMode } from "@/store/cameraStore";

interface Lens {
  id: string;
  name: string;
  effect: string;
}

interface CameraBottomControlsProps {
  availableLenses: Lens[];
  activeLensId: string | null;
  cameraMode: CameraMode;
  setActiveLensId: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  handleCapture: () => void;
}

export function CameraBottomControls({
  availableLenses,
  activeLensId,
  cameraMode,
  setActiveLensId,
  setCameraMode,
  handleCapture,
}: CameraBottomControlsProps) {
  return (
    <>
      {/* AR Lens selector carousel */}
      <div className="w-full flex justify-center py-1">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-6 max-w-full">
          <button
            onClick={() => setActiveLensId(null)}
            className={`w-12 h-12 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all ${
              activeLensId === null
                ? "border-primary bg-primary/20 scale-110"
                : "border-white/20 bg-neutral-900/60 text-neutral-300"
            }`}
          >
            Normal
          </button>

          {availableLenses.map((lens) => (
            <button
              key={lens.id}
              onClick={() => setActiveLensId(lens.id)}
              className={`w-12 h-12 rounded-full border-2 flex-shrink-0 flex flex-col items-center justify-center text-[10px] font-bold leading-none p-1 transition-all ${
                activeLensId === lens.id
                  ? "border-primary bg-primary/20 scale-110 text-white"
                  : "border-white/20 bg-neutral-900/60 text-neutral-400"
              }`}
            >
              <Sparkles className="h-3 w-3 mb-0.5 text-yellow-400" />
              <span className="text-[8px] text-center truncate w-full">{lens.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shutter capture button */}
      <div className="flex items-center justify-center gap-8 py-2">
        <div className="w-10 h-10" />

        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform relative group"
        >
          <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform" />
        </button>

        <div className="w-10 h-10" />
      </div>

      {/* Mode toggles */}
      <div className="flex justify-center border-t border-white/10 w-full pt-4">
        <div className="flex items-center gap-6 text-xs font-semibold tracking-wider text-neutral-400">
          {(["NORMAL", "BE_REAL", "DISAPPEARING"] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              className={`pb-1 transition-all uppercase ${
                cameraMode === mode
                  ? "text-primary border-b-2 border-primary"
                  : "hover:text-white"
              }`}
            >
              {mode.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
