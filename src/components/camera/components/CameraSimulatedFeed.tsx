import { RotateCw } from "lucide-react";

interface CameraSimulatedFeedProps {
  setHasCameraPermission: (val: boolean) => void;
}

export function CameraSimulatedFeed({ setHasCameraPermission }: CameraSimulatedFeedProps) {
  return (
    <div className="p-6 text-center max-w-sm flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4 animate-pulse">
        <RotateCw className="h-8 w-8" />
      </div>
      <p className="font-semibold text-lg mb-2">Simulated Camera Feed</p>
      <p className="text-sm text-neutral-400 mb-6">
        Hardware camera permissions are unavailable. We will simulate a camera capture with high-fidelity random visual generation.
      </p>
      <button 
        onClick={() => setHasCameraPermission(true)}
        className="px-6 py-2.5 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition active:scale-95"
      >
        Use Real-time Mock Capture
      </button>
    </div>
  );
}
