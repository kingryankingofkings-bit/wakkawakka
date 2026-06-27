'use client';

import { useCallback } from 'react';
import { Message } from '@/types';
import { useMessageStore } from '@/store/messageStore';
import { CURRENT_USER } from '@/lib/mockData';
import { v4 as uuidv4 } from 'uuid';

export function useMessages(conversationId: string) {
  const { messages, addMessage, markConversationRead } = useMessageStore();
  const conversationMessages = messages[conversationId] || [];

  const sendMessage = useCallback(async (content: string, mediaUrl?: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      conversationId,
      sender: CURRENT_USER,
      senderId: CURRENT_USER.id,
      content,
      mediaUrl,
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
    addMessage(newMessage);
    // Simulate reply after delay
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const replies = [
          'That sounds great!', 'Totally agree 👍', 'Let me check and get back to you',
          '❤️', 'Haha yes!', 'On it!', 'Perfect timing!',
        ];
        const replyMsg: Message = {
          id: uuidv4(),
          conversationId,
          sender: CURRENT_USER,
          senderId: 'u1',
          content: replies[Math.floor(Math.random() * replies.length)],
          isRead: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        };
        addMessage(replyMsg);
      }, 1500 + Math.random() * 2000);
    }
    return newMessage;
  }, [conversationId, addMessage]);

  const markAsRead = useCallback(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  return { messages: conversationMessages, sendMessage, markAsRead };
}
