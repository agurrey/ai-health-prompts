'use client';

import { useState } from 'react';
import { m } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import { getVideoThumbnail, getVideoUrl } from '@/lib/video';
import type { TimerConfig } from '@/lib/timer-engine';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import Icon from './Icon';
import TimerDisplay from './TimerDisplay';

interface ExerciseCardProps {
  name: string;
  prescription: string;
  cue: string;
  demoSearch: string;
  color: string;
  onComplete: () => void;
  onSkip: () => void;
  timerConfig?: TimerConfig | null;
  lastWeight?: string;
  lastDate?: string;
}

export default function ExerciseCard({
  name,
  prescription,
  cue,
  demoSearch,
  color,
  onComplete,
  onSkip,
  timerConfig,
  lastWeight,
  lastDate,
}: ExerciseCardProps) {
  const { t } = useI18n();
  const thumbnail = getVideoThumbnail(demoSearch);
  const videoUrl = getVideoUrl(demoSearch);

  const [showTimer, setShowTimer] = useState(false);
  const { snapshot, start, pause, reset } = useExerciseTimer(timerConfig || null);

  const handlePlay = () => {
    setShowTimer(true);
    start();
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={{ boxShadow: `0 0 0 1px color-mix(in srgb, var(--color-${color}), transparent 60%), 0 4px 20px color-mix(in srgb, var(--color-${color}), transparent 85%)` }}
    >
      {/* Video thumbnail */}
      <a
        href={videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(demoSearch)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video bg-zinc-900"
      >
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <img src="/exercise-placeholder.svg" alt={name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-5 h-5 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </a>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="font-bold text-foreground text-sm">{name}</h4>
          <p className={`text-xs font-semibold text-${color}-400`}>{prescription}</p>
        </div>

        <p className="text-muted text-xs leading-relaxed">{cue}</p>

        {lastWeight && (
          <p className="text-muted text-xs font-semibold">
            {t('Last', 'Anterior')}: {lastWeight} {lastDate ? `(${lastDate})` : ''}
          </p>
        )}

        {/* Inline timer */}
        {showTimer && timerConfig && (
          <TimerDisplay
            snapshot={snapshot}
            onStart={start}
            onPause={pause}
            onReset={reset}
            color={color}
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {timerConfig && !showTimer && (
            <button
              onClick={handlePlay}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-${color}-500/20 text-${color}-400 text-xs font-bold hover:bg-${color}-500/30 transition-colors cursor-pointer`}
            >
              <Icon name="play" size={14} />
              {t('Timer', 'Timer')}
            </button>
          )}
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            <Icon name="check" size={14} />
            {t('Done', 'Hecho')}
          </button>
          <button
            onClick={onSkip}
            className="px-3 py-2 rounded-lg bg-card-elevated text-muted text-xs font-semibold hover:text-foreground transition-colors cursor-pointer"
          >
            {t('Skip', 'Saltar')}
          </button>
        </div>
      </div>
    </m.div>
  );
}
