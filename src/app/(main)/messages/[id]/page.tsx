"use client";

import { useParams } from "next/navigation";
import { useMessageStore } from "@/store/messageStore";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const conversations = useMessageStore((s) => s.conversations);
  const conv = conversations.find((c) => c.id === id);

  if (!conv) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
        <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="font-semibold">Conversation not found</p>
        <Link
          href="/messages"
          className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to messages
        </Link>
      </div>
    );
  }

  return <ChatWindow conversationId={conv.id} />;
}
