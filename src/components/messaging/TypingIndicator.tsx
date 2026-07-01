"use client";

import React from "react";
import { motion } from "framer-motion";

export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <div className="flex items-center gap-2 rounded-2xl bg-card border border-border px-3 py-1.5 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary block"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}
