'use client';

import Link from 'next/link';
import WorkoutGenerator from '@/components/WorkoutGenerator';
import { useI18n } from '@/lib/i18n';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="space-y-16">
      {/* Hero + Generator */}
      <section className="space-y-6 animate-fade-up">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {t('Today\'s session', 'La sesión de hoy')}
          </h1>
          <p className="text-muted text-sm font-semibold">
            {t(
              'New at midnight. Warmup + strength + conditioning.',
              'Nuevo a medianoche. Calentamiento + fuerza + acondicionamiento.'
            )}
          </p>
        </div>

        <WorkoutGenerator />
      </section>

      {/* About — compact */}
      <section className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card animate-fade-up animate-delay-1">
        <img
          src="https://unavatar.io/twitter/ignakki?v=2"
          alt="Inaki"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <p className="text-sm text-muted font-semibold leading-relaxed">
            {t('Built by ', 'Hecho por ')}
            <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold">@ignakki</a>
            {t(
              ' — same programming I use with my clients.',
              ' — la misma programación que uso con mis clientes.'
            )}
          </p>
          <Link href="/about" className="text-accent text-xs hover:underline mt-1 inline-block font-bold">
            {t('About this project', 'Sobre este proyecto')} &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
