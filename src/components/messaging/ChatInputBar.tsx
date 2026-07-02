"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Paperclip,
  Send,
  X,
  Lock,
  Unlock,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import type { Message } from "@/types";

interface ChatInputBarProps {
  inputValue: string;
  onInputChange: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAppendText: (_text: string) => void;
  onKeyDown: (_e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onFileAttach: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  e2eeEnabled: boolean;
  onToggleE2ee: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function ChatInputBar({
  inputValue,
  onInputChange,
  onAppendText,
  onKeyDown,
  onSend,
  onFileAttach,
  replyTo,
  onCancelReply,
  e2eeEnabled,
  onToggleE2ee,
  isRecording,
  onStartRecording,
  onStopRecording,
}: ChatInputBarProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* ── Reply banner ── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border px-4 py-2 bg-muted/30 flex items-center gap-2 overflow-hidden"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">
                {replyTo.sender.displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyTo.content}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ── */}
      <div className="border-t border-border px-3 py-3 bg-card/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-end gap-2">
          {/* E2EE toggle */}
          <button
            type="button"
            onClick={onToggleE2ee}
            className={cn(
              "rounded-full p-2 transition-colors flex-shrink-0",
              e2eeEnabled
                ? "text-green-500 bg-green-500/10 hover:bg-green-500/20"
                : "text-muted-foreground hover:bg-muted",
            )}
            title={
              e2eeEnabled
                ? "E2EE Encryption Enabled (AES-GCM)"
                : "Enable E2EE Encryption"
            }
          >
            {e2eeEnabled ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Unlock className="h-5 w-5" />
            )}
          </button>

          {/* Emoji button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground"
            >
              <Smile className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker
                  onSelect={(emoji) => {
                    onAppendText(emoji);
                    textareaRef.current?.focus();
                  }}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* File attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/*"
            className="hidden"
            onChange={onFileAttach}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Message…"
            rows={1}
            className="flex-1 resize-none bg-muted/50 border border-input rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all placeholder:text-muted-foreground overflow-hidden min-h-[40px]"
            style={{ maxHeight: 140 }}
          />

          {/* Screen-reader only recording status */}
          <div className="sr-only" aria-live="polite" role="status">
            {isRecording ? "Voice recording in progress" : "Voice recording stopped"}
          </div>

          {/* Mic / Send Button */}
          {inputValue.trim() || isRecording ? (
            isRecording ? (
              <motion.button
                type="button"
                onClick={onStopRecording}
                whileTap={{ scale: 0.95 }}
                aria-label="Stop recording voice message"
                aria-pressed="true"
                className="rounded-full p-3 bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex-shrink-0 w-11 h-11 flex items-center justify-center animate-pulse"
              >
                <Mic className="h-5 w-5" aria-hidden="true" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={onSend}
                disabled={!inputValue.trim()}
                whileTap={{ scale: 0.95 }}
                aria-label="Send message"
                className={cn(
                  "rounded-full p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0 w-11 h-11 flex items-center justify-center",
                  inputValue.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                <Send className="h-5 w-5" aria-hidden="true" />
              </motion.button>
            )
          ) : (
            <motion.button
              type="button"
              onClick={onStartRecording}
              whileTap={{ scale: 0.95 }}
              aria-label="Start recording voice message"
              aria-pressed="false"
              className="rounded-full p-3 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex-shrink-0 w-11 h-11 flex items-center justify-center"
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          )}
        </div>
      </div>
    </>
  );
}
