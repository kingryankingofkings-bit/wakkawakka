"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CURRENT_USER } from "@/lib/mockData";
import { useMessageStore } from "@/store/messageStore";
import { useSocket } from "@/hooks/useSocket";
import { groupMessagesByDate, encryptText } from "@/lib/messageUtils";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatHeader } from "./ChatHeader";
import { ChatInputBar } from "./ChatInputBar";
import { ChatSidebar } from "./ChatSidebar";
import type { Message } from "@/types";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/apiClient";

// ---------------------------------------------------------------------------
// Main ChatWindow — orchestrates sub-components
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

  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // E2EE Toggle
  const [e2eeEnabled, setE2eeEnabled] = useState(false);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchAddMemberQuery, setSearchAddMemberQuery] = useState("");
  const [searchAddMemberResults, setSearchAddMemberResults] = useState<
    Array<{ id: string; displayName: string; username: string }>
  >([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Effects ----

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await apiFetch(
          `/api/messages/conversations/${conversationId}/messages`,
        );
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
        console.error("Failed to fetch messages", err);
      }
    }
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join-conversation", conversationId);
    return () => {
      socket.emit("leave-conversation", conversationId);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, typingUsers]);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: { conversationId: string; userId: string }) => {
      if (
        data.conversationId === conversationId &&
        data.userId !== CURRENT_USER.id
      ) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
      }
    };

    const handleStopTyping = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [socket, conversationId]);

  // ---- Handlers ----

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";

    if (socket) {
      socket.emit("typing", { conversationId, userId: CURRENT_USER.id });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit("stop-typing", { conversationId, userId: CURRENT_USER.id });
      }, 2000);
    }
  };

  const sendMessage = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;

    const contentToSend = e2eeEnabled ? encryptText(content) : content;

    try {
      const response = await apiFetch(
        `/api/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: contentToSend,
            replyToId: replyTo?.id || null,
          }),
        },
      );

      if (response.ok) {
        const json = await response.json();
        const newMsg = json.data;
        addMessage(newMsg);
        setLocalMessages((prev) => [...prev, newMsg]);
        setInputValue("");
        setReplyTo(null);

        if (socket) {
          socket.emit("send-message", { conversationId, message: newMsg });
          socket.emit("stop-typing", {
            conversationId,
            userId: CURRENT_USER.id,
          });
        }
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  }, [inputValue, conversationId, replyTo, addMessage, socket, e2eeEnabled]);

  const sendVoiceMessage = useCallback(
    async (audioUrl: string) => {
      try {
        const response = await apiFetch(
          `/api/messages/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: "",
              mediaUrl: audioUrl,
              mediaType: "audio",
              type: "VOICE",
            }),
          },
        );

        if (response.ok) {
          const json = await response.json();
          const newMsg = json.data;
          addMessage(newMsg);
          setLocalMessages((prev) => [...prev, newMsg]);

          if (socket) {
            socket.emit("send-message", { conversationId, message: newMsg });
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    [conversationId, addMessage, socket],
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");

        try {
          const response = await apiFetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              sendVoiceMessage(data.url);
              toast.success("Voice message sent");
            }
          } else {
            toast.error("Failed to upload voice message");
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to upload voice message");
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (err) {
      console.error(err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaType: Message["mediaType"] = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "file";

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.loading("Uploading file...", { id: "upload" });
      const response = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          const res = await apiFetch(
            `/api/messages/conversations/${conversationId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: "",
                mediaUrl: data.url,
                mediaType,
              }),
            },
          );
          if (res.ok) {
            const json = await res.json();
            const newMsg = json.data;
            addMessage(newMsg);
            setLocalMessages((prev) => [...prev, newMsg]);

            if (socket) {
              socket.emit("send-message", { conversationId, message: newMsg });
            }
            toast.success("File sent successfully", { id: "upload" });
          } else {
            toast.error("Failed to send file", { id: "upload" });
          }
        }
      } else {
        toast.error("Failed to upload file", { id: "upload" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file", { id: "upload" });
    }
    e.target.value = "";
  };

  const handleDeleteMessage = (id: string) => {
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isDeleted: true } : m)),
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  const handleSearchMembers = useCallback(
    async (q: string) => {
      setSearchAddMemberQuery(q);
      if (!q.trim()) {
        setSearchAddMemberResults([]);
        return;
      }
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.users) {
            const memberIds = new Set(
              conversation?.members.map((m) => m.id) || [],
            );
            const filtered = json.data.users.filter(
              (u: { id: string }) => !memberIds.has(u.id),
            );
            setSearchAddMemberResults(filtered);
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    [conversation?.members],
  );

  const handleAddMember = useCallback(
    async (targetUserId: string) => {
      setIsAddingMember(true);
      try {
        const res = await apiFetch(
          `/api/messages/conversations/${conversationId}/members`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: [targetUserId] }),
          },
        );
        if (res.ok) {
          const json = await res.json();
          toast.success("Member added successfully");
          useMessageStore.setState((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, members: json.members } : c,
            ),
          }));
          setSearchAddMemberResults((prev) =>
            prev.filter((u) => u.id !== targetUserId),
          );
        } else {
          toast.error("Failed to add member");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error adding member");
      } finally {
        setIsAddingMember(false);
      }
    },
    [conversationId],
  );

  // ---- Render ----

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
    ? (conversation.name ?? "Group")
    : (otherUser?.displayName ?? "Unknown");

  const dateGroups = groupMessagesByDate(localMessages);

  const getTypingLabel = () => {
    const typingList = Array.from(typingUsers)
      .map((uid) => conversation.members.find((m) => m.id === uid))
      .filter(Boolean);

    if (typingList.length === 0) return "";
    if (typingList.length === 1)
      return `${typingList[0]!.displayName} is typing...`;
    if (typingList.length === 2)
      return `${typingList[0]!.displayName} and ${typingList[1]!.displayName} are typing...`;
    return "Several people are typing...";
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      <div className="flex-1 min-w-0 flex flex-col h-full bg-background">
        {/* ── Header ── */}
        <ChatHeader
          conversation={conversation}
          displayName={displayName}
          otherUser={otherUser ?? null}
          onlineUsers={onlineUsers}
          showSearch={showSearch}
          onToggleSearch={() => setShowSearch(!showSearch)}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        {/* ── Messages list ── */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {dateGroups.map(({ dateLabel, msgs }) => (
            <div key={dateLabel}>
              {/* Date divider */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium px-2">
                  {dateLabel}
                </span>
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
                            newReactions["❤️"] =
                              (newReactions["❤️"] || 0) + 1;
                            return { ...msg, reactions: newReactions };
                          }
                          return msg;
                        }),
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

        {/* ── Input Bar ── */}
        <ChatInputBar
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onAppendText={(text) => setInputValue((v) => v + text)}
          onKeyDown={handleKeyDown}
          onSend={sendMessage}
          onFileAttach={handleFileAttach}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          e2eeEnabled={e2eeEnabled}
          onToggleE2ee={() => setE2eeEnabled((v) => !v)}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      </div>

      {/* ── Sliding Info Sidebar ── */}
      <AnimatePresence>
        {showSidebar && (
          <ChatSidebar
            conversation={conversation}
            displayName={displayName}
            messages={messages}
            onlineUsers={onlineUsers}
            onClose={() => setShowSidebar(false)}
            onSearchMembers={handleSearchMembers}
            searchResults={searchAddMemberResults}
            onAddMember={handleAddMember}
            isAddingMember={isAddingMember}
            searchQuery={searchAddMemberQuery}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
