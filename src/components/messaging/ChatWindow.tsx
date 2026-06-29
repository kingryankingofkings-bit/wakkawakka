'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Send,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { CURRENT_USER } from '@/lib/mockData';
import { useMessageStore } from '@/store/messageStore';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import type { Message, Conversation } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMOJI_LIST = [
  '😀','😂','😍','🥰','😎','😢','😡','🤔','👍','👎',
  '❤️','🔥','✨','🎉','💯','🙌','👏','🤣','😅','😊',
  '😇','🤩','😋','😜','🤗','😴','🥳','😤','🙄','😏',
];

// ---------------------------------------------------------------------------
// Helper: Group messages by calendar date
// ---------------------------------------------------------------------------

function groupMessagesByDate(messages: Message[]): Array<{ dateLabel: string; msgs: Message[] }> {
  const groups: Array<{ dateLabel: string; msgs: Message[] }> = [];
  let currentLabel = '';

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ dateLabel: label, msgs: [] });
    }
    groups[groups.length - 1].msgs.push(msg);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <div className="h-7 w-7 rounded-full bg-muted flex-shrink-0" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card border border-border px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group avatar helper
// ---------------------------------------------------------------------------

function ConversationAvatar({ conversation }: { conversation: Conversation }) {
  if (!conversation.isGroup) {
    const other = conversation.members.find((m) => m.id !== CURRENT_USER.id);
    return (
      <div className="relative h-9 w-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
        {other?.avatar ? (
          <Image src={other.avatar} alt={other.displayName} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
            {other?.displayName[0] ?? '?'}
          </span>
        )}
      </div>
    );
  }

  const members = conversation.members.slice(0, 4);
  return (
    <div className="relative h-9 w-9 grid grid-cols-2 gap-px rounded-full overflow-hidden flex-shrink-0 bg-muted">
      {members.map((m) => (
        <div key={m.id} className="relative overflow-hidden bg-muted">
          {m.avatar ? (
            <Image src={m.avatar} alt={m.displayName} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[8px] font-semibold">
              {m.displayName[0]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emoji Picker
// ---------------------------------------------------------------------------

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-xl border border-border bg-popover shadow-lg p-3"
    >
      <div className="grid grid-cols-10 gap-1">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="h-8 w-8 flex items-center justify-center text-lg rounded-md hover:bg-muted transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatWindow
// ---------------------------------------------------------------------------

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { socket } = useSocket();

  const conversations = useMessageStore((s) => s.conversations);
  const messagesMap = useMessageStore((s) => s.messages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const markConversationRead = useMessageStore((s) => s.markConversationRead);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = messagesMap[conversationId] ?? [];

  const [inputValue, setInputValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTypingRemote, setIsTypingRemote] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync store messages into local state
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Mark as read on open
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTypingRemote]);

  // Socket typing events
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setIsTypingRemote(true);
      }
    };

    const handleStopTyping = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setIsTypingRemote(false);
      }
    };

    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket, conversationId]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';

    // Emit typing
    if (socket) {
      socket.emit('typing', { conversationId, userId: CURRENT_USER.id });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('stop-typing', { conversationId, userId: CURRENT_USER.id });
      }, 2000);
    }
  };

  const sendMessage = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      conversationId,
      sender: CURRENT_USER,
      senderId: CURRENT_USER.id,
      content,
      isRead: false,
      isDeleted: false,
      replyTo: replyTo ?? undefined,
      createdAt: new Date().toISOString(),
    };

    addMessage(newMsg);
    setLocalMessages((prev) => [...prev, newMsg]);
    setInputValue('');
    setReplyTo(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Emit via socket
    if (socket) {
      socket.emit('send-message', newMsg);
      socket.emit('stop-typing', { conversationId, userId: CURRENT_USER.id });
    }
  }, [inputValue, conversationId, replyTo, addMessage, socket]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaType: Message['mediaType'] = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'file';

    const url = URL.createObjectURL(file);
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      conversationId,
      sender: CURRENT_USER,
      senderId: CURRENT_USER.id,
      content: '',
      mediaUrl: url,
      mediaType,
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    addMessage(newMsg);
    setLocalMessages((prev) => [...prev, newMsg]);
    e.target.value = '';
  };

  const handleDeleteMessage = (id: string) => {
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isDeleted: true } : m))
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Conversation not found.
      </div>
    );
  }

  const otherUser = !conversation.isGroup
    ? conversation.members.find((m) => m.id !== CURRENT_USER.id)
    : null;

  const displayName = conversation.isGroup
    ? (conversation.name ?? 'Group')
    : (otherUser?.displayName ?? 'Unknown');

  const dateGroups = groupMessagesByDate(localMessages);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/60 backdrop-blur-sm flex-shrink-0">
        <Link
          href="/messages"
          className="md:hidden rounded-full p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <ConversationAvatar conversation={conversation} />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          {!conversation.isGroup && otherUser && (
            <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
          )}
          {conversation.isGroup && (
            <p className="text-xs text-muted-foreground">
              {conversation.members.length} members
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Phone className="h-5 w-5" />
          </button>
          <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Video className="h-5 w-5" />
          </button>
          <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Messages list ── */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {dateGroups.map(({ dateLabel, msgs }) => (
          <div key={dateLabel}>
            {/* Date divider */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-2">{dateLabel}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {msgs.map((msg, idx) => {
              const isOwn = msg.senderId === CURRENT_USER.id;
              const nextMsg = msgs[idx + 1];
              const isLastInSequence =
                !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={isLastInSequence}
                  isGroup={conversation.isGroup}
                  onReply={setReplyTo}
                  onReact={(m) => {
                    setLocalMessages(prev => prev.map(msg => {
                      if (msg.id === m.id) {
                        const newReactions = { ...(msg.reactions || {}) };
                        newReactions['❤️'] = (newReactions['❤️'] || 0) + 1;
                        return { ...msg, reactions: newReactions };
                      }
                      return msg;
                    }));
                  }}
                  onCopy={handleCopy}
                  onDelete={handleDeleteMessage}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTypingRemote && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Reply banner ── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border px-4 py-2 bg-muted/30 flex items-center gap-2 overflow-hidden"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">{replyTo.sender.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
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
                    setInputValue((v) => v + emoji);
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
            onChange={handleFileAttach}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            className="flex-1 resize-none bg-muted/50 border border-input rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all placeholder:text-muted-foreground overflow-hidden min-h-[40px]"
            style={{ maxHeight: 140 }}
          />

          {/* Send button */}
          <motion.button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'rounded-full p-2.5 transition-colors flex-shrink-0',
              inputValue.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
