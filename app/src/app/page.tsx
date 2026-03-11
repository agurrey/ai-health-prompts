'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import WorkoutGenerator from '@/components/WorkoutGenerator';
import XPBar from '@/components/XPBar';
import StreakWidget from '@/components/StreakWidget';
import Icon from '@/components/Icon';
import CatMascot from '@/components/CatMascot';
import { prompts } from '@/data/prompts';
import { useI18n } from '@/lib/i18n';

const WorkoutTimer = dynamic(() => import('@/components/WorkoutTimer'), { ssr: false });

export default function Home() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-16">
      {/* Hero + Generator */}
      <section className="space-y-6 animate-fade-up">
        <div className="flex items-center gap-4">
          <CatMascot pose="stretching" size={80} className="shrink-0" />
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold">
              {t('Today\'s workout', 'El entrenamiento de hoy')}
            </h1>
            <p className="text-muted text-sm font-semibold">
              {t(
                'New WOD drops daily at 00:00',
                'Nuevo WOD cada dia a las 00:00'
              )}
            </p>
          </div>
        </div>

        {/* Gamification stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <XPBar />
          <StreakWidget />
        </div>

        <WorkoutGenerator />
      </section>

      {/* About — compact */}
      <section className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card animate-fade-up animate-delay-1">
        <img
          src="https://unavatar.io/twitter/ignakki"
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

      {/* Prompt Hub Teaser — compact */}
      <section className="space-y-4 animate-fade-up animate-delay-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">
            {t('AI Health Prompts', 'Prompts de Salud con IA')}
          </h2>
          <Link
            href="/prompts"
            className="text-accent text-xs hover:underline font-bold"
          >
            {t('View all', 'Ver todos')} &rarr;
          </Link>
        </div>
        <div className="space-y-1">
          {prompts.map(p => (
            <Link
              key={p.slug}
              href={`/prompts/${p.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card-elevated transition-colors"
            >
              <span className="text-muted"><Icon name={p.icon} size={20} /></span>
              <span className="text-sm font-bold text-foreground">{lang === 'es' ? p.title_es : p.title}</span>
              <span className="text-muted text-xs ml-auto hidden sm:block font-semibold">{lang === 'es' ? p.tagline_es : p.tagline}</span>
            </Link>
          ))}
        </div>
      </section>
      <WorkoutTimer />
    </div>
  );
}
