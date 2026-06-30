"use client";

import { useState } from "react";
import { Copy, Check, Smartphone } from "lucide-react";

export default function DesktopFallback() {
  const [copied, setCopied] = useState(false);
  const cameraUrl = typeof window !== "undefined" ? window.location.href : "https://wakka.app/camera";

  const handleCopy = () => {
    navigator.clipboard.writeText(cameraUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="max-w-md w-full bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Switch to Mobile</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Camera and AR effects are optimized for mobile viewports. Scan the QR code or copy the link to continue on your phone.
        </p>

        {/* SVG QR Code */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
          <svg
            className="w-40 h-40 text-neutral-900"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outline QR grid mock */}
            <rect width="100" height="100" fill="none" />
            {/* Position markers */}
            <rect x="5" y="5" width="25" height="25" fill="currentColor" />
            <rect x="10" y="10" width="15" height="15" fill="white" />
            <rect x="12" y="12" width="11" height="11" fill="currentColor" />

            <rect x="70" y="5" width="25" height="25" fill="currentColor" />
            <rect x="75" y="10" width="15" height="15" fill="white" />
            <rect x="77" y="12" width="11" height="11" fill="currentColor" />

            <rect x="5" y="70" width="25" height="25" fill="currentColor" />
            <rect x="10" y="75" width="15" height="15" fill="white" />
            <rect x="12" y="77" width="11" height="11" fill="currentColor" />

            {/* Random bits */}
            <rect x="40" y="5" width="10" height="10" fill="currentColor" />
            <rect x="55" y="15" width="5" height="10" fill="currentColor" />
            <rect x="45" y="20" width="5" height="5" fill="currentColor" />
            <rect x="35" y="30" width="15" height="5" fill="currentColor" />
            <rect x="5" y="40" width="5" height="15" fill="currentColor" />
            <rect x="15" y="45" width="15" height="10" fill="currentColor" />
            <rect x="40" y="45" width="20" height="20" fill="currentColor" />
            <rect x="45" y="40" width="5" height="5" fill="currentColor" />
            <rect x="5" y="60" width="10" height="5" fill="currentColor" />
            <rect x="35" y="55" width="5" height="10" fill="currentColor" />
            <rect x="65" y="35" width="20" height="15" fill="currentColor" />
            <rect x="80" y="55" width="10" height="10" fill="currentColor" />
            <rect x="85" y="70" width="10" height="20" fill="currentColor" />
            <rect x="45" y="70" width="15" height="5" fill="currentColor" />
            <rect x="35" y="80" width="10" height="15" fill="currentColor" />
            <rect x="50" y="85" width="25" height="10" fill="currentColor" />
            <rect x="70" y="80" width="5" height="5" fill="currentColor" />
          </svg>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className="flex items-center justify-between w-full p-3 rounded-xl bg-muted/60 hover:bg-muted text-sm font-medium transition-all duration-200 border border-border/40 mb-8"
        >
          <span className="truncate text-left text-muted-foreground pr-2">
            {cameraUrl}
          </span>
          <span className="flex-shrink-0 text-primary flex items-center gap-1.5 font-semibold">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </span>
        </button>

        {/* App Store badges */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-left cursor-pointer hover:bg-neutral-800 transition">
            <span className="text-xl"></span>
            <div>
              <p className="text-[9px] uppercase text-neutral-400">Download on the</p>
              <p className="text-xs font-semibold leading-none">App Store</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-left cursor-pointer hover:bg-neutral-800 transition">
            <span className="text-sm text-emerald-400">▶</span>
            <div>
              <p className="text-[9px] uppercase text-neutral-400">Get it on</p>
              <p className="text-xs font-semibold leading-none">Google Play</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
