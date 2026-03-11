'use client';

import { useEffect, useState, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { generateSession, getLoadLabel, Session } from '@/lib/generator';
import { getTodayString, createSeededRandom, seededShuffle } from '@/lib/seed';
import { getExercisesByPattern, filterByLevel, filterByRestrictions } from '@/data/exercises';
import type { Level, Equipment, Restriction } from '@/data/exercises';
import { useI18n } from '@/lib/i18n';
import { getLevel, setLevel as persistLevel, getEquipment, setEquipment as persistEquipment, getLastLog, isWorkoutDone, type ExerciseLogEntry } from '@/lib/storage';
import WorkoutDisplay from './WorkoutDisplay';
import EquipmentSetup from './EquipmentSetup';
import CatMascot from './CatMascot';

const LEVELS: { value: Level; en: string; es: string }[] = [
  { value: 1, en: 'Beginner', es: 'Principiante' },
  { value: 2, en: 'Intermediate', es: 'Intermedio' },
  { value: 3, en: 'Advanced', es: 'Avanzado' },
];

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dayNames = lang === 'es'
    ? ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = lang === 'es'
    ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${dayNames[d.getUTCDay()]} ${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;
}

export default function WorkoutGenerator() {
  const { t, lang } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [level, setLevel] = useState<Level>(() => getLevel());
  const [equipment, setEquipment] = useState<Equipment[] | null>(() => getEquipment());
  const [needsSetup, setNeedsSetup] = useState(() => getEquipment() === null);
  const [showEquipmentSettings, setShowEquipmentSettings] = useState(false);
  const [swapCounts, setSwapCounts] = useState<Record<number, number>>({});
  const [lastLogs, setLastLogs] = useState<Record<string, ExerciseLogEntry | null>>({});
  const [viewDate, setViewDate] = useState(() => getTodayString());
  const [todayDone, setTodayDone] = useState(false);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [equipmentOverride, setEquipmentOverride] = useState<Equipment[] | null>(null);
  const [shortMode, setShortMode] = useState(false);

  const today = getTodayString();
  const tomorrow = shiftDate(today, 1);
  const isToday = viewDate === today;
  const isTomorrow = viewDate === tomorrow;
  const isFuture = viewDate > today;
  const readOnly = !isToday;

  // Check if today's workout is done (for lock logic)
  useEffect(() => {
    setTodayDone(isWorkoutDone(today));
  }, [today, viewDate]);

  // Listen for workout completion to update lock state
  useEffect(() => {
    const handleStorage = () => setTodayDone(isWorkoutDone(today));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [today]);

  useEffect(() => {
    if (needsSetup) return;
    const effectiveEquipment = equipmentOverride ?? equipment;
    const result = generateSession(viewDate, level, effectiveEquipment, restrictions, shortMode);
    setSession(result);
    setSwapCounts({});
    if (isToday) persistLevel(level);
    const logs: Record<string, ExerciseLogEntry | null> = {};
    for (const s of result.strength) {
      logs[s.exercise.id] = getLastLog(s.exercise.id);
    }
    setLastLogs(logs);
    track('workout_generated', { date: viewDate, level: String(level) });
  }, [level, viewDate, isToday, equipment, needsSetup, restrictions, equipmentOverride, shortMode]);

  const handleSwapStrength = useCallback((index: number) => {
    if (!session) return;

    const current = session.strength[index];
    const pattern = current.exercise.pattern;
    const effectiveEquipment = equipmentOverride ?? equipment;

    let pool = getExercisesByPattern(pattern);
    pool = filterByLevel(pool, level);
    if (effectiveEquipment) {
      const available = new Set<string>(['bodyweight', ...effectiveEquipment]);
      pool = pool.filter(e => e.equipment.every(eq => available.has(eq)));
      const eqRestrictions: Restriction[] = [];
      if (!effectiveEquipment.includes('pull_up_bar')) eqRestrictions.push('no_pullup_bar');
      if (eqRestrictions.length > 0) pool = filterByRestrictions(pool, eqRestrictions);
    }
    if (restrictions.length > 0) pool = filterByRestrictions(pool, restrictions);

    const usedIds = new Set(session.strength.map(s => s.exercise.id));
    pool = pool.filter(e => !usedIds.has(e.id));

    if (pool.length === 0) return;

    const nextSwap = (swapCounts[index] || 0) + 1;
    const random = createSeededRandom(`${session.date}-swap-${index}-${nextSwap}`);
    const shuffled = seededShuffle(pool, random);
    const replacement = shuffled[0];

    const newStrength = [...session.strength];
    newStrength[index] = {
      ...current,
      exercise: replacement,
      load: getLoadLabel(replacement),
    };

    setSwapCounts({ ...swapCounts, [index]: nextSwap });
    setSession({ ...session, strength: newStrength });
    setLastLogs((prev) => ({
      ...prev,
      [replacement.id]: getLastLog(replacement.id),
    }));
  }, [session, level, swapCounts, equipment, equipmentOverride, restrictions]);

  // Navigation logic
  const canGoNext = isTomorrow
    ? false // max peek = 1 day ahead
    : isToday
      ? todayDone // locked until today is done
      : viewDate < today; // past dates can always go forward
  const nextLocked = isToday && !todayDone;

  const handlePrev = () => {
    setViewDate(shiftDate(viewDate, -1));
    setRestrictions([]);
    setEquipmentOverride(null);
    setShortMode(false);
  };
  const handleNext = () => {
    if (canGoNext) {
      setViewDate(shiftDate(viewDate, 1));
      setRestrictions([]);
      setEquipmentOverride(null);
      setShortMode(false);
    }
  };
  const handleToday = () => {
    setViewDate(today);
    setRestrictions([]);
    setEquipmentOverride(null);
    setShortMode(false);
  };

  // Re-check todayDone when coming back to today view (user may have completed it)
  const handleDoneCallback = useCallback(() => {
    setTodayDone(true);
  }, []);

  const handleAdapt = useCallback((newRestrictions: Restriction[], newEquipmentOverride: Equipment[] | null, newShortMode: boolean) => {
    setRestrictions(newRestrictions);
    setEquipmentOverride(newEquipmentOverride);
    setShortMode(newShortMode);
  }, []);

  const handleResetAdapt = useCallback(() => {
    setRestrictions([]);
    setEquipmentOverride(null);
    setShortMode(false);
  }, []);

  function handleEquipmentSave(eq: Equipment[]) {
    persistEquipment(eq);
    setEquipment(eq);
    setNeedsSetup(false);
    setShowEquipmentSettings(false);
  }

  if (needsSetup) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <CatMascot pose="stretching" size={100} />
        </div>
        <EquipmentSetup onSave={handleEquipmentSave} />
      </div>
    );
  }

  if (showEquipmentSettings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {t('Equipment', 'Equipamiento')}
          </h3>
          <button
            onClick={() => setShowEquipmentSettings(false)}
            className="text-muted hover:text-foreground text-xs cursor-pointer"
          >
            {t('Cancel', 'Cancelar')}
          </button>
        </div>
        <EquipmentSetup initial={equipment ?? undefined} onSave={handleEquipmentSave} mode="settings" />
      </div>
    );
  }

  if (!session) return (
    <div className="flex flex-col items-center gap-2 py-8">
      <CatMascot pose="warmup" size={80} />
      <p className="text-muted text-sm font-semibold">{t('Loading...', 'Cargando...')}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <div className="flex gap-1 p-1 bg-card rounded-2xl border-2 border-border">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                level === l.value
                  ? 'bg-accent/20 text-accent border-2 border-accent'
                  : 'text-muted hover:text-foreground border-2 border-transparent'
              }`}
            >
              {t(l.en, l.es)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowEquipmentSettings(true)}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-card-elevated transition-colors cursor-pointer"
          aria-label={t('Equipment settings', 'Configurar equipamiento')}
          title={t('Equipment', 'Equipamiento')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrev}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-card-elevated transition-colors cursor-pointer"
          aria-label={t('Previous day', 'Dia anterior')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-center min-w-[140px]">
          <p className={`text-sm font-medium ${isToday ? 'text-foreground' : 'text-accent'}`}>
            {isToday
              ? t('Today', 'Hoy')
              : isTomorrow
                ? t('Tomorrow', 'Mañana')
                : formatDateLabel(viewDate, lang)}
          </p>
          {!isToday && (
            <p className="text-muted text-xs">{formatDateLabel(viewDate, lang)}</p>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`p-2 rounded-xl transition-colors ${
            canGoNext
              ? 'text-muted hover:text-foreground hover:bg-card-elevated cursor-pointer'
              : 'text-muted/30 cursor-not-allowed'
          }`}
          aria-label={
            nextLocked
              ? t('Complete today to unlock', 'Completa hoy para desbloquear')
              : t('Next day', 'Dia siguiente')
          }
          title={
            nextLocked
              ? t('Complete today to unlock', 'Completa hoy para desbloquear')
              : undefined
          }
        >
          {nextLocked ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Lock hint */}
      {nextLocked && isToday && (
        <p className="text-center text-muted/50 text-xs font-semibold">
          {t('Complete today to peek tomorrow', 'Completa hoy para ver mañana')}
        </p>
      )}

      {/* Today button when viewing another date */}
      {!isToday && (
        <div className="flex justify-center">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-accent border-2 border-accent/30 rounded-xl hover:bg-accent/10 transition-colors cursor-pointer"
          >
            {t('Back to today', 'Volver a hoy')}
          </button>
        </div>
      )}

      {/* Future badge */}
      {isFuture && (
        <div className="text-center px-4 py-2 rounded-2xl bg-card border-2 border-border">
          <p className="text-muted text-xs font-semibold">
            {t('Preview — read only', 'Vista previa — solo lectura')}
          </p>
        </div>
      )}

      <WorkoutDisplay
        session={session}
        onSwapStrength={readOnly ? undefined : handleSwapStrength}
        lastLogs={lastLogs}
        readOnly={readOnly}
        onDone={handleDoneCallback}
        restrictions={restrictions}
        equipmentOverride={equipmentOverride}
        shortMode={shortMode}
        savedEquipment={equipment ?? []}
        onAdapt={readOnly ? undefined : handleAdapt}
        onResetAdapt={readOnly ? undefined : handleResetAdapt}
      />
    </div>
  );
}
