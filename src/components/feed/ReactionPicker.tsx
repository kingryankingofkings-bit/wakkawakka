'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionType } from '@/types';
import { REACTION_EMOJIS } from '@/lib/utils';

interface ReactionPickerProps {
  isVisible: boolean;
  onReact: (type: ReactionType) => void;
  currentReaction?: ReactionType;
}

const REACTION_LABELS: Record<ReactionType, string> = {
  LIKE: 'Like',
  LOVE: 'Love',
  HAHA: 'Haha',
  WOW: 'Wow',
  SAD: 'Sad',
  ANGRY: 'Angry',
};

const REACTION_COLORS: Record<ReactionType, string> = {
  LIKE: '#3b82f6',
  LOVE: '#ef4444',
  HAHA: '#f59e0b',
  WOW: '#8b5cf6',
  SAD: '#60a5fa',
  ANGRY: '#f97316',
};

const reactions: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

export function ReactionPicker({ isVisible, onReact, currentReaction }: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg"
          onMouseLeave={(e) => e.stopPropagation()}
        >
          {reactions.map((reaction, index) => (
            <motion.button
              key={reaction}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
              whileHover={{ scale: 1.4, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReact(reaction)}
              className="relative group flex flex-col items-center"
              title={REACTION_LABELS[reaction]}
            >
              <span
                className="text-2xl leading-none cursor-pointer select-none"
                style={{
                  filter: currentReaction === reaction ? 'drop-shadow(0 0 4px currentColor)' : 'none',
                }}
              >
                {REACTION_EMOJIS[reaction]}
              </span>
              {/* Label tooltip */}
              <motion.span
                initial={{ opacity: 0, y: 2 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-white bg-gray-800 rounded px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: REACTION_COLORS[reaction] }}
              >
                {REACTION_LABELS[reaction]}
              </motion.span>
              {/* Active indicator dot */}
              {currentReaction === reaction && (
                <motion.div
                  layoutId="active-reaction-dot"
                  className="absolute -bottom-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: REACTION_COLORS[reaction] }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
