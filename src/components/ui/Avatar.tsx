"use client";

import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  hasStory?: boolean;
  storyViewed?: boolean;
  isOnline?: boolean;
}

const sizeMap = {
  xs: {
    container: "h-6 w-6",
    text: "text-xs",
    ring: "ring-[1.5px] ring-offset-[1.5px]",
    online: "h-1.5 w-1.5",
  },
  sm: {
    container: "h-8 w-8",
    text: "text-xs",
    ring: "ring-2 ring-offset-2",
    online: "h-2 w-2",
  },
  md: {
    container: "h-10 w-10",
    text: "text-sm",
    ring: "ring-2 ring-offset-2",
    online: "h-2.5 w-2.5",
  },
  lg: {
    container: "h-14 w-14",
    text: "text-base",
    ring: "ring-[2.5px] ring-offset-2",
    online: "h-3 w-3",
  },
  xl: {
    container: "h-20 w-20",
    text: "text-xl",
    ring: "ring-[3px] ring-offset-2",
    online: "h-3.5 w-3.5",
  },
  "2xl": {
    container: "h-24 w-24",
    text: "text-2xl",
    ring: "ring-[3px] ring-offset-2",
    online: "h-4 w-4",
  },
};

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  hasStory,
  storyViewed,
  isOnline,
}: AvatarProps) {
  const s = sizeMap[size];

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-muted flex-shrink-0",
          s.container,
          hasStory && [
            s.ring,
            storyViewed ? "ring-muted-foreground/40" : "ring-transparent",
          ],
          hasStory && !storyViewed && "story-ring-animated",
          className,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt || name || "Avatar"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
            <span className={s.text}>{name ? getInitials(name) : "?"}</span>
          </div>
        )}
      </div>
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-background",
            s.online,
          )}
        />
      )}
    </div>
  );
}
