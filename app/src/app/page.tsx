'use client';

import Link from 'next/link';
import WorkoutGenerator from '@/components/WorkoutGenerator';
import StreakWidget from '@/components/StreakWidget';
import { useI18n } from '@/lib/i18n';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="space-y-16">
      {/* Hero + Generator */}
      <section className="space-y-6 animate-fade-up">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {t('Today\'s workout', 'El entrenamiento de hoy')}
          </h1>
          <p className="text-muted text-sm font-semibold">
            {t(
              'New WOD drops daily at 00:00',
              'Nuevo WOD cada dia a las 00:00'
            )}
          </p>
        </div>

        <StreakWidget />

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
              ' — helping people move better, for good.',
              ' — ayudando a la gente a moverse mejor, para siempre.'
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
