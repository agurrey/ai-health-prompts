'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I18nProvider, useI18n } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';
import Icon from './Icon';

function Nav() {
  const { t } = useI18n();
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href;
  }

  function linkClass(href: string) {
    return `relative px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
      isActive(href)
        ? 'text-accent bg-accent/10'
        : 'text-muted hover:text-foreground hover:bg-card-elevated'
    }`;
  }

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-base tracking-tight hover:text-accent transition-colors">
          <Logo size={24} />
          Hormesis
        </Link>
        <div className="hidden sm:flex items-center gap-1 text-sm">
          <Link href="/program" className={linkClass('/program')}>
            {t('Program', 'Programa')}
          </Link>
          <Link href="/about" className={linkClass('/about')}>
            {t('About', 'Info')}
          </Link>
          <div className="ml-2">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const tabs = [
    { href: '/', icon: 'home', label: 'H' },
    { href: '/program', icon: 'calendar', label: t('Program', 'Programa') },
    { href: '/about', icon: 'info', label: t('About', 'Info') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="grid grid-cols-3 min-h-[56px]">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 relative transition-colors ${
              isActive(tab.href) ? 'text-accent' : 'text-muted'
            }`}
          >
            {isActive(tab.href) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-accent" />
            )}
            <Icon name={tab.icon} size={20} />
            <span className="text-[10px] leading-none font-semibold">{tab.label}</span>
          </Link>
        ))}
      </div>
      <div className="flex justify-center pb-1">
        <LanguageToggle />
      </div>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border mt-16 hidden sm:block">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <Logo size={16} className="opacity-30" />
          <p className="font-semibold">{t('Same programming. Zero cost.', 'La misma programación. Coste cero.')}</p>
        </div>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-foreground transition-colors font-semibold">
            {t('About', 'Info')}
          </Link>
          <a href="https://github.com/agurrey/ai-health-prompts" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-semibold">
            GitHub
          </a>
          <a href="https://twitter.com/messages/compose?recipient_id=ignakki" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-semibold">
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
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </I18nProvider>
  );
}
