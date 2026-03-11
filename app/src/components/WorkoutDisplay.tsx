'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/lib/generator';
import type { Restriction, Equipment } from '@/data/exercises';
import { useI18n } from '@/lib/i18n';
import { isWorkoutDone, markWorkoutDone, getXP, addXP, getAchievements, addAchievement, getPersonalRecords, getStreak, loadData } from '@/lib/storage';
import type { ExerciseLogEntry, PersonalRecord } from '@/lib/storage';
import { computeXP, getLevelFromXP, type XPGain } from '@/lib/gamification';
import { checkAchievements, ACHIEVEMENTS } from '@/lib/achievements';
import { exercises } from '@/data/exercises';
import ExerciseLogPanel from './ExerciseLogPanel';
import AdaptPanel from './AdaptPanel';
import XPGainToast from './XPGainToast';
import AchievementToast, { type ToastItem } from './AchievementToast';

const YTIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

function DemoLink({ search, label }: { search: string; label: string }) {
  return (
    <a
      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(search)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-xl bg-card-elevated text-muted text-xs font-semibold hover:text-foreground transition-colors"
    >
      <YTIcon />
      {label}
    </a>
  );
}

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
  onSwapStrength?: (index: number) => void;
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

type ToastQueueItem =
  | { type: 'xp'; gain: XPGain }
  | { type: 'achievement-pr'; item: ToastItem };

export default function WorkoutDisplay({
  session,
  onSwapStrength,
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
  const [done, setDone] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [toastQueue, setToastQueue] = useState<ToastQueueItem[]>([]);

  const isAdapted = restrictions.length > 0 || equipmentOverride !== null || shortMode;

  useEffect(() => {
    setDone(isWorkoutDone(session.date));
    setShowLog(false);
  }, [session.date]);

  const handleWorkoutComplete = useCallback((prCount: number, newPRs: PersonalRecord[]) => {
    // 1. Mark workout done
    markWorkoutDone(session.date, session.strength[0]?.exercise.level ?? 2, lang === 'es' ? session.sessionType_es : session.sessionType);

    // 2. Compute XP (load fresh data after markWorkoutDone persisted the workout)
    const { xp: currentXP } = getXP();
    const freshData = loadData();
    const gain = computeXP({
      workout: { date: session.date, level: session.strength[0]?.exercise.level ?? 2, sessionType: session.sessionType, completedAt: Date.now() },
      exerciseLog: freshData.exerciseLog.filter(e => e.date === session.date),
      allWorkouts: freshData.completedWorkouts,
      prCount,
    });

    // 3. Persist XP
    const newTotalXP = currentXP + gain.total;
    const newLevel = getLevelFromXP(newTotalXP);
    addXP(gain.total, newLevel);

    // 4. Check achievements
    const streak = getStreak();
    const allAchievements = getAchievements();
    const allWorkoutsNow = loadData().completedWorkouts;
    const allLogNow = loadData().exerciseLog;
    const workoutsWithLogs = allWorkoutsNow.filter(w =>
      allLogNow.some(e => e.date === w.date && e.weight && e.weight.trim() !== '')
    ).length;
    const newAchievementIds = checkAchievements({
      completedWorkouts: allWorkoutsNow,
      exerciseLog: allLogNow,
      unlockedIds: allAchievements.map(a => a.id),
      currentStreak: streak.current,
      totalPRs: getPersonalRecords().length,
      xpLevel: newLevel,
      workoutsWithLogs,
      completedAt: Date.now(),
      isAdapted: restrictions.length > 0 || equipmentOverride !== null || shortMode,
    });
    for (const id of newAchievementIds) {
      addAchievement(id);
    }

    // 5. Queue toasts
    const toastsToShow: ToastQueueItem[] = [];
    toastsToShow.push({ type: 'xp', gain });
    for (const pr of newPRs) {
      const ex = exercises.find(e => e.id === pr.exerciseId);
      if (ex) toastsToShow.push({ type: 'achievement-pr', item: { type: 'pr', pr, exerciseName: ex.name } });
    }
    for (const id of newAchievementIds) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) toastsToShow.push({ type: 'achievement-pr', item: { type: 'achievement', achievement: ach } });
    }
    setToastQueue(toastsToShow);

    // 6. Update UI state
    setDone(true);
    setShowLog(false);
    onDone?.();
  }, [session, lang, restrictions, equipmentOverride, shortMode, onDone]);

  return (
    <div className="font-mono text-sm leading-relaxed space-y-6">
      {/* Phase banner */}
      <a href="/program" className="block text-center px-4 py-2.5 rounded-2xl bg-fuchsia-500/10 border-2 border-fuchsia-500/20 hover:bg-fuchsia-500/15 transition-colors">
        <p className="text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
          {lang === 'es' ? session.phase.label_es : session.phase.label}
          <span className="text-fuchsia-400/50 font-normal ml-1.5">
            {lang === 'es' ? `dia ${session.phase.dayInWeek}/7` : `day ${session.phase.dayInWeek}/7`}
          </span>
        </p>
        <p className="text-fuchsia-400/60 text-xs mt-0.5">
          {lang === 'es' ? session.phase.description_es : session.phase.description}
          <span className="ml-1 text-fuchsia-400/40">→</span>
        </p>
      </a>

      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-foreground">
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

      {/* Warm-up — GREEN */}
      {session.warmup.exercises.length > 0 && (
        <div className="border-2 border-emerald-500/40 rounded-2xl overflow-hidden bg-emerald-500/5">
          <div className="h-0.5 bg-emerald-500/60" />
          <div className="p-4">
          <h3 className="text-emerald-400 font-extrabold mb-1 text-lg uppercase tracking-widest">
            {t('Warm-up', 'Calentamiento')}
          </h3>
          <p className="text-emerald-400 font-bold text-sm mb-1">
            {lang === 'es' ? session.warmup.format.name_es : session.warmup.format.name}
          </p>
          <p className="text-emerald-400/60 text-xs mb-3">
            {lang === 'es' ? session.warmup.format.detail_es : session.warmup.format.detail}
          </p>
          <ul className="space-y-2">
            {session.warmup.exercises.map((w, i) => (
              <li key={i} className="pl-4 border-l-2 border-emerald-500/30 rounded-xl bg-card-elevated/50 py-2 pr-2">
                <span className="text-foreground">{w.exercise.name}</span>
                <span className="text-muted"> — {w.exercise.prescription}</span>
                <p className="text-muted text-xs mt-0.5">
                  {lang === 'es' ? w.exercise.cue_es : w.exercise.cue}
                </p>
                {w.exercise.demoSearch && (
                  <DemoLink search={w.exercise.demoSearch} label={t('Demo', 'Demo')} />
                )}
              </li>
            ))}
          </ul>
          </div>
        </div>
      )}

      {/* Strength — RED */}
      {session.strength.length > 0 && (
        <div className="border-2 border-red-500/40 rounded-2xl overflow-hidden bg-red-500/5">
          <div className="h-0.5 bg-red-500/60" />
          <div className="p-4">
          <h3 className="text-red-400 font-extrabold mb-3 text-lg uppercase tracking-widest">
            {t('Strength', 'Fuerza')}
          </h3>
          <div className="space-y-4">
            {session.strength.map((item, i) => (
              <div key={i} className="pl-4 border-l-2 border-red-500/30 rounded-xl bg-card-elevated/50 py-2 pr-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-foreground font-medium">{item.exercise.name}</span>
                  {onSwapStrength && (
                    <button
                      onClick={() => onSwapStrength(i)}
                      className="ml-1 px-2 py-1 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                      aria-label={t('Swap exercise', 'Cambiar ejercicio')}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4v6h6" />
                        <path d="M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
                      </svg>
                      {t('swap', 'cambiar')}
                    </button>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">
                    {lang === 'es' ? item.protocol_es : item.protocol}
                  </span>
                </div>
                <p className="text-red-400 text-xs mt-1">
                  {item.sets}x{item.reps} @ {item.load} | {t('Rest', 'Descanso')}: {item.rest}
                  {item.tempo && ` | Tempo: ${item.tempo}`}
                </p>
                <p className="text-muted text-xs mt-1">
                  {lang === 'es' ? item.protocolNote_es : item.protocolNote}
                </p>
                <p className="text-muted text-xs">
                  {lang === 'es' ? item.exercise.cue_es : item.exercise.cue}
                </p>
                <DemoLink search={item.exercise.demoSearch} label={t('Demo', 'Demo')} />
                {lastLogs[item.exercise.id] && lastLogs[item.exercise.id]!.weight && (
                  <p className="text-muted text-xs mt-1.5 font-semibold">
                    {t('Last', 'Anterior')}: {lastLogs[item.exercise.id]!.weight} x {lastLogs[item.exercise.id]!.reps}
                    {' '}({formatLogDate(lastLogs[item.exercise.id]!.date, lang)})
                  </p>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* WOD — ORANGE */}
      <div className="border-2 border-orange-500/40 rounded-2xl overflow-hidden bg-orange-500/5">
        <div className="h-0.5 bg-orange-500/60" />
        <div className="p-4">
        <h3 className="text-orange-400 font-extrabold mb-1 text-lg uppercase tracking-widest">
          WOD
        </h3>

        <p className="text-foreground font-bold text-sm mb-1">
          {lang === 'es' ? session.conditioning.formatName_es : session.conditioning.formatName}
          <span className="text-orange-400 ml-2">
            | Cap: {session.conditioning.timecap}
          </span>
        </p>

        {/* Format description */}
        <p className="text-orange-400/60 text-xs mb-2">
          {lang === 'es' ? session.conditioning.formatDescription_es : session.conditioning.formatDescription}
        </p>

        {/* Intensity + Volume tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">
            {lang === 'es' ? session.conditioning.intensity_es : session.conditioning.intensity}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400/80 border border-orange-500/15">
            {lang === 'es' ? session.conditioning.volume_es : session.conditioning.volume}
          </span>
        </div>

        <div className="space-y-2 mb-3">
          {session.conditioning.movements.map((m, i) => (
            <div key={i} className="text-sm">
              <span className="font-mono font-bold text-orange-400">
                {m.reps}
              </span>
              <span className="text-foreground ml-2">{m.name}</span>
              {m.load !== 'BW' && (
                <span className="text-muted ml-1">({m.load})</span>
              )}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(m.demoSearch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 ml-2 text-xs text-orange-400/60 hover:text-orange-400 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                demo
              </a>
            </div>
          ))}
        </div>

        <p className="text-muted text-xs italic">
          {lang === 'es' ? session.conditioning.note_es : session.conditioning.note}
        </p>

        {session.conditioning.scalingNote && (
          <p className="text-orange-400/60 text-xs mt-2">
            {lang === 'es' ? session.conditioning.scalingNote_es : session.conditioning.scalingNote}
          </p>
        )}
        </div>
      </div>

      {/* Strategy */}
      <div className="border-2 border-border rounded-2xl p-4 bg-card">
        <h3 className="text-foreground font-extrabold mb-2 text-lg uppercase tracking-widest">
          {t('Strategy', 'Estrategia')}
        </h3>
        <p className="text-muted text-xs leading-relaxed">
          {lang === 'es' ? session.strategy_es : session.strategy}
        </p>
      </div>

      {/* Done Button */}
      {!readOnly && !done && !showLog && (
        <button
          onClick={() => setShowLog(true)}
          className="w-full px-4 py-4 bg-accent text-background font-bold rounded-2xl hover:brightness-110 transition-all cursor-pointer text-lg btn-playful done-button"
        >
          {t('Done', 'Hecho')}
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

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toastQueue.slice(0, 3).map((toast, i) => {
          if (toast.type === 'xp') {
            return (
              <XPGainToast
                key={`xp-${i}`}
                gain={toast.gain}
                onDismiss={() => setToastQueue(q => q.slice(1))}
              />
            );
          }
          return (
            <AchievementToast
              key={`ach-${i}`}
              item={toast.item}
              onDismiss={() => setToastQueue(q => q.slice(1))}
            />
          );
        })}
      </div>

      {/* Completed state */}
      {!readOnly && done && (
        <div className="w-full px-4 py-4 bg-success/15 border-2 border-success/30 text-success font-extrabold rounded-2xl text-center text-lg flex items-center justify-center gap-2 glow-success workout-completed-glow">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t('Completed', 'Completado')}
        </div>
      )}

      {/* Daily steps — BLUE */}
      <div className="flex items-center gap-3 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 px-4 py-3">
        <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <p className="text-blue-400 text-sm font-semibold">
          {t('Walk 7,000-10,000 steps today. Non-negotiable.', 'Camina 7.000-10.000 pasos hoy. No negociable.')}
        </p>
      </div>

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
