"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function SponsoredAd({ placement }: { placement?: string }) {
  const [ad, setAd] = useState<any>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    const userId = useAuthStore.getState().activeProfile?.id;
    const headers: Record<string, string> = {};
    if (userId) headers["x-user-id"] = userId;
    if (placement) headers["x-ad-placement"] = placement;

    fetch("/api/ads/serve", {
      headers,
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setAd(json.data);
        }
      })
      .catch((err) => console.error("Failed to load ad", err));
  }, [placement]);

  useEffect(() => {
    if (ad && !hasTrackedImpression) {
      setHasTrackedImpression(true);
      fetch(`/api/ads/${ad.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "impression" }),
      }).catch((err) => console.error("Failed to track ad impression", err));
    }
  }, [ad, hasTrackedImpression]);

  const handleClick = () => {
    if (ad) {
      fetch(`/api/ads/${ad.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "click" }),
      }).catch((err) => console.error("Failed to track ad click", err));
    }
  };

  if (!ad) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-2xl p-4 my-2 space-y-3 shadow-sm relative overflow-hidden">
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
        Sponsored
      </div>
      <div className="flex gap-4">
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-20 h-20 rounded-xl object-cover bg-muted shrink-0"
          />
        )}
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-foreground">{ad.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {ad.copy}
          </p>
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="inline-block text-xs font-semibold text-primary hover:underline pt-1"
          >
            Learn More →
          </a>
        </div>
      </div>
    </div>
  );
}
