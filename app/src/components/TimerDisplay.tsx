'use client';

import { m } from 'motion/react';
import type { TimerSnapshot } from '@/lib/timer-engine';
import { formatTime } from '@/lib/timer-engine';
import { useI18n } from '@/lib/i18n';
import Icon from './Icon';

interface TimerDisplayProps {
  snapshot: TimerSnapshot;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  color?: string;
}

export default function TimerDisplay({ snapshot, onStart, onPause, onReset, color = 'accent' }: TimerDisplayProps) {
  const { t } = useI18n();
  const { state, displaySeconds, mode, phase, currentRound, totalRounds, currentMinute, totalMinutes, progress } = snapshot;

  const isIdle = state === 'idle';
  const isRunning = state === 'running';

  // Progress ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Sub-label
  let subLabel = '';
  if (!isIdle) {
    if (mode === 'emom' && currentMinute && totalMinutes) {
      subLabel = `${t('Min', 'Min')} ${currentMinute}/${totalMinutes}`;
    } else if (mode === 'intervals' && currentRound) {
      const roundLabel = totalRounds ? `${currentRound}/${totalRounds}` : `${currentRound}`;
      const phaseLabel = phase === 'work' ? t('WORK', 'TRABAJO') : t('REST', 'DESCANSO');
      subLabel = `R${roundLabel} ${phaseLabel}`;
    }
  }

  const phaseColor = mode === 'intervals'
    ? phase === 'work' ? 'text-emerald-400' : 'text-red-400'
    : `text-${color}-400`;

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Progress ring + time */}
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
          {!isIdle && (
            <m.circle
              cx="32" cy="32" r={radius}
              fill="none" strokeWidth="3" strokeLinecap="round"
              className={phaseColor}
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-bold text-sm ${isIdle ? 'text-muted' : phaseColor}`}>
            {formatTime(displaySeconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-1 flex-1">
        {subLabel && (
          <span className={`text-xs font-bold ${phaseColor}`}>{subLabel}</span>
        )}
        <div className="flex gap-1.5">
          {isIdle ? (
            <button
              onClick={onStart}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-${color}-500/20 text-${color}-400 text-xs font-bold hover:bg-${color}-500/30 transition-colors cursor-pointer`}
            >
              <Icon name="play" size={12} />
              {t('Start', 'Iniciar')}
            </button>
          ) : (
            <>
              <button
                onClick={isRunning ? onPause : onStart}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : `bg-${color}-500/20 text-${color}-400 hover:bg-${color}-500/30`
                }`}
              >
                <Icon name={isRunning ? 'pause' : 'play'} size={12} />
                {isRunning ? t('Pause', 'Pausa') : t('Go', 'Va')}
              </button>
              <button
                onClick={onReset}
                className="px-2.5 py-1.5 rounded-lg bg-card-elevated text-muted text-xs font-semibold hover:text-foreground transition-colors cursor-pointer"
              >
                {t('Reset', 'Reset')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
