'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Session } from '@/lib/generator';
import type { Restriction, Equipment } from '@/data/exercises';
import { useI18n } from '@/lib/i18n';
import { isWorkoutDone, markWorkoutDone } from '@/lib/storage';
import type { ExerciseLogEntry } from '@/lib/storage';
import {
  type LinearFlowState,
  createLinearState,
  completeStep,
  skipStep,
  isBlockComplete,
  isWorkoutComplete,
  saveFlowState,
  loadFlowState,
} from '@/lib/workout-flow';
import { configFromWarmupPrescription, configFromStrengthRest, configFromWod } from '@/lib/timer-config';
import ExerciseCard from './ExerciseCard';
import WodCard from './WodCard';
import SectionLabel from './SectionLabel';
import CompletedStep from './CompletedStep';
import BlockCelebration from './BlockCelebration';
import FinalCelebration from './FinalCelebration';
import ExerciseLogPanel from './ExerciseLogPanel';
import AdaptPanel from './AdaptPanel';

function formatLogDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (lang === 'es') {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

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
  const [flow, setFlow] = useState<LinearFlowState>(() => {
    if (readOnly) return createLinearState(session);
    const saved = loadFlowState(session.date);
    if (saved && saved.steps.length === session.warmup.exercises.length + session.strength.length + 1) {
      return saved;
    }
    return createLinearState(session);
  });
  const [done, setDone] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isAdapted = restrictions.length > 0 || equipmentOverride !== null || shortMode;
  const warmupCount = session.warmup.exercises.length;
  const strengthCount = session.strength.length;
  const allComplete = isWorkoutComplete(flow);

  useEffect(() => {
    setDone(isWorkoutDone(session.date));
    setShowLog(false);
    if (readOnly) {
      setFlow(createLinearState(session));
    } else {
      const saved = loadFlowState(session.date);
      if (saved && saved.steps.length === session.warmup.exercises.length + session.strength.length + 1) {
        setFlow(saved);
      } else {
        setFlow(createLinearState(session));
      }
    }
  }, [session.date, session.warmup.exercises.length, session.strength.length, readOnly]);

  useEffect(() => {
    if (!readOnly) saveFlowState(flow);
  }, [flow, readOnly]);

  const handleComplete = useCallback(() => {
    setFlow(prev => completeStep(prev));
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }, []);

  const handleSkip = useCallback(() => {
    setFlow(prev => skipStep(prev));
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }, []);

  const handleWorkoutComplete = useCallback(() => {
    markWorkoutDone(session.date, session.strength[0]?.exercise.level ?? 2, lang === 'es' ? session.sessionType_es : session.sessionType);
    setDone(true);
    setShowLog(false);
    onDone?.();
  }, [session, lang, onDone]);

  // Build block data helpers
  const currentStep = flow.currentStep < flow.steps.length ? flow.steps[flow.currentStep] : null;
  const warmupDone = isBlockComplete(flow, 'warmup');
  const strengthDone = isBlockComplete(flow, 'strength');

  function renderBlock(type: 'warmup' | 'strength' | 'wod') {
    const blockSteps = flow.steps.filter(s => s.type === type);
    if (blockSteps.length === 0) return null;

    const count = type === 'wod' ? 1 : blockSteps.length;
    const blockComplete = isBlockComplete(flow, type);
    const elements: React.ReactNode[] = [];

    // Section label
    elements.push(<SectionLabel key={`label-${type}`} type={type} count={count} />);

    if (readOnly) {
      // Read-only: show all exercises as cards without actions
      return (
        <div key={type} className="space-y-3">
          {elements}
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
            />
          ) : blockSteps.map(step => {
            if (type === 'warmup') {
              const w = session.warmup.exercises[step.index];
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
                />
              );
            } else {
              const item = session.strength[step.index];
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
                  lastWeight={log?.weight ? `${log.weight} x ${log.reps}` : undefined}
                  lastDate={log?.date ? formatLogDate(log.date, lang) : undefined}
                />
              );
            }
          })}
        </div>
      );
    }

    // Interactive mode: completed steps + current card
    for (const step of blockSteps) {
      if (step.status === 'done' || step.status === 'skipped') {
        const name = type === 'warmup'
          ? session.warmup.exercises[step.index].exercise.name
          : type === 'strength'
          ? session.strength[step.index].exercise.name
          : 'WOD';
        elements.push(
          <CompletedStep key={`done-${type}-${step.index}`} name={name} status={step.status} />
        );
      }
    }

    // Current active card
    if (currentStep && currentStep.type === type && currentStep.status === 'current') {
      if (type === 'warmup') {
        const w = session.warmup.exercises[currentStep.index];
        elements.push(
          <div key="active-card" ref={cardRef}>
            <ExerciseCard
              name={w.exercise.name}
              prescription={w.exercise.prescription}
              cue={lang === 'es' ? w.exercise.cue_es : w.exercise.cue}
              demoSearch={w.exercise.demoSearch || w.exercise.name}
              color="emerald"
              onComplete={handleComplete}
              onSkip={handleSkip}
              timerConfig={configFromWarmupPrescription(w.exercise.prescription)}
            />
          </div>
        );
      } else if (type === 'strength') {
        const item = session.strength[currentStep.index];
        const log = lastLogs[item.exercise.id];
        elements.push(
          <div key="active-card" ref={cardRef}>
            <ExerciseCard
              name={item.exercise.name}
              prescription={`${item.sets}x${item.reps} @ ${item.load} | ${t('Rest', 'Descanso')}: ${item.rest}${item.tempo ? ` | Tempo: ${item.tempo}` : ''}`}
              cue={`${lang === 'es' ? item.protocolNote_es : item.protocolNote}\n${lang === 'es' ? item.exercise.cue_es : item.exercise.cue}`}
              demoSearch={item.exercise.demoSearch}
              color="red"
              onComplete={handleComplete}
              onSkip={handleSkip}
              timerConfig={configFromStrengthRest(item.rest)}
              lastWeight={log?.weight ? `${log.weight} x ${log.reps}` : undefined}
              lastDate={log?.date ? formatLogDate(log.date, lang) : undefined}
            />
          </div>
        );
      } else {
        elements.push(
          <div key="active-card" ref={cardRef}>
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
          </div>
        );
      }
    }

    // Block celebration
    if (blockComplete && type !== 'wod') {
      elements.push(<BlockCelebration key={`celeb-${type}`} block={type} />);
    }

    return (
      <div key={type} className="space-y-2">
        {elements}
      </div>
    );
  }

  return (
    <div className="font-mono text-sm leading-relaxed space-y-6">
      {/* Phase banner */}
      <a href="/program" className="block text-center px-4 py-2.5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 hover:bg-fuchsia-500/15 transition-colors">
        <p className="text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
          {lang === 'es' ? session.phase.label_es : session.phase.label}
          <span className="text-fuchsia-400/50 font-normal ml-1.5">
            {lang === 'es' ? `dia ${session.phase.dayInWeek}/7` : `day ${session.phase.dayInWeek}/7`}
          </span>
        </p>
        <p className="text-fuchsia-400/60 text-xs mt-0.5">
          {lang === 'es' ? session.phase.description_es : session.phase.description}
          <span className="ml-1 text-fuchsia-400/40">&rarr;</span>
        </p>
      </a>

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
        </p>
      </div>

      {/* Warmup block */}
      <AnimatePresence mode="wait">
        {warmupCount > 0 && renderBlock('warmup')}
      </AnimatePresence>

      {/* Strength block */}
      <AnimatePresence mode="wait">
        {strengthCount > 0 && renderBlock('strength')}
      </AnimatePresence>

      {/* WOD block */}
      <AnimatePresence mode="wait">
        {renderBlock('wod')}
      </AnimatePresence>

      {/* Final celebration */}
      {!readOnly && allComplete && !done && !showLog && (
        <FinalCelebration />
      )}

      {/* Strategy */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-foreground font-extrabold mb-2 text-lg uppercase tracking-widest">
          {t('Strategy', 'Estrategia')}
        </h3>
        <p className="text-muted text-xs leading-relaxed">
          {lang === 'es' ? session.strategy_es : session.strategy}
        </p>
      </div>

      {/* Done Button */}
      {!readOnly && allComplete && !done && !showLog && (
        <button
          onClick={() => setShowLog(true)}
          className="w-full px-4 py-4 bg-accent text-background font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer text-lg"
        >
          {t('Log & Finish', 'Registrar y Terminar')}
        </button>
      )}

      {/* Exercise Log Panel */}
      {!readOnly && showLog && !done && (
        <ExerciseLogPanel
          date={session.date}
          strength={session.strength}
          onComplete={handleWorkoutComplete}
        />
      )}

      {/* Completed state */}
      {!readOnly && done && (
        <div className="w-full px-4 py-4 bg-success/15 border border-success/30 text-success font-bold rounded-lg text-center text-lg flex items-center justify-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t('Completed', 'Completado')}
        </div>
      )}

      {/* Adapt Panel */}
      {!readOnly && onAdapt && onResetAdapt && (
        <AdaptPanel
          activeRestrictions={restrictions}
          equipmentOverride={equipmentOverride ?? null}
          shortMode={shortMode}
          savedEquipment={savedEquipment}
          onApply={onAdapt}
          onReset={onResetAdapt}
        />
      )}

      {/* Disclaimer */}
      <p className="text-muted/60 text-xs border-t border-border pt-4">
        {t(
          'This is not medical advice. If you experience sharp pain, dizziness, chest pain, or any symptom that concerns you — stop and consult a healthcare professional immediately.',
          'Esto no es consejo medico. Si experimentas dolor agudo, mareos, dolor en el pecho, o cualquier sintoma preocupante — para y consulta a un profesional de la salud inmediatamente.'
        )}
      </p>
    </div>
  );
}
