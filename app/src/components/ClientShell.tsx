'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { I18nProvider, useI18n } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';

function Nav() {
  const { t } = useI18n();
  return (
    <nav className="border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:text-accent transition-colors">
          <Logo size={24} />
          Hormesis
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted">
          <Link href="/program" className="hover:text-foreground transition-colors">
            {t('Program', 'Programa')}
          </Link>
          <Link href="/history" className="hover:text-foreground transition-colors">
            {t('History', 'Historial')}
          </Link>
          <Link href="/profile" className="hover:text-foreground transition-colors">
            {t('Profile', 'Perfil')}
          </Link>
          <Link href="/prompts" className="hover:text-foreground transition-colors">
            Prompts
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            {t('About', 'Info')}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>{t('Built by a trainer, not a corporation.', 'Hecho por un entrenador, no una empresa.')}</p>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-foreground transition-colors">
            {t('About', 'Info')}
          </Link>
          <a href="https://github.com/agurrey/ai-health-prompts" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            GitHub
          </a>
          <a href="https://twitter.com/messages/compose?recipient_id=ignakki" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            {t('Contact', 'Contacto')}
          </a>
        </div>
      </div>
    </footer>
  );
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ServiceWorkerRegistration />
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </I18nProvider>
  );
}
