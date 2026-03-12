'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import type { TimerConfig } from '@/lib/timer-engine';
import type { Level, Load } from '@/data/exercises';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import Icon from './Icon';
import TimerDisplay from './TimerDisplay';
import VideoPlayer from './VideoPlayer';

interface VariantOption {
  id: string;
  name: string;
  level: Level;
  load: Load;
}

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
  readOnly?: boolean;
  onSwap?: (newExerciseId: string) => void;
  variants?: VariantOption[];
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
  readOnly = false,
  onSwap,
  variants,
}: ExerciseCardProps) {
  const { t } = useI18n();

  const [showTimer, setShowTimer] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const { snapshot, start, pause, reset } = useExerciseTimer(timerConfig || null);

  const handlePlay = () => {
    setShowTimer(true);
    start();
  };

  const levelLabel = (l: Level) => l === 1 ? 'L1' : l === 2 ? 'L2' : 'L3';
  const loadLabel = (l: Load) => l === 'bodyweight' ? 'BW' : l === 'light' ? 'Light' : 'Heavy';

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={{ boxShadow: `0 0 0 1px color-mix(in srgb, var(--color-${color}), transparent 60%), 0 4px 20px color-mix(in srgb, var(--color-${color}), transparent 85%)` }}
    >
      {/* Video player */}
      <VideoPlayer demoSearch={demoSearch} name={name} />

      {/* Content */}
      <div className="p-3 space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-sm flex-1">{name}</h4>
            {!readOnly && onSwap && variants && variants.length > 0 && (
              <button
                onClick={() => setShowVariants(!showVariants)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showVariants ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground hover:bg-card-elevated'
                }`}
                title={t('Swap exercise', 'Cambiar ejercicio')}
              >
                <Icon name="shuffle" size={14} />
              </button>
            )}
          </div>
          <p className={`text-xs font-semibold text-${color}-400`}>{prescription}</p>
        </div>

        {/* Variant panel */}
        <AnimatePresence>
          {showVariants && variants && variants.length > 0 && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-2 space-y-1">
                <p className="text-accent text-xs font-bold mb-1.5">
                  {t('Alternatives', 'Alternativas')}
                </p>
                {variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSwap?.(v.id);
                      setShowVariants(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-foreground text-xs font-medium flex-1">{v.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-card-elevated text-muted font-mono">
                      {levelLabel(v.level)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-card-elevated text-muted font-mono">
                      {loadLabel(v.load)}
                    </span>
                  </button>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>

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
        {!readOnly && (
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
        )}
      </div>
    </m.div>
  );
}
