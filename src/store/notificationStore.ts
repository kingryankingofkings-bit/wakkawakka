import { create } from "zustand";
import type { Notification } from "@/types";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  dmUnreadCount: number;
}

interface NotificationActions {
  addNotification: (_notification: Notification) => void;
  markAsRead: (_id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

function computeUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

function computeDmUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead && n.type === "MESSAGE").length;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  // Initial state – seeded with mock data
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: computeUnreadCount(MOCK_NOTIFICATIONS),
  dmUnreadCount: computeDmUnreadCount(MOCK_NOTIFICATIONS),

  // Actions
  addNotification: (notification) =>
    set((state) => {
      const notifications = [notification, ...state.notifications];
      return {
        notifications,
        unreadCount: computeUnreadCount(notifications),
        dmUnreadCount: computeDmUnreadCount(notifications),
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      return {
        notifications,
        unreadCount: computeUnreadCount(notifications),
        dmUnreadCount: computeDmUnreadCount(notifications),
      };
    }),

  markAllAsRead: () =>
    set((state) => {
      const notifications = state.notifications.map((n) => ({
        ...n,
        isRead: true,
      }));
      return { notifications, unreadCount: 0, dmUnreadCount: 0 };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0, dmUnreadCount: 0 }),
}));
