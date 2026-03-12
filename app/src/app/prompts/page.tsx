'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import Icon from '@/components/Icon';
import { PROMPTS } from '@/data/prompts';

export default function PromptsPage() {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(filename: string) {
    const res = await fetch(`/prompts/${filename}`);
    const text = await res.text();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(filename);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Link href="/about" className="text-accent text-sm hover:underline">
        {t('Back to about', 'Volver a sobre mí')}
      </Link>

      <section className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {t('AI Health Prompts', 'Prompts de Salud IA')}
        </h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          {t(
            'Paste into ChatGPT, Claude, or DeepSeek and get a capable health coach for that domain.',
            'Pega en ChatGPT, Claude o DeepSeek y consigue un coach de salud competente en esa área.'
          )}
        </p>
      </section>

      <div className="space-y-3">
        {PROMPTS.map((p) => (
          <div
            key={p.slug}
            className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card animate-fade-up"
          >
            <span className="text-accent mt-0.5 shrink-0">
              <Icon name={p.icon} size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-foreground font-semibold text-sm">
                {t(p.titleEn, p.titleEs)}
              </h2>
              <p className="text-muted text-xs mt-1 leading-relaxed">
                {t(p.descEn, p.descEs)}
              </p>
            </div>
            <button
              onClick={() => handleCopy(p.filename)}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md bg-accent text-background hover:brightness-110 transition-all"
            >
              {copied === p.filename
                ? t('Copied!', 'Copiado!')
                : t('Copy Prompt', 'Copiar Prompt')}
            </button>
          </div>
        ))}
      </div>

      <p className="text-muted/60 text-xs leading-relaxed">
        {t(
          'These prompts generate general health guidance, not medical advice. If you have a diagnosed medical condition, always consult your healthcare provider.',
          'Estos prompts generan orientación general de salud, no consejo médico. Si tienes una condición médica diagnosticada, consulta siempre a tu profesional de salud.'
        )}
      </p>
    </div>
  );
}
