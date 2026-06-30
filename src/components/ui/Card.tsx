"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function Card({
  children,
  className,
  hover,
  padding = "md",
  onClick,
}: CardProps) {
  const paddings = { none: "", sm: "p-3", md: "p-4", lg: "p-6" };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        hover &&
          "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        paddings[padding],
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
