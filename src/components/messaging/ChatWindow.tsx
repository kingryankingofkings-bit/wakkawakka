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
  Sliders,
  Mic,
  Lock,
  Unlock,
  Search,
  Shield,
  Plus,
  Play,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { CURRENT_USER } from '@/lib/mockData';
import { useMessageStore } from '@/store/messageStore';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import type { Message, Conversation } from '@/types';
import toast from 'react-hot-toast';

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

function TypingIndicator({ label }: { label: string }) {
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
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group avatar helper
// ---------------------------------------------------------------------------

function ConversationAvatar({ conversation, onlineUsers }: { conversation: Conversation; onlineUsers: Set<string> }) {
  if (!conversation.isGroup) {
    const other = conversation.members.find((m) => m.id !== CURRENT_USER.id);
    const isOnline = other?.id ? onlineUsers.has(other.id) : false;
    return (
      <div className="relative h-9 w-9 rounded-full bg-muted flex-shrink-0">
        <div className="relative h-full w-full rounded-full overflow-hidden">
          {other?.avatar ? (
            <Image src={other.avatar} alt={other.displayName} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
              {other?.displayName[0] ?? '?'}
            </span>
          )}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
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
  const { socket, onlineUsers } = useSocket();

  const conversations = useMessageStore((s) => s.conversations);
  const messagesMap = useMessageStore((s) => s.messages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const markConversationRead = useMessageStore((s) => s.markConversationRead);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = messagesMap[conversationId] ?? [];

  const [inputValue, setInputValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);

  // In-Chat Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // E2EE Toggle state
  const [e2eeEnabled, setE2eeEnabled] = useState(false);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details');
  const [searchAddMemberQuery, setSearchAddMemberQuery] = useState('');
  const [searchAddMemberResults, setSearchAddMemberResults] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync store messages into local state
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Sync conversation messages from DB
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}/messages`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            useMessageStore.setState((state) => ({
              messages: {
                ...state.messages,
                [conversationId]: json.data,
              },
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    }
    fetchMessages();
  }, [conversationId]);

  // Join / Leave socket room
  useEffect(() => {
    if (!socket) return;
    socket.emit('join-conversation', conversationId);
    return () => {
      socket.emit('leave-conversation', conversationId);
    };
  }, [socket, conversationId]);

  // Mark as read on open
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, typingUsers]);

  // Socket typing events
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== CURRENT_USER.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
      }
    };

    const handleStopTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
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

  const encryptText = (text: string) => {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return `[E2EE-AES-GCM]:${encoded}`;
  };

  const sendMessage = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;

    const contentToSend = e2eeEnabled ? encryptText(content) : content;

    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentToSend,
          replyToId: replyTo?.id || null,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const newMsg = json.data;

        addMessage(newMsg);
        setLocalMessages((prev) => [...prev, newMsg]);
        setInputValue('');
        setReplyTo(null);

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        // Emit via socket
        if (socket) {
          socket.emit('send-message', {
            conversationId,
            message: newMsg,
          });
          socket.emit('stop-typing', { conversationId, userId: CURRENT_USER.id });
        }
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    }
  }, [inputValue, conversationId, replyTo, addMessage, socket, e2eeEnabled]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const sendVoiceMessage = useCallback(async (audioUrl: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '',
          mediaUrl: audioUrl,
          mediaType: 'audio',
          type: 'VOICE',
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const newMsg = json.data;

        addMessage(newMsg);
        setLocalMessages((prev) => [...prev, newMsg]);

        if (socket) {
          socket.emit('send-message', {
            conversationId,
            message: newMsg,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [conversationId, addMessage, socket]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.webm');

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              sendVoiceMessage(data.url);
              toast.success('Voice message sent');
            }
          } else {
            toast.error('Failed to upload voice message');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to upload voice message');
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (err) {
      console.error(err);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaType: Message['mediaType'] = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'file';

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Uploading file...', { id: 'upload' });
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: '',
              mediaUrl: data.url,
              mediaType,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const newMsg = json.data;
            addMessage(newMsg);
            setLocalMessages((prev) => [...prev, newMsg]);

            if (socket) {
              socket.emit('send-message', {
                conversationId,
                message: newMsg,
              });
            }
            toast.success('File sent successfully', { id: 'upload' });
          } else {
            toast.error('Failed to send file', { id: 'upload' });
          }
        }
      } else {
        toast.error('Failed to upload file', { id: 'upload' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading file', { id: 'upload' });
    }
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

  const handleSearchMembers = useCallback(async (q: string) => {
    setSearchAddMemberQuery(q);
    if (!q.trim()) {
      setSearchAddMemberResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.users) {
          const memberIds = new Set(conversation?.members.map((m) => m.id) || []);
          const filtered = json.data.users.filter((u: any) => !memberIds.has(u.id));
          setSearchAddMemberResults(filtered);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [conversation?.members]);

  const handleAddMember = useCallback(async (targetUserId: string) => {
    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [targetUserId],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        toast.success('Member added successfully');
        useMessageStore.setState((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, members: json.members } : c
          ),
        }));
        setSearchAddMemberResults((prev) => prev.filter((u) => u.id !== targetUserId));
      } else {
        toast.error('Failed to add member');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding member');
    } finally {
      setIsAddingMember(false);
    }
  }, [conversationId]);

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

  const getTypingLabel = () => {
    const typingList = Array.from(typingUsers)
      .map((uid) => conversation.members.find((m) => m.id === uid))
      .filter(Boolean);

    if (typingList.length === 0) return '';
    if (typingList.length === 1) return `${typingList[0]!.displayName} is typing...`;
    if (typingList.length === 2) return `${typingList[0]!.displayName} and ${typingList[1]!.displayName} are typing...`;
    return 'Several people are typing...';
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      <div className="flex-1 min-w-0 flex flex-col h-full bg-background">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/60 backdrop-blur-sm flex-shrink-0">
          <Link
            href="/messages"
            className="md:hidden rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <ConversationAvatar conversation={conversation} onlineUsers={onlineUsers} />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            {!conversation.isGroup && otherUser && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                @{otherUser.username}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-border" />
                <span className="font-medium text-[10px]">
                  {onlineUsers.has(otherUser.id) ? 'Online' : 'Offline'}
                </span>
              </p>
            )}
            {conversation.isGroup && (
              <p className="text-xs text-muted-foreground">
                {conversation.members.length} members
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'rounded-full p-2 transition-colors',
                showSearch ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title="Search messages"
            >
              <Search className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Phone className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Video className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={cn(
                'rounded-full p-2 transition-colors',
                showSidebar ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title="Chat Info"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Search Bar ── */}
        {showSearch && (
          <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center gap-2 flex-shrink-0">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search messages in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-muted rounded-full">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

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
                    searchQuery={searchQuery}
                    onReact={(m) => {
                      setLocalMessages((prev) =>
                        prev.map((msg) => {
                          if (msg.id === m.id) {
                            const newReactions = { ...(msg.reactions || {}) };
                            newReactions['❤️'] = (newReactions['❤️'] || 0) + 1;
                            return { ...msg, reactions: newReactions };
                          }
                          return msg;
                        })
                      );
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
            {typingUsers.size > 0 && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <TypingIndicator label={getTypingLabel()} />
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
            {/* E2EE Lock/Unlock toggle */}
            <button
              type="button"
              onClick={() => setE2eeEnabled((v) => !v)}
              className={cn(
                'rounded-full p-2 transition-colors flex-shrink-0',
                e2eeEnabled ? 'text-green-500 bg-green-500/10 hover:bg-green-500/20' : 'text-muted-foreground hover:bg-muted'
              )}
              title={e2eeEnabled ? 'E2EE Encryption Enabled (AES-GCM)' : 'Enable E2EE Encryption'}
            >
              {e2eeEnabled ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
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

            {/* Mic / Send Button */}
            {inputValue.trim() || isRecording ? (
              isRecording ? (
                <motion.button
                  onClick={stopRecording}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-full p-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors flex-shrink-0 animate-pulse"
                >
                  <Mic className="h-4 w-4" />
                </motion.button>
              ) : (
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
              )
            ) : (
              <motion.button
                onClick={startRecording}
                whileTap={{ scale: 0.9 }}
                className="rounded-full p-2.5 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors flex-shrink-0"
              >
                <Mic className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sliding Info Sidebar ── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full border-l border-border bg-card flex flex-col flex-shrink-0 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-sm">Details</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-border bg-muted/20 flex-shrink-0">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold border-b-2 transition-all',
                  activeTab === 'details' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold border-b-2 transition-all',
                  activeTab === 'media' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Shared Media
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'details' ? (
                <>
                  {/* Group details */}
                  <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-border/50">
                    <ConversationAvatar conversation={conversation} onlineUsers={onlineUsers} />
                    <div>
                      <p className="font-bold text-base">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Created on {new Date(conversation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Members ({conversation.members.length})
                    </p>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {conversation.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <div className="relative h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {member.avatar ? (
                              <Image src={member.avatar} alt={member.displayName} fill className="object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                                {member.displayName[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{member.displayName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">@{member.username}</p>
                          </div>
                          {conversation.isGroup && conversation.admins?.some((a) => a.id === member.id) && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Member widget (Group only) */}
                  {conversation.isGroup && (
                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Add Member
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search by username..."
                          value={searchAddMemberQuery}
                          onChange={(e) => handleSearchMembers(e.target.value)}
                          className="flex-1 bg-muted/50 border border-input rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {searchAddMemberResults.length > 0 && (
                        <div className="border border-border rounded-lg bg-muted/10 divide-y divide-border max-h-32 overflow-y-auto">
                          {searchAddMemberResults.map((u) => (
                            <div key={u.id} className="p-2 flex items-center justify-between gap-2 text-xs">
                              <span className="truncate flex-1 font-medium">{u.displayName} (@{u.username})</span>
                              <button
                                onClick={() => handleAddMember(u.id)}
                                disabled={isAddingMember}
                                className="p-1 bg-primary text-primary-foreground hover:bg-primary/95 rounded flex items-center justify-center flex-shrink-0"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Media Gallery tab */
                <div>
                  {(() => {
                    const mediaMsgs = messages.filter((m) => m.mediaUrl && !m.isDeleted);
                    if (mediaMsgs.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No shared media found
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {mediaMsgs.map((m) => {
                          const isVoice = m.type === 'VOICE' || m.mediaType === 'audio';
                          const isVideo = m.mediaType === 'video';

                          if (isVoice) {
                            return (
                              <div
                                key={m.id}
                                className="col-span-3 p-2 bg-muted/40 rounded-lg flex items-center gap-2 border border-border/50"
                              >
                                <Mic className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-[10px] truncate flex-1 font-medium">Voice Note</span>
                                <span className="text-[8px] text-muted-foreground flex-shrink-0">
                                  {new Date(m.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            );
                          }

                          if (isVideo) {
                            return (
                              <div
                                key={m.id}
                                className="relative aspect-square rounded-lg overflow-hidden bg-black flex items-center justify-center group cursor-pointer"
                                onClick={() => window.open(m.mediaUrl, '_blank')}
                              >
                                <video src={m.mediaUrl} className="object-cover w-full h-full opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                  <Play className="h-5 w-5 text-white fill-current" />
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={m.id}
                              className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(m.mediaUrl, '_blank')}
                            >
                              <Image src={m.mediaUrl!} alt="" fill className="object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
