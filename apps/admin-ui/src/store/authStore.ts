import { create } from 'zustand';

export interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

type AuthStore = {
  /** Set true after a client-side login. */
  clientSession: boolean;
  setClientSession: (active: boolean) => void;
  /** Optimistic admin set immediately on login — shown before React Query catches up. */
  admin: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
  /** Set true after logout to prevent falling back to a stale SSR admin. */
  loggedOut: boolean;
  setLoggedOut: (v: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  clientSession: false,
  setClientSession: (active: boolean) => set({ clientSession: active }),
  admin: null,
  setAdmin: (admin: AdminUser | null) => set({ admin }),
  loggedOut: false,
  setLoggedOut: (v: boolean) => set({ loggedOut: v }),
  reset: () => set({ clientSession: false, admin: null }),
}));

export default useAuthStore;