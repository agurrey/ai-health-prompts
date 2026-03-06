'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

export default function CopyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
