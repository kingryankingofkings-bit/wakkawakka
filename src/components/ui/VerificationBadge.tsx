"use client";

import { VerificationTier } from "@/types";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationBadge({
  tier,
  size = "md",
  className,
}: VerificationBadgeProps) {
  if (tier === "NONE") return null;

  const sizeClasses: Record<string, string> = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (tier === "BLUE") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          sizeClasses[size],
          className,
        )}
        title="Verified"
        aria-label="Verified"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
          <path
            d="M9.5 16.5L5.5 12.5L6.91 11.09L9.5 13.67L17.09 6.08L18.5 7.5L9.5 16.5Z"
            fill="white"
          />
        </svg>
      </span>
    );
  }

  if (tier === "GOLD") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          sizeClasses[size],
          className,
        )}
        title="Gold Verified"
        aria-label="Gold Verified"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <circle cx="12" cy="12" r="12" fill="#F59E0B" />
          <path
            d="M12 4L13.854 9.279H19.416L14.949 12.416L16.803 17.695L12 14.279L7.197 17.695L9.051 12.416L4.584 9.279H10.146L12 4Z"
            fill="white"
          />
        </svg>
      </span>
    );
  }

  if (tier === "GOVERNMENT") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          sizeClasses[size],
          className,
        )}
        title="Government / Official Account"
        aria-label="Official Government Account"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <circle cx="12" cy="12" r="12" fill="#6B7280" />
          <rect x="4" y="15.5" width="16" height="1.5" rx="0.4" fill="white" />
          <rect x="4" y="17.5" width="16" height="1.5" rx="0.4" fill="white" />
          <path d="M12 5.5L19.5 10.5H4.5L12 5.5Z" fill="white" />
          <rect x="6.5" y="10.5" width="1.5" height="5" fill="white" />
          <rect x="11.25" y="10.5" width="1.5" height="5" fill="white" />
          <rect x="16" y="10.5" width="1.5" height="5" fill="white" />
        </svg>
      </span>
    );
  }

  return null;
}
