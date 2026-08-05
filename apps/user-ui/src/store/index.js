'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStore = void 0;
const zustand_1 = require("zustand");
exports.useStore = (0, zustand_1.create)((set) => ({
    cart: [],
    wishlist: [],
    setCart: (cart) => set({ cart }),
    setWishlist: (wishlist) => set({ wishlist }),
    addToCart: (item) => set((state) => {
        const exists = state.cart.find((c) => c.id === item.id);
        if (exists) {
            return {
                cart: state.cart.map((c) => c.id === item.id
                    ? { ...c, quantity: (c.quantity ?? 1) + 1 }
                    : c),
            };
        }
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),
    toggleWishlist: (item) => set((state) => {
        const exists = state.wishlist.some((w) => w.id === item.id);
        return {
            wishlist: exists
                ? state.wishlist.filter((w) => w.id !== item.id)
                : [...state.wishlist, item],
        };
    }),
}));
//# sourceMappingURL=index.js.map