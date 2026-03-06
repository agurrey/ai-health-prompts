'use client';

import { useI18n } from '@/lib/i18n';
import CopyButton from './CopyButton';

export default function PromptActions({
  content,
  promptFile,
}: {
  content: string;
  promptFile: string;
}) {
  const { t } = useI18n();

  const chatgptUrl = 'https://chatgpt.com/';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <CopyButton text={content} />
        <a
          href={chatgptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-card border border-accent text-accent font-semibold rounded-lg hover:bg-accent/10 transition-colors text-center"
        >
          {t('Open in ChatGPT', 'Abrir en ChatGPT')}
        </a>
        <a
          href={`https://github.com/agurrey/ai-health-prompts/blob/main/${promptFile}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-border text-muted rounded-lg hover:border-muted transition-colors text-center"
        >
          {t('View on GitHub', 'Ver en GitHub')}
        </a>
      </div>
      <p className="text-muted text-xs">
        {t(
          '1. Copy the prompt  2. Open ChatGPT  3. Paste and send',
          '1. Copia el prompt  2. Abre ChatGPT  3. Pega y envía'
        )}
      </p>
      <p className="text-muted text-xs">
        {t(
          'The prompt auto-detects your language — just write in Spanish and it responds in Spanish.',
          'El prompt detecta tu idioma automáticamente — escríbele en español y te responde en español.'
        )}
      </p>
    </div>
  );
}
