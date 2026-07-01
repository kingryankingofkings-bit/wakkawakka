import { MapPin } from "lucide-react";
import React from "react";
import { CameraMode } from "@/store/cameraStore";

interface CameraPreviewProps {
  hasCameraPermission: boolean | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  pipVideoRef: React.RefObject<HTMLVideoElement>;
  filterStyle: string;
  cameraMode: CameraMode;
  showGeofilter: boolean;
  userLocation: { latitude: number; longitude: number } | null;
}

export function CameraPreview({
  hasCameraPermission,
  videoRef,
  pipVideoRef,
  filterStyle,
  cameraMode,
  showGeofilter,
  userLocation,
}: CameraPreviewProps) {
  return (
    <>
      {/* Actual Video Tag or Loading */}
      {hasCameraPermission === true ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ filter: filterStyle }}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Requesting camera access...</p>
        </div>
      )}

      {/* Dual Camera PIP Container */}
      {cameraMode === "BE_REAL" && (
        <div className="absolute top-4 left-4 w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-neutral-900 z-10 animate-fade-in touch-none">
          {hasCameraPermission === true ? (
            <video
              ref={pipVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <span className="text-[10px] text-neutral-400">Selfie Feed</span>
            </div>
          )}
        </div>
      )}

      {/* Geofilter Overlay */}
      {showGeofilter && (
        <div className="absolute top-20 left-0 right-0 pointer-events-none flex flex-col items-center text-center select-none z-10 drop-shadow-md">
          <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center gap-1.5 animate-pulse">
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
    </>
  );
}
