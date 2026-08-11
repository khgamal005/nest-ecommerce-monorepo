import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {sendUserEvent } from '../actions/sendUserEvent';
import { CartProduct, CleanLocationInfo } from '../types/Product';

// --------------------------
// TYPES
// --------------------------


interface TrackingInfo {
  addedAt: Date;
  deviceInfo: string;
  location:CleanLocationInfo ;
  user: any;
}





interface StoreState {
  cart: CartProduct[];
  wishlist: CartProduct[];

  addToCart: (
    product: CartProduct,
    user: any,
    location: CleanLocationInfo,
    deviceInfo: string
  ) => void;
  removeFromCart: (
    id: string,
    variantId: string | undefined,
    user: any,
    location: CleanLocationInfo,
    deviceInfo: string
  ) => void;
  decreaseQuantity: (
    id: string,
    variantId: string | undefined,
    user: any,
    location: CleanLocationInfo,
    deviceInfo: string
  ) => void;
  clearCart: (user?: any) => void;

  addToWishlist: (
    product: CartProduct,
    user: any,
    location: CleanLocationInfo,
    deviceInfo: string
  ) => void;
  removeFromWishlist: (
    id: string,
    user: any,
    location: CleanLocationInfo,
    deviceInfo: string
  ) => void;
  clearWishlist: () => void;
}

// --------------------------
// STORE
// --------------------------
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],

      // --------------------------
      // CART
      // --------------------------

addToCart: (
  product: CartProduct,
  user,
  location: CleanLocationInfo,
  deviceInfo: string
) =>
  
  set((state) => {
    // Find existing cart item by productId AND variantId
    const exists = state.cart.find((p) => 
      p.productId === product.productId && p.variantId === product.variantId
    );

    const trackingInfo: TrackingInfo = {
      addedAt: new Date(),
      deviceInfo,
      location,
      user,
    };

    // Kafka event
    if (location && deviceInfo) {
     sendUserEvent({
        userId: user?.id || 'guest',
        productId: product.productId,
        action: 'add_to_cart',
        shopId: product.shopId || '',
        city: location.city,
        device: deviceInfo,
      });
    }

    if (exists) {
      return {
        cart: state.cart.map((p) =>
          p.productId === product.productId && p.variantId === product.variantId
            ? { ...p, quantity: p.quantity + 1 }
            : p
        ),
      };
    }

    return {
      cart: [
        ...state.cart,
        {
          ...product,
          trackingInfo,
        },
      ],
    };
  }),


      decreaseQuantity: (id, variantId, user, location, deviceInfo) =>
        set((state) => ({
          cart: state.cart
            .map((product) => {
              if (product.productId !== id || product.variantId !== variantId) return product;

              const newQuantity = product.quantity - 1;

              if (newQuantity <= 0) return null;

              return {
                ...product,
                quantity: newQuantity,
                trackingInfo: {
                  ...product,
                  user,
                  location,
                  deviceInfo,
                },
              };
            })
            .filter(Boolean) as CartProduct[],
        })),

      removeFromCart: (id, variantId, user, location, deviceInfo) =>
        set((state) => {
          const removed = state.cart.find((p) => p.productId === id && p.variantId === variantId);

          if (removed && location && deviceInfo) {
           sendUserEvent({
              userId: user?.id || 'guest',
              productId: removed.productId,
              action: 'remove_from_cart',
              shopId: removed.shopId || '',
              city: location.city,
              device: deviceInfo,
            });
          }

          return {
            cart: state.cart.filter((p) => !(p.productId === id && p.variantId === variantId)),
          };
        }),

      clearCart: () => {
        set({ cart: [] });
      },

      // --------------------------
      // WISHLIST
      // --------------------------
      addToWishlist: (product, user, location, deviceInfo) =>
        set((state) => {
          if (state.wishlist.some((p) => p.productId === product.productId)) {
            return { wishlist: state.wishlist };
          }

          const trackingInfo: TrackingInfo = {
            addedAt: new Date(),
            deviceInfo,
            location,
            user,
          };

          // Kafka: add to wishlist
          if (location && deviceInfo) {
           sendUserEvent({
              userId: user?.id || 'guest',
              productId: product.productId,
              action: 'add_to_wishlist',
              shopId: product.shopId || '',
              city: location.city,
              device: deviceInfo,
            });
          }

          return {
            wishlist: [...state.wishlist, { ...product, trackingInfo }],
          };
        }),

      removeFromWishlist: (id, user, location, deviceInfo) =>
        set((state) => {
          const removedProduct = state.wishlist.find((p) => p.productId === id);

          if (removedProduct && location && deviceInfo) {
           sendUserEvent({
              userId: user?.id || 'guest',
              productId: removedProduct.productId,
              action: 'remove_from_wishlist',
              shopId: removedProduct.shopId || '',
              city: location.city,
              device: deviceInfo,
            });
          }

          return {
            wishlist: state.wishlist.filter((p) => p.productId !== id),
          };
        }),

      clearWishlist: () => set({ wishlist: [] }),
    }),
    { name: 'user-storage' }
  )
);
