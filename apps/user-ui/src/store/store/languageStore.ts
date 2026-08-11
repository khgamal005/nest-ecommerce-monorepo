import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ar' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ar', // Default to Arabic
      isRTL: true,
      setLanguage: (language) =>
        set({
          language,
          isRTL: language === 'ar',
        }),
    }),
    {
      name: 'language-storage',
    }
  )
);
