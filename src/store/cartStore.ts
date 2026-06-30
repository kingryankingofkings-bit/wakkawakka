import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type { Product } from '@/types';

export interface CartItem {
  id?: string;
  productId: string;
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

type CartStore = CartState & CartActions;

const getHeaders = () => {
  const userId = useAuthStore.getState().user?.id;
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
  };
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  fetchCart: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true });
    try {
      const res = await fetch(`/api/cart`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data && data.items) {
          // Parse images from DB format if it is string
          const parsedItems = data.items.map((item: any) => {
            let images = item.product.images;
            if (typeof images === 'string') {
              try {
                images = JSON.parse(images);
              } catch {
                images = [];
              }
            }
            return {
              ...item,
              product: {
                ...item.product,
                images: Array.isArray(images) ? images : [],
              },
            };
          });
          set({ items: parsedItems });
        }
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product, quantity = 1) => {
    try {
      // Optimistic update
      const existing = get().items.find((i) => i.product.id === product.id);
      if (existing) {
        set({
          items: get().items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
          ),
        });
      } else {
        set({ items: [...get().items, { productId: product.id, product, quantity }] });
      }

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (res.ok) {
        await get().fetchCart();
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  },

  removeItem: async (productId) => {
    try {
      // Optimistic update
      set({ items: get().items.filter((i) => i.product.id !== productId) });

      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        await get().fetchCart();
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      // Optimistic update
      if (quantity <= 0) {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      } else {
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      }

      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        await get().fetchCart();
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  },

  clearCart: async () => {
    try {
      // Optimistic update
      set({ items: [] });

      const res = await fetch('/api/cart?action=clear', {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        await get().fetchCart();
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  },

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));

export const selectCartTotal = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

export const selectCartCount = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
