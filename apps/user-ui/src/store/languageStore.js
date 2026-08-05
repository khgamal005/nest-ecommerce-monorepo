'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLanguageStore = void 0;
const zustand_1 = require("zustand");
exports.useLanguageStore = (0, zustand_1.create)((set) => ({
    lang: 'ar',
    setLanguage: (lang) => set({ lang }),
}));
//# sourceMappingURL=languageStore.js.map