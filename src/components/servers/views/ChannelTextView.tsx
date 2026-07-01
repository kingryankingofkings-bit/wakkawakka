"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import { useChannel } from "@/hooks/useChannel";
import { Avatar } from "@/components/ui/Avatar";

export function ChannelTextView({ channelId }: { channelId: string }) {
  const { messages, sendMessage, typingUsers } = useChannel(channelId);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-4xl mb-2">👋</span>
            <p className="text-sm font-semibold">
              Welcome to the start of the channel!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-3 hover:bg-muted/10 p-1 rounded transition-colors group"
            >
              <Avatar
                src={msg.sender?.avatar || ""}
                className="h-10 w-10 mt-0.5"
              />
              <div className="flex-1 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground">
                    {msg.sender?.displayName || "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-xs text-muted-foreground italic">
          {typingUsers.join(", ")}{" "}
          {typingUsers.length === 1 ? "is typing..." : "are typing..."}
        </div>
      )}

      {/* Chat Input form */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-border flex items-center gap-3"
      >
        <button
          type="button"
          aria-label="Attach file"
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          placeholder="Message this channel..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="p-2 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
