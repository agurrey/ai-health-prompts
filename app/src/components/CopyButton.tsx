'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

export default function CopyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-6 py-3 bg-accent text-background font-semibold rounded-lg hover:brightness-110 transition-all cursor-pointer"
    >
      {copied ? t('Copied!', 'Copiado!') : t('Copy Prompt', 'Copiar Prompt')}
    </button>
  );
}
