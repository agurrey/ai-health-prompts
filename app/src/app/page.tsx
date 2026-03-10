'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import WorkoutGenerator from '@/components/WorkoutGenerator';
import XPBar from '@/components/XPBar';
import StreakWidget from '@/components/StreakWidget';
import { prompts } from '@/data/prompts';
import { useI18n } from '@/lib/i18n';

const WorkoutTimer = dynamic(() => import('@/components/WorkoutTimer'), { ssr: false });

export default function Home() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-16">
      {/* Hero + Generator */}
      <section className="space-y-6 animate-fade-up">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {t('Today\'s workout', 'El entrenamiento de hoy')}
          </h1>
          <p className="text-muted text-sm">
            {t(
              'New WOD drops daily at 00:00',
              'Nuevo WOD cada dia a las 00:00'
            )}
          </p>
        </div>

        {/* Gamification stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <XPBar />
          <StreakWidget />
        </div>

        <WorkoutGenerator />
      </section>

      {/* About — compact */}
      <section className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card animate-fade-up animate-delay-1">
        <img
          src="https://unavatar.io/twitter/ignakki"
          alt="Iñaki"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <p className="text-sm text-muted leading-relaxed">
            {t('Built by ', 'Hecho por ')}
            <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">@ignakki</a>
            {t(
              ' — helping people move better, for good.',
              ' — ayudando a la gente a moverse mejor, para siempre.'
            )}
          </p>
          <Link href="/about" className="text-accent text-xs hover:underline mt-1 inline-block">
            {t('About this project →', 'Sobre este proyecto →')}
          </Link>
        </div>
      </section>

      {/* Prompt Hub Teaser — compact */}
      <section className="space-y-4 animate-fade-up animate-delay-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">
            {t('AI Health Prompts', 'Prompts de Salud con IA')}
          </h2>
          <Link
            href="/prompts"
            className="text-accent text-xs hover:underline"
          >
            {t('View all →', 'Ver todos →')}
          </Link>
        </div>
        <div className="space-y-1">
          {prompts.map(p => (
            <Link
              key={p.slug}
              href={`/prompts/${p.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors"
            >
              <span className="text-lg">{p.icon}</span>
              <span className="text-sm font-medium text-foreground">{lang === 'es' ? p.title_es : p.title}</span>
              <span className="text-muted text-xs ml-auto hidden sm:block">{lang === 'es' ? p.tagline_es : p.tagline}</span>
            </Link>
          ))}
        </div>
      </section>
      <WorkoutTimer />
    </div>
  );
}
