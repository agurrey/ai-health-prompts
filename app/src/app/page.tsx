'use client';

import Link from 'next/link';
import WorkoutGenerator from '@/components/WorkoutGenerator';
import { prompts } from '@/data/prompts';
import { useI18n } from '@/lib/i18n';

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
              'Small dose, big adaptation.',
              'Pequeña dosis, gran adaptación.'
            )}
          </p>
        </div>
        <WorkoutGenerator />
      </section>

      {/* Built by */}
      <section className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card animate-fade-up animate-delay-1">
        <img
          src="https://unavatar.io/twitter/ignakki"
          alt="Iñaki — personal trainer"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <p className="text-sm text-muted leading-relaxed">
          {t('Built by ', 'Hecho por ')}
          <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">@ignakki</a>
          {t(
            ' — personal trainer, 5+ years in functional movement & injury rehab.',
            ' — entrenador personal, 5+ años en movimiento funcional y rehabilitación.'
          )}
        </p>
      </section>

      {/* Prompt Hub Teaser */}
      <section className="space-y-6 animate-fade-up animate-delay-2">
        <div>
          <h2 className="text-xl font-bold">
            {t('Need more than a workout?', '¿Necesitas más que un entrenamiento?')}
          </h2>
          <p className="text-muted text-sm mt-1">
            {t(
              '6 AI health prompts — copy, paste into ChatGPT or Claude, and get a personal coach.',
              '6 prompts de salud con IA — copia, pega en ChatGPT o Claude, y ten un coach personal.'
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prompts.map(p => (
            <Link
              key={p.slug}
              href={`/prompts/${p.slug}`}
              className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-card/80 transition-all bg-card"
            >
              <span className="text-2xl">{p.icon}</span>
              <div>
                <h3 className="font-medium text-sm">{lang === 'es' ? p.title_es : p.title}</h3>
                <p className="text-muted text-xs mt-0.5">{lang === 'es' ? p.tagline_es : p.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/prompts"
          className="inline-block text-accent text-sm hover:underline"
        >
          {t('View all prompts →', 'Ver todos los prompts →')}
        </Link>
      </section>
    </div>
  );
}
