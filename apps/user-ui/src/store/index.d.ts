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
export declare const useStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RootStore>>;
export {};
//# sourceMappingURL=index.d.ts.map