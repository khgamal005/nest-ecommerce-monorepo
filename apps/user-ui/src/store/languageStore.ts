'use client';

import { create } from 'zustand';

type Language = 'ar' | 'en';

interface LanguageState {
  lang: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: 'ar',
  setLanguage: (lang) => set({ lang }),
}));