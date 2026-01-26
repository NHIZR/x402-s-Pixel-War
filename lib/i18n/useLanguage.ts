import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, TranslationKey } from './translations';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',

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
    }),
    {
      name: 'pixel-war-language',
    }
  )
);
