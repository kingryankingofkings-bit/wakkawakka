import { MapPin } from "lucide-react";
import { CameraMode } from "@/store/cameraStore";

interface CapturedMediaPreviewProps {
  capturedImage: string;
  capturedPipImage: string | null;
  cameraMode: CameraMode;
  showGeofilter: boolean;
  userLocation: { latitude: number; longitude: number } | null;
}

export function CapturedMediaPreview({
  capturedImage,
  capturedPipImage,
  cameraMode,
  showGeofilter,
  userLocation,
}: CapturedMediaPreviewProps) {
  return (
    <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-20">
      <img 
        src={capturedImage} 
        alt="Captured" 
        className="w-full h-full object-cover" 
      />

      {/* PIP Image Overlaid for DailySnap preview */}
      {cameraMode === "BE_REAL" && capturedPipImage && (
        <div className="absolute top-4 left-4 w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-neutral-900 z-30">
          <img 
            src={capturedPipImage} 
            alt="Selfie" 
            className="w-full h-full object-cover" 
          />
        </div>
      )}

      {/* Geofilter overlay on preview */}
      {showGeofilter && (
        <div className="absolute top-20 left-0 right-0 pointer-events-none flex flex-col items-center text-center select-none z-30 drop-shadow-md">
          <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {userLocation ? "San Francisco, CA" : "Silicon Valley"}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-4xl mt-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 bg-clip-text text-transparent italic tracking-tight uppercase leading-none font-serif">
            WAKKA LIFE
          </h1>
        </div>
      )}
    </div>
  );
}
