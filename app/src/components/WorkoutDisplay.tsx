'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Session } from '@/lib/generator';
import { exercises as allExercises } from '@/data/exercises';
import type { Restriction, Equipment } from '@/data/exercises';
import { warmupExercises as allWarmupExercises } from '@/data/warmup-exercises';
import { useI18n } from '@/lib/i18n';
import { isWorkoutDone, markWorkoutDone } from '@/lib/storage';
import type { ExerciseLogEntry } from '@/lib/storage';
import {
  type LinearFlowState,
  type StepType,
  createLinearState,
  expectedStepCount,
  completeStep,
  skipStep,
  swapExercise,
  skipToWod,
  resetBlock,
  resetAll,
  isBlockComplete,
  isWorkoutComplete,
  saveFlowState,
  loadFlowState,
  getBlockTransition,
} from '@/lib/workout-flow';
import { getVariants, getWarmupVariants } from '@/lib/exercise-variants';
import { configFromWarmupPrescription, configFromStrengthRest, configFromWod } from '@/lib/timer-config';
import ExerciseCard from './ExerciseCard';
import WodCard from './WodCard';
import WodPreviewCard from './WodPreviewCard';
import SectionLabel from './SectionLabel';
import CompletedStep from './CompletedStep';
import FinalCelebration from './FinalCelebration';
import ProgressBar from './ProgressBar';
import WorkoutReceipt from './WorkoutReceipt';
import AdaptPanel from './AdaptPanel';
import Icon from './Icon';
import { playCompletionFeedback, playSkipFeedback } from '@/lib/feedback';

function formatLogDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (lang === 'es') {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const BLOCK_MESSAGES: Record<string, { en: string; es: string }> = {
  warmup: { en: 'Warm-up done!', es: 'Calentamiento hecho!' },
  strength: { en: 'Strength done!', es: 'Fuerza hecha!' },
  wod_preview: { en: 'Let\'s go!', es: 'Vamos!' },
};

interface WorkoutDisplayProps {
  session: Session;
  lastLogs?: Record<string, ExerciseLogEntry | null>;
  readOnly?: boolean;
  onDone?: () => void;
  restrictions?: Restriction[];
  equipmentOverride?: Equipment[] | null;
  shortMode?: boolean;
  savedEquipment?: Equipment[];
  onAdapt?: (restrictions: Restriction[], equipmentOverride: Equipment[] | null, shortMode: boolean) => void;
  onResetAdapt?: () => void;
}

export default function WorkoutDisplay({
  session,
  lastLogs = {},
  readOnly = false,
  onDone,
  restrictions = [],
  equipmentOverride = null,
  shortMode = false,
  savedEquipment = [],
  onAdapt,
  onResetAdapt,
}: WorkoutDisplayProps) {
  const { t, lang } = useI18n();
  const expected = expectedStepCount(session);

  const [flow, setFlow] = useState<LinearFlowState>(() => {
    if (readOnly) return createLinearState(session);
    const saved = loadFlowState(session.date);
    if (saved && saved.steps.length === expected) return saved;
    return createLinearState(session);
  });
  const [done, setDone] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isAdapted = restrictions.length > 0 || equipmentOverride !== null || shortMode;

  const safeFlow = flow.date === session.date && flow.steps.length === expected
    ? flow
    : createLinearState(session);
  const allComplete = isWorkoutComplete(safeFlow);

  useEffect(() => {
    setDone(isWorkoutDone(session.date));
    if (readOnly) {
      setFlow(createLinearState(session));
    } else {
      const saved = loadFlowState(session.date);
      if (saved && saved.steps.length === expected) {
        setFlow(saved);
      } else {
        setFlow(createLinearState(session));
      }
    }
  }, [session.date, expected, readOnly]);

  useEffect(() => {
    if (!readOnly) saveFlowState(flow);
  }, [flow, readOnly]);

  const [confetti, setConfetti] = useState(false);

  const handleComplete = useCallback(() => {
    playCompletionFeedback();
    setConfetti(true);
    setTimeout(() => setConfetti(false), 500);
    setFlow(prev => {
      const next = completeStep(prev);
      const transition = getBlockTransition(next);
      if (transition && BLOCK_MESSAGES[transition]) {
        const msg = BLOCK_MESSAGES[transition];
        setFlashMsg(lang === 'es' ? msg.es : msg.en);
        setTimeout(() => setFlashMsg(null), 800);
      }
      return next;
    });
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [lang]);

  const handleSkip = useCallback(() => {
    playSkipFeedback();
    setFlow(prev => {
      const next = skipStep(prev);
      const transition = getBlockTransition(next);
      if (transition && BLOCK_MESSAGES[transition]) {
        const msg = BLOCK_MESSAGES[transition];
        setFlashMsg(lang === 'es' ? msg.es : msg.en);
        setTimeout(() => setFlashMsg(null), 800);
      }
      return next;
    });
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [lang]);

  const handleResetBlock = useCallback((type: StepType) => {
    setFlow(prev => resetBlock(prev, type));
    setDone(false);
  }, []);

  const handleSwap = useCallback((newExerciseId: string) => {
    setFlow(prev => swapExercise(prev, prev.currentStep, newExerciseId));
  }, []);

  const handleSkipToWod = useCallback(() => {
    setFlow(prev => skipToWod(prev));
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, []);

  const handleWorkoutComplete = useCallback(() => {
    markWorkoutDone(session.date, session.strength[0]?.exercise.level ?? 2, lang === 'es' ? session.sessionType_es : session.sessionType);
    setDone(true);
    onDone?.();
  }, [session, lang, onDone]);

  const currentStep = safeFlow.currentStep < safeFlow.steps.length ? safeFlow.steps[safeFlow.currentStep] : null;

  // Resolve swapped exercises for current step
  const resolvedExercise = useMemo(() => {
    if (!currentStep || !currentStep.swappedExerciseId) return null;
    if (currentStep.type === 'warmup') {
      return allWarmupExercises.find(e => e.id === currentStep.swappedExerciseId) ?? null;
    }
    if (currentStep.type === 'strength') {
      return allExercises.find(e => e.id === currentStep.swappedExerciseId) ?? null;
    }
    return null;
  }, [currentStep]);

  // Compute variants for current exercise
  const currentVariants = useMemo(() => {
    if (!currentStep || readOnly) return [];
    const level = session.strength[0]?.exercise.level ?? 2;

    if (currentStep.type === 'warmup') {
      const w = session.warmup.exercises[currentStep.index]?.exercise;
      if (!w) return [];
      const usedIds = new Set(session.warmup.exercises.map(e => e.exercise.id));
      return getWarmupVariants(w, level, restrictions, usedIds).map(e => ({
        id: e.id, name: e.name, level: e.level, load: 'bodyweight' as const,
      }));
    }

    if (currentStep.type === 'strength') {
      const item = session.strength[currentStep.index];
      if (!item) return [];
      const usedIds = new Set(session.strength.map(s => s.exercise.id));
      return getVariants(item.exercise, level, equipmentOverride ?? savedEquipment, restrictions, usedIds).map(e => ({
        id: e.id, name: e.name, level: e.level, load: e.load,
      }));
    }

    return [];
  }, [currentStep, session, restrictions, equipmentOverride, savedEquipment, readOnly]);

  // ── Read-only mode: vertical scroll ──
  if (readOnly) {
    return (
      <div className="font-mono text-sm leading-relaxed space-y-6">
        <ReadOnlyHeader session={session} lang={lang} isAdapted={isAdapted} t={t} />
        {renderReadOnlyBlock('warmup')}
        {renderReadOnlyBlock('strength')}
        {renderReadOnlyBlock('wod')}
        <Disclaimer t={t} />
      </div>
    );
  }

  function renderReadOnlyBlock(type: 'warmup' | 'strength' | 'wod') {
    const blockSteps = safeFlow.steps.filter(s => s.type === type);
    if (blockSteps.length === 0 && type !== 'wod') return null;

    return (
      <div key={type} className="space-y-3">
        <SectionLabel
          type={type}
          count={type === 'wod' ? 1 : blockSteps.length}
        />
        {type === 'wod' ? (
          <WodCard
            formatName={lang === 'es' ? session.conditioning.formatName_es : session.conditioning.formatName}
            formatDescription={lang === 'es' ? session.conditioning.formatDescription_es : session.conditioning.formatDescription}
            formatType={session.conditioning.formatType}
            timecap={session.conditioning.timecap}
            intensity={lang === 'es' ? session.conditioning.intensity_es : session.conditioning.intensity}
            volume={lang === 'es' ? session.conditioning.volume_es : session.conditioning.volume}
            movements={session.conditioning.movements}
            note={lang === 'es' ? session.conditioning.note_es : session.conditioning.note}
            scalingNote={lang === 'es' ? session.conditioning.scalingNote_es : session.conditioning.scalingNote}
            onComplete={() => {}}
            onSkip={() => {}}
            timerConfig={null}
            readOnly
          />
        ) : blockSteps.map(step => {
          if (type === 'warmup') {
            const w = session.warmup.exercises[step.index];
            if (!w) return null;
            return (
              <ExerciseCard
                key={`${type}-${step.index}`}
                name={w.exercise.name}
                prescription={w.exercise.prescription}
                cue={lang === 'es' ? w.exercise.cue_es : w.exercise.cue}
                demoSearch={w.exercise.demoSearch || w.exercise.name}
                color="emerald"
                onComplete={() => {}}
                onSkip={() => {}}
                timerConfig={null}
                readOnly
              />
            );
          } else {
            const item = session.strength[step.index];
            if (!item) return null;
            const log = lastLogs[item.exercise.id];
            return (
              <ExerciseCard
                key={`${type}-${step.index}`}
                name={item.exercise.name}
                prescription={`${item.sets}x${item.reps} @ ${item.load} | ${t('Rest', 'Descanso')}: ${item.rest}${item.tempo ? ` | Tempo: ${item.tempo}` : ''}`}
                cue={`${lang === 'es' ? item.protocolNote_es : item.protocolNote}\n${lang === 'es' ? item.exercise.cue_es : item.exercise.cue}`}
                demoSearch={item.exercise.demoSearch}
                color="red"
                onComplete={() => {}}
                onSkip={() => {}}
                timerConfig={null}
                readOnly
                lastWeight={log?.weight ? `${log.weight} x ${log.reps}` : undefined}
                lastDate={log?.date ? formatLogDate(log.date, lang) : undefined}
              />
            );
          }
        })}
      </div>
    );
  }

  // ── Interactive mode: card flow ──
  function renderCurrentCard() {
    if (!currentStep) return null;

    if (currentStep.type === 'warmup') {
      const w = session.warmup.exercises[currentStep.index];
      if (!w) return null;
      const ex = resolvedExercise ?? w.exercise;
      return (
        <ExerciseCard
          name={ex.name}
          prescription={'prescription' in ex ? ex.prescription : w.exercise.prescription}
          cue={lang === 'es' ? ex.cue_es : ex.cue}
          demoSearch={ex.demoSearch || ex.name}
          color="emerald"
          onComplete={handleComplete}
          onSkip={handleSkip}
          timerConfig={configFromWarmupPrescription('prescription' in ex ? ex.prescription : w.exercise.prescription)}
          onSwap={handleSwap}
          variants={currentVariants}
        />
      );
    }

    if (currentStep.type === 'strength') {
      const item = session.strength[currentStep.index];
      if (!item) return null;
      const ex = resolvedExercise ?? item.exercise;
      const log = lastLogs[ex.id ?? item.exercise.id];
      return (
        <ExerciseCard
          name={ex.name}
          prescription={`${item.sets}x${item.reps} @ ${item.load} | ${t('Rest', 'Descanso')}: ${item.rest}${item.tempo ? ` | Tempo: ${item.tempo}` : ''}`}
          cue={`${lang === 'es' ? item.protocolNote_es : item.protocolNote}\n${lang === 'es' ? ('cue_es' in ex ? ex.cue_es : item.exercise.cue_es) : ('cue' in ex ? ex.cue : item.exercise.cue)}`}
          demoSearch={('demoSearch' in ex ? ex.demoSearch : undefined) ?? item.exercise.demoSearch}
          color="red"
          onComplete={handleComplete}
          onSkip={handleSkip}
          timerConfig={configFromStrengthRest(item.rest)}
          lastWeight={log?.weight ? `${log.weight} x ${log.reps}` : undefined}
          lastDate={log?.date ? formatLogDate(log.date, lang) : undefined}
          onSwap={handleSwap}
          variants={currentVariants}
        />
      );
    }

    if (currentStep.type === 'wod_preview') {
      const mv = session.conditioning.movements[currentStep.index];
      if (!mv) return null;
      return (
        <WodPreviewCard
          movement={mv}
          movementIndex={currentStep.index}
          totalMovements={session.conditioning.movements.length}
          onNext={handleComplete}
          onSkipAll={handleSkipToWod}
        />
      );
    }

    if (currentStep.type === 'wod') {
      return (
        <WodCard
          formatName={lang === 'es' ? session.conditioning.formatName_es : session.conditioning.formatName}
          formatDescription={lang === 'es' ? session.conditioning.formatDescription_es : session.conditioning.formatDescription}
          formatType={session.conditioning.formatType}
          timecap={session.conditioning.timecap}
          intensity={lang === 'es' ? session.conditioning.intensity_es : session.conditioning.intensity}
          volume={lang === 'es' ? session.conditioning.volume_es : session.conditioning.volume}
          movements={session.conditioning.movements}
          note={lang === 'es' ? session.conditioning.note_es : session.conditioning.note}
          scalingNote={lang === 'es' ? session.conditioning.scalingNote_es : session.conditioning.scalingNote}
          onComplete={handleComplete}
          onSkip={handleSkip}
          timerConfig={configFromWod(session.conditioning.formatType, session.conditioning.timecap)}
        />
      );
    }

    return null;
  }

  // Current block label for context
  const currentBlockType = currentStep?.type ?? null;
  const blockLabel = currentBlockType === 'warmup' ? t('Warm-up', 'Calentamiento')
    : currentBlockType === 'strength' ? t('Strength', 'Fuerza')
    : currentBlockType === 'wod_preview' ? t('Conditioning Preview', 'Vista previa')
    : currentBlockType === 'wod' ? t('Conditioning', 'Acondicionamiento')
    : null;
  const blockColor = currentBlockType === 'warmup' ? 'emerald'
    : currentBlockType === 'strength' ? 'red'
    : 'orange';

  return (
    <div className="font-mono text-sm leading-relaxed space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          {lang === 'es' ? session.sessionType_es : session.sessionType}
          {isAdapted && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 align-middle font-medium">
              {t('Adapted', 'Adaptado')}
            </span>
          )}
        </h2>
        <p className="text-muted text-xs">
          {lang === 'es' ? session.dayName_es : session.dayName} — {session.date} — ~{session.duration} min
          <a href="/program" className="ml-1.5 text-fuchsia-400/60 hover:text-fuchsia-400 transition-colors">
            &rarr; {t('Program', 'Programa')}
          </a>
        </p>
      </div>

      {/* Adapt Panel */}
      {onAdapt && onResetAdapt && (
        <AdaptPanel
          activeRestrictions={restrictions}
          equipmentOverride={equipmentOverride ?? null}
          shortMode={shortMode}
          savedEquipment={savedEquipment}
          onApply={onAdapt}
          onReset={onResetAdapt}
        />
      )}

      {/* Progress bar */}
      {!allComplete && !done && (
        <ProgressBar steps={safeFlow.steps} currentStep={safeFlow.currentStep} color={blockColor} />
      )}

      {/* Block label */}
      {blockLabel && !allComplete && !done && (
        <div className="flex items-center justify-between">
          <p className={`text-${blockColor}-400 text-xs font-bold uppercase tracking-wider`}>
            {blockLabel}
          </p>
          {(currentBlockType === 'warmup' || currentBlockType === 'strength') && isBlockComplete(safeFlow, currentBlockType) && (
            <button
              onClick={() => handleResetBlock(currentBlockType!)}
              className="text-xs text-muted hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              <Icon name="cycle" size={12} />
              {t('Redo', 'Repetir')}
            </button>
          )}
        </div>
      )}

      {/* Completion flash overlay */}
      <AnimatePresence>
        {flashMsg && (
          <m.div
            key="flash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/15 border border-emerald-500/20"
          >
            <Icon name="check" size={18} className="text-emerald-400" />
            <p className="text-emerald-400 text-sm font-bold">{flashMsg}</p>
          </m.div>
        )}
      </AnimatePresence>

      {/* Mini confetti on exercise complete */}
      <AnimatePresence>
        {confetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <m.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: ['#34d399', '#f87171', '#fb923c', '#a78bfa', '#facc15', '#38bdf8'][i] }}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: [0, 1.5, 1],
                  x: (Math.random() - 0.5) * 120,
                  y: (Math.random() - 0.5) * 120,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Current card with slide transition */}
      {!allComplete && !done && (
        <div ref={cardRef}>
          <AnimatePresence mode="wait">
            <m.div
              key={safeFlow.currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
            >
              {renderCurrentCard()}
            </m.div>
          </AnimatePresence>
        </div>
      )}

      {/* Final celebration + receipt */}
      {allComplete && !done && (
        <>
          <FinalCelebration />
          <WorkoutReceipt session={session} steps={safeFlow.steps} />
        </>
      )}

      {/* Done Button + Start over */}
      {allComplete && !done && (
        <div className="space-y-2">
          <button
            onClick={handleWorkoutComplete}
            className="w-full px-4 py-4 bg-accent text-background font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer text-lg"
          >
            {t('Finish', 'Terminar')}
          </button>
          <div className="text-center">
            <button
              onClick={() => { setFlow(resetAll(safeFlow)); setDone(false); }}
              className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
            >
              {t('Start over', 'Empezar de nuevo')}
            </button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {done && (
        <div className="space-y-2">
          <WorkoutReceipt session={session} steps={safeFlow.steps} />
          <div className="w-full px-4 py-4 bg-success/15 border border-success/30 text-success font-bold rounded-lg text-center text-lg flex items-center justify-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t('Completed', 'Completado')}
          </div>
          <div className="text-center">
            <button
              onClick={() => { setFlow(resetAll(safeFlow)); setDone(false); }}
              className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
            >
              {t('Start over', 'Empezar de nuevo')}
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Disclaimer t={t} />
    </div>
  );
}

// ── Extracted helper components ──

function ReadOnlyHeader({ session, lang, isAdapted, t }: { session: Session; lang: string; isAdapted: boolean; t: (en: string, es: string) => string }) {
  return (
    <>
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          {lang === 'es' ? session.sessionType_es : session.sessionType}
          {isAdapted && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 align-middle font-medium">
              {t('Adapted', 'Adaptado')}
            </span>
          )}
        </h2>
        <p className="text-muted text-xs">
          {lang === 'es' ? session.dayName_es : session.dayName} — {session.date} — ~{session.duration} min
          <a href="/program" className="ml-1.5 text-fuchsia-400/60 hover:text-fuchsia-400 transition-colors">
            &rarr; {t('Program', 'Programa')}
          </a>
        </p>
      </div>
    </>
  );
}

function Disclaimer({ t }: { t: (en: string, es: string) => string }) {
  return (
    <p className="text-muted/60 text-xs border-t border-border pt-4">
      {t(
        'This is not medical advice. If you experience sharp pain, dizziness, chest pain, or any symptom that concerns you — stop and consult a healthcare professional immediately.',
        'Esto no es consejo medico. Si experimentas dolor agudo, mareos, dolor en el pecho, o cualquier sintoma preocupante — para y consulta a un profesional de la salud inmediatamente.'
      )}
    </p>
  );
}
