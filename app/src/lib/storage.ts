import type { Level, Equipment } from '@/data/exercises';

const STORAGE_KEY = 'hormesis_data';

export interface CompletedWorkout {
  date: string;
  level: Level;
  sessionType: string;
  completedAt: number;
}

export interface ExerciseLogEntry {
  exerciseId: string;
  date: string;
  weight: string;
  reps: string;
  sets: number;
  notes?: string;
}

interface HormesisData {
  version: number;
  level: Level;
  equipment?: Equipment[];
  completedWorkouts: CompletedWorkout[];
  exerciseLog: ExerciseLogEntry[];
}

function defaultData(): HormesisData {
  return {
    version: 2,
    level: 2,
    completedWorkouts: [],
    exerciseLog: [],
  };
}

export function loadData(): HormesisData {
  if (typeof window === 'undefined') return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as HormesisData;
    if (!parsed.version) return defaultData();
    return parsed;
  } catch {
    return defaultData();
  }
}

export function saveData(data: HormesisData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLevel(): Level {
  return loadData().level;
}

export function setLevel(level: Level): void {
  const data = loadData();
  data.level = level;
  saveData(data);
}

export function getEquipment(): Equipment[] | null {
  const data = loadData();
  return data.equipment ?? null;
}

export function setEquipment(equipment: Equipment[]): void {
  const data = loadData();
  data.equipment = equipment;
  saveData(data);
}

export function markWorkoutDone(date: string, level: Level, sessionType: string): void {
  const data = loadData();
  const existing = data.completedWorkouts.find(w => w.date === date);
  if (existing) {
    existing.level = level;
    existing.sessionType = sessionType;
    existing.completedAt = Date.now();
  } else {
    data.completedWorkouts.push({ date, level, sessionType, completedAt: Date.now() });
  }
  saveData(data);
}

export function isWorkoutDone(date: string): boolean {
  return loadData().completedWorkouts.some(w => w.date === date);
}

export function logExercise(entry: ExerciseLogEntry): void {
  const data = loadData();
  const idx = data.exerciseLog.findIndex(e => e.exerciseId === entry.exerciseId && e.date === entry.date);
  if (idx >= 0) {
    data.exerciseLog[idx] = entry;
  } else {
    data.exerciseLog.push(entry);
  }
  saveData(data);
}

export function logExercises(entries: ExerciseLogEntry[]): void {
  const data = loadData();
  for (const entry of entries) {
    const idx = data.exerciseLog.findIndex(e => e.exerciseId === entry.exerciseId && e.date === entry.date);
    if (idx >= 0) {
      data.exerciseLog[idx] = entry;
    } else {
      data.exerciseLog.push(entry);
    }
  }
  saveData(data);
}

export function getLastLog(exerciseId: string): ExerciseLogEntry | null {
  const data = loadData();
  const entries = data.exerciseLog
    .filter(e => e.exerciseId === exerciseId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return entries[0] || null;
}

export function getCompletedDates(): string[] {
  return loadData().completedWorkouts.map(w => w.date);
}

export function getCompletedWorkout(date: string): CompletedWorkout | undefined {
  return loadData().completedWorkouts.find(w => w.date === date);
}

export function getStreak(): { current: number; longest: number } {
  const dates = new Set(getCompletedDates());
  if (dates.size === 0) return { current: 0, longest: 0 };

  const todayStr = fmt(new Date());

  // Current streak: count back from today
  let current = 0;
  const d = new Date(todayStr + 'T00:00:00Z');
  if (dates.has(fmt(d))) {
    current = 1;
    d.setUTCDate(d.getUTCDate() - 1);
  } else {
    d.setUTCDate(d.getUTCDate() - 1);
    if (!dates.has(fmt(d))) return { current: 0, longest: longestStreak(dates) };
    current = 1;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  while (dates.has(fmt(d))) {
    current++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  return { current, longest: Math.max(current, longestStreak(dates)) };
}

function longestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const sorted = Array.from(dates).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  return longest;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json) as HormesisData;
    if (!data.version || !Array.isArray(data.completedWorkouts) || !Array.isArray(data.exerciseLog)) {
      return false;
    }
    saveData(data);
    return true;
  } catch {
    return false;
  }
}
