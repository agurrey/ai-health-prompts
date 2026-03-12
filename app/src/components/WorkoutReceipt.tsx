'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import type { Session } from '@/lib/generator';
import type { FlowStep } from '@/lib/workout-flow';
import Icon from './Icon';

interface WorkoutReceiptProps {
  session: Session;
  steps: FlowStep[];
}

export default function WorkoutReceipt({ session, steps }: WorkoutReceiptProps) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  const warmupSteps = steps.filter(s => s.type === 'warmup');
  const strengthSteps = steps.filter(s => s.type === 'strength');

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-elevated/50 transition-colors"
      >
        <span className="text-sm font-bold text-foreground">
          {t('View summary', 'Ver resumen')}
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} className="text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border">
              {/* Warmup */}
              <div className="pt-3">
                <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  {t('Warm-up', 'Calentamiento')}
                </h4>
                <div className="space-y-1">
                  {warmupSteps.map(step => {
                    const w = session.warmup.exercises[step.index];
                    if (!w) return null;
                    const isDone = step.status === 'done';
                    return (
                      <div key={step.index} className="flex items-center gap-2 text-xs">
                        <Icon
                          name={isDone ? 'check' : 'skip-forward'}
                          size={12}
                          className={isDone ? 'text-emerald-400' : 'text-muted/40'}
                        />
                        <span className={isDone ? 'text-muted' : 'text-muted/40'}>
                          {w.exercise.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strength */}
              <div>
                <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
                  {t('Strength', 'Fuerza')}
                </h4>
                <div className="space-y-1">
                  {strengthSteps.map(step => {
                    const item = session.strength[step.index];
                    if (!item) return null;
                    const isDone = step.status === 'done';
                    const exerciseName = step.swappedExerciseId
                      ? step.swappedExerciseId.replace(/-/g, ' ')
                      : item.exercise.name;
                    return (
                      <div key={step.index} className="flex items-center gap-2 text-xs">
                        <Icon
                          name={isDone ? 'check' : 'skip-forward'}
                          size={12}
                          className={isDone ? 'text-emerald-400' : 'text-muted/40'}
                        />
                        <span className={isDone ? 'text-muted' : 'text-muted/40'}>
                          {exerciseName}
                        </span>
                        <span className="text-muted/40">
                          {item.sets}x{item.reps} @ {item.load}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WOD */}
              <div>
                <h4 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">WOD</h4>
                <p className="text-muted text-xs">
                  {lang === 'es' ? session.conditioning.formatName_es : session.conditioning.formatName}
                  {' — '}
                  {session.conditioning.movements.map(m => m.name).join(', ')}
                </p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
