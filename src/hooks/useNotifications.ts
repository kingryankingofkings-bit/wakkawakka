'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
// socket integration available via useSocket hook

export function useNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } = useNotificationStore();

  // Hook up socket events (if socket is connected)
  useEffect(() => {
    // In a real app, this would listen to socket 'notification' events
    // and call addNotification(). For demo, notifications come from store.
  }, [addNotification]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
