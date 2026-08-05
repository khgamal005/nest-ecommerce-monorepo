type Language = 'ar' | 'en';
interface LanguageState {
    lang: Language;
    setLanguage: (lang: Language) => void;
}
export declare const useLanguageStore: import("zustand").UseBoundStore<import("zustand").StoreApi<LanguageState>>;
export {};
//# sourceMappingURL=languageStore.d.ts.map