import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, TranslationKey } from './translations';

interface LanguageStore {
  language: Language;
  _hasHydrated: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setHasHydrated: (state: boolean) => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      _hasHydrated: false,

      setLanguage: (lang) => set({ language: lang }),

      toggleLanguage: () => set((state) => ({
        language: state.language === 'en' ? 'zh' : 'en',
      })),

      t: (key, params) => {
        const { language } = get();
        let text: string = translations[language][key] || translations.en[key] || key;

        // Replace parameters like {n}, {price}, etc.
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
          });
        }

        return text;
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'pixel-war-language',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
