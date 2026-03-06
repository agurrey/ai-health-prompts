'use client';

import { useI18n } from '@/lib/i18n';
import { PromptModule } from '@/data/prompts';
import PromptActions from './PromptActions';

export default function PromptPageContent({
  prompt,
  content,
  contentEs,
}: {
  prompt: PromptModule;
  content: string;
  contentEs?: string;
}) {
  const { t, lang } = useI18n();
  const activeContent = lang === 'es' && contentEs ? contentEs : content;
  const activePromptFile = lang === 'es' ? prompt.promptFile_es : prompt.promptFile;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{prompt.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">
              {lang === 'es' ? prompt.title_es : prompt.title}
            </h1>
            <p className="text-accent text-sm">
              {lang === 'es' ? prompt.tagline_es : prompt.tagline}
            </p>
          </div>
        </div>
        <p className="text-muted">
          {lang === 'es' ? prompt.description_es : prompt.description}
        </p>
      </div>

      <PromptActions content={activeContent} promptFile={activePromptFile} />

      <div className="border-t border-border pt-6">
        <h3 className="font-bold text-sm mb-3">
          {t('How to use this prompt', 'Cómo usar este prompt')}
        </h3>
        <ol className="text-muted text-sm space-y-2 list-decimal list-inside">
          <li>
            {t(
              'Click "Copy Prompt" or "Open in ChatGPT"',
              'Haz clic en "Copiar Prompt" o "Abrir en ChatGPT"'
            )}
          </li>
          <li>
            {t(
              'If you copied, paste it as the first message in ',
              'Si copiaste, pégalo como primer mensaje en '
            )}
            <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ChatGPT</a>
            {', '}
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Claude</a>
            {t(', or ', ', o ')}
            <a href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">DeepSeek</a>
          </li>
          <li>
            {t(
              'The AI will start a guided intake — answer the questions and get your personalized protocol',
              'La IA iniciará un intake guiado — responde las preguntas y recibe tu protocolo personalizado'
            )}
          </li>
        </ol>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-bold text-sm mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {prompt.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-xs bg-card border border-border text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
