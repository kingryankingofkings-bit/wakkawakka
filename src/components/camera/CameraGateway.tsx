"use client";

import dynamic from "next/dynamic";

const CameraCapture = dynamic(() => import("./CameraCapture"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Initializing camera...</span>
      </div>
    </div>
  ),
});

export default function CameraGateway({ ssrMobile = false }: { ssrMobile?: boolean }) {
  return <CameraCapture />;
}
