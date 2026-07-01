"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const EMOJI_LIST = [
  "😀", "😂", "😍", "🥰", "😎", "😢", "😡", "🤔", "👍", "👎",
  "❤️", "🔥", "✨", "🎉", "💯", "🙌", "👏", "🤣", "😅", "😊",
  "😇", "🤩", "😋", "😜", "🤗", "😴", "🥳", "😤", "🙄", "😏",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="absolute bottom-12 left-0 bg-popover border border-border rounded-xl shadow-xl p-2 grid grid-cols-6 gap-1 w-52 z-50"
    >
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-lg hover:bg-muted rounded-md p-1 transition-colors"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}
