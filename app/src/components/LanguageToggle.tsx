'use client';

import { useI18n } from '@/lib/i18n';

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      className="px-2 py-1 text-xs border border-border rounded hover:border-muted transition-colors text-muted cursor-pointer"
    >
      {lang === 'en' ? 'ES' : 'EN'}
    </button>
  );
}
