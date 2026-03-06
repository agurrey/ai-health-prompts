'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'en' | 'es';

interface I18nContext {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (en: string, es: string) => string;
}

const I18nContext = createContext<I18nContext>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en,
});

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('lang') as Lang | null;
  if (saved === 'en' || saved === 'es') return saved;
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  function handleSetLang(l: Lang) {
    setLang(l);
    localStorage.setItem('lang', l);
  }

  function t(en: string, es: string): string {
    return lang === 'es' ? es : en;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
