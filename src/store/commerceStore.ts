'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from './cartStore';

export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  total: number;
  createdAt: string;
}

export interface Tip {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  message?: string;
  createdAt: string;
}

export interface Subscription {
  creatorId: string;
  creatorName: string;
  tier: string;
  monthly: number;
  startedAt: string;
}

interface CommerceState {
  orders: Order[];
  tips: Tip[];
  subscriptions: Subscription[];
}

interface CommerceActions {
  placeOrder: (items: CartItem[]) => Order;
  addTip: (creatorId: string, creatorName: string, amount: number, message?: string) => void;
  subscribe: (creatorId: string, creatorName: string, tier: string, monthly: number) => void;
  unsubscribe: (creatorId: string) => void;
  isSubscribed: (creatorId: string) => boolean;
  totalSpent: () => number;
}

type CommerceStore = CommerceState & CommerceActions;

export const useCommerceStore = create<CommerceStore>()(
  persist(
    (set, get) => ({
      orders: [],
      tips: [],
      subscriptions: [],

      placeOrder: (items) => {
        const order: Order = {
          id: `ORD-${Date.now().toString(36).toUpperCase()}`,
          lines: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            image: i.product.images[0],
          })),
          total: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },

      addTip: (creatorId, creatorName, amount, message) =>
        set((state) => ({
          tips: [
            {
              id: `tip_${Date.now()}`,
              creatorId,
              creatorName,
              amount,
              message,
              createdAt: new Date().toISOString(),
            },
            ...state.tips,
          ],
        })),

      subscribe: (creatorId, creatorName, tier, monthly) =>
        set((state) => ({
          subscriptions: [
            ...state.subscriptions.filter((s) => s.creatorId !== creatorId),
            { creatorId, creatorName, tier, monthly, startedAt: new Date().toISOString() },
          ],
        })),

      unsubscribe: (creatorId) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.creatorId !== creatorId),
        })),

      isSubscribed: (creatorId) => get().subscriptions.some((s) => s.creatorId === creatorId),

      totalSpent: () => {
        const s = get();
        return (
          s.orders.reduce((sum, o) => sum + o.total, 0) +
          s.tips.reduce((sum, t) => sum + t.amount, 0)
        );
      },
    }),
    {
      name: 'wakka-commerce',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
