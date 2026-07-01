import { RotateCw, MapPin, X } from "lucide-react";

interface CameraTopControlsProps {
  capturedImage: string | null;
  hasCameraPermission: boolean | null;
  showGeofilter: boolean;
  setShowGeofilter: (fn: (prev: boolean) => boolean) => void;
  toggleCamera: () => void;
  handleDiscard: () => void;
}

export function CameraTopControls({
  capturedImage,
  hasCameraPermission,
  showGeofilter,
  setShowGeofilter,
  toggleCamera,
  handleDiscard,
}: CameraTopControlsProps) {
  return (
    <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-30 pointer-events-none">
      <div className="flex gap-2 pointer-events-auto">
        {capturedImage && (
          <button 
            onClick={handleDiscard}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/75 transition"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        {!capturedImage && (
          <>
            {hasCameraPermission && (
              <button 
                onClick={toggleCamera}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/75 transition"
                title="Flip Camera"
              >
                <RotateCw className="h-5 w-5 text-white" />
              </button>
            )}
            <button 
              onClick={() => setShowGeofilter((prev) => !prev)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition ${showGeofilter ? "bg-primary text-white" : "bg-black/50 text-white hover:bg-black/75"}`}
              title="Toggle Geofilter"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
