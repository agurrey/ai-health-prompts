'use client';

import Link from 'next/link';
import { prompts } from '@/data/prompts';
import { useI18n } from '@/lib/i18n';

export default function PromptsPage() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('Hormesis — AI Health Prompts', 'Hormesis — Prompts de Salud con IA')}</h1>
        <p className="text-muted mt-2">
          {t(
            'Each prompt is a complete system — intake, phases, decision trees, safety checks. Copy it, paste it into ChatGPT, Claude, or DeepSeek, and start chatting.',
            'Cada prompt es un sistema completo — intake, fases, árboles de decisión, chequeos de seguridad. Cópialo, pégalo en ChatGPT, Claude, o DeepSeek, y empieza a chatear.'
          )}
        </p>
      </div>

      <div className="grid gap-4">
        {prompts.map(p => (
          <Link
            key={p.slug}
            href={`/prompts/${p.slug}`}
            className="flex items-start gap-4 p-6 rounded-lg border border-border hover:border-accent/50 transition-colors bg-card group"
          >
            <span className="text-3xl">{p.icon}</span>
            <div className="flex-1">
              <h2 className="font-bold group-hover:text-accent transition-colors">
                {lang === 'es' ? p.title_es : p.title}
              </h2>
              <p className="text-accent text-sm mt-1">{lang === 'es' ? p.tagline_es : p.tagline}</p>
              <p className="text-muted text-sm mt-2">{lang === 'es' ? p.description_es : p.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-xs bg-border text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-bold text-sm mb-2">{t('How to use', 'Cómo usar')}</h3>
        <ol className="text-muted text-sm space-y-1 list-decimal list-inside">
          <li>{t('Click any prompt above', 'Haz clic en cualquier prompt')}</li>
          <li>{t('Hit "Copy Prompt"', 'Pulsa "Copiar Prompt"')}</li>
          <li>{t('Paste it as the first message in ChatGPT, Claude, or DeepSeek', 'Pegalo como primer mensaje en ChatGPT, Claude, o DeepSeek')}</li>
          <li>{t('Start chatting — the AI will guide you through an intake', 'Empieza a chatear — la IA te guiará a través de un intake')}</li>
        </ol>
      </div>
    </div>
  );
}
