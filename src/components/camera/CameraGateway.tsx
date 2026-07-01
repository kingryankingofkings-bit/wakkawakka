"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import DesktopFallback from "./DesktopFallback";

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
  // Mobile viewport query (max-width: 767px).
  // If matches, the user is on mobile.
  // If not, it means the screen was resized to desktop, so we show the fallback.
  const isMobile = useMediaQuery("(max-width: 767px)", ssrMobile);

  if (!isMobile) {
    return <DesktopFallback />;
  }

  return <CameraCapture />;
}
