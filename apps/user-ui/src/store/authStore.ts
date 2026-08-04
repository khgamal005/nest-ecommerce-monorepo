import { create } from 'zustand';
import { User } from '@/types/user';

type AuthStore = {
  /** Set true after a client-side login (form or OAuth redirect). */
  clientSession: boolean;
  setClientSession: (active: boolean) => void;
  /** Optimistic user set immediately on login — shown before React Query catches up. */
  user: User | null;
  setUser: (user: User | null) => void;
  /** Set true after logout to prevent falling back to stale user from SSR context. */
  loggedOut: boolean;
  setLoggedOut: (v: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  clientSession: false,
  setClientSession: (active: boolean) => set({ clientSession: active }),
  user: null,
  setUser: (user: User | null) => set({ user }),
  loggedOut: false,
  setLoggedOut: (v: boolean) => set({ loggedOut: v }),
  reset: () => set({ clientSession: false, user: null }),
}));

export default useAuthStore;
