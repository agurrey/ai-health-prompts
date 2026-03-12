'use client';

import { useEffect, useState, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { generateSession, Session } from '@/lib/generator';
import { getTodayString } from '@/lib/seed';
import type { Level, Equipment, Restriction } from '@/data/exercises';
import { useI18n } from '@/lib/i18n';
import { getLevel, setLevel as persistLevel, getEquipment, setEquipment as persistEquipment, getLastLog, isWorkoutDone, type ExerciseLogEntry } from '@/lib/storage';
import WorkoutDisplay from './WorkoutDisplay';
import EquipmentSetup from '@/components/EquipmentSetup';
import StreakWidget from './StreakWidget';

const LEVELS: { value: Level; en: string; es: string }[] = [
  { value: 1, en: 'Beginner', es: 'Principiante' },
  { value: 2, en: 'Intermediate', es: 'Intermedio' },
  { value: 3, en: 'Advanced', es: 'Avanzado' },
];

export default function WorkoutGenerator() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [level, setLevel] = useState<Level>(() => getLevel());
  const [equipment, setEquipment] = useState<Equipment[] | null>(() => getEquipment());
  const [needsSetup, setNeedsSetup] = useState(() => getEquipment() === null);
  const [lastLogs, setLastLogs] = useState<Record<string, ExerciseLogEntry | null>>({});
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [equipmentOverride, setEquipmentOverride] = useState<Equipment[] | null>(null);
  const [shortMode, setShortMode] = useState(false);
  const [todayDone, setTodayDone] = useState(false);

  const today = getTodayString();

  useEffect(() => {
    if (needsSetup) return;
    const effectiveEquipment = equipmentOverride ?? equipment;
    const result = generateSession(today, level, effectiveEquipment, restrictions, shortMode);
    setSession(result);
    persistLevel(level);
    const logs: Record<string, ExerciseLogEntry | null> = {};
    for (const s of result.strength) {
      logs[s.exercise.id] = getLastLog(s.exercise.id);
    }
    setLastLogs(logs);
    track('workout_generated', { date: today, level: String(level) });
  }, [level, today, equipment, needsSetup, restrictions, equipmentOverride, shortMode]);

  useEffect(() => {
    setTodayDone(isWorkoutDone(today));
  }, [today, session]);

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
  }

  if (needsSetup) {
    return (
      <div className="space-y-4">
        <EquipmentSetup onSave={handleEquipmentSave} />
      </div>
    );
  }

  if (!session) return (
    <div className="flex flex-col items-center gap-2 py-8">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-muted text-sm font-semibold">{t('Loading...', 'Cargando...')}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <StreakWidget />

      <div className="flex justify-center">
        <div className="flex gap-1 p-1 bg-card rounded-lg border border-border">
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
      </div>

      <WorkoutDisplay
        session={session}
        lastLogs={lastLogs}
        onDone={handleDoneCallback}
        restrictions={restrictions}
        equipmentOverride={equipmentOverride}
        shortMode={shortMode}
        savedEquipment={equipment ?? []}
        onAdapt={handleAdapt}
        onResetAdapt={handleResetAdapt}
      />
    </div>
  );
}
