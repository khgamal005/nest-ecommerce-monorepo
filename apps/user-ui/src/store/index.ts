'use client';

import { create } from 'zustand';

export interface CartItem {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  image?: string;
  quantity?: number;
}

export interface WishlistItem {
  id: string;
  title: string;
  slug?: string;
  price?: number;
  image?: string;
}

interface RootStore {
  cart: CartItem[];
  wishlist: WishlistItem[];
  setCart: (cart: CartItem[]) => void;
  setWishlist: (wishlist: WishlistItem[]) => void;
  addToCart: (item: CartItem) => void;
  toggleWishlist: (item: WishlistItem) => void;
}

export const useStore = create<RootStore>((set) => ({
  cart: [],
  wishlist: [],
  setCart: (cart) => set({ cart }),
  setWishlist: (wishlist) => set({ wishlist }),
  addToCart: (item) =>
    set((state) => {
      const exists = state.cart.find((c) => c.id === item.id);
      if (exists) {
        return {
          cart: state.cart.map((c) =>
            c.id === item.id
              ? { ...c, quantity: (c.quantity ?? 1) + 1 }
              : c,
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),
  toggleWishlist: (item) =>
    set((state) => {
      const exists = state.wishlist.some((w) => w.id === item.id);
      return {
        wishlist: exists
          ? state.wishlist.filter((w) => w.id !== item.id)
          : [...state.wishlist, item],
      };
    }),
}));