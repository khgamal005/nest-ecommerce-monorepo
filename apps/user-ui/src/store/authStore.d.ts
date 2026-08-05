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
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthStore>>;
export default useAuthStore;
//# sourceMappingURL=authStore.d.ts.map