"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const user_1 = require("@/types/user");
exports.useAuthStore = (0, zustand_1.create)((set) => ({
    clientSession: false,
    setClientSession: (active) => set({ clientSession: active }),
    user: null,
    setUser: (user) => set({ user }),
    loggedOut: false,
    setLoggedOut: (v) => set({ loggedOut: v }),
    reset: () => set({ clientSession: false, user: null }),
}));
exports.default = exports.useAuthStore;
//# sourceMappingURL=authStore.js.map