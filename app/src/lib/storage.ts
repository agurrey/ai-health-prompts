import type { Level, Equipment } from '@/data/exercises';
import { calculateTotalXP, getStreakFreezeState } from '@/lib/gamification';
import { syncWorkout, syncExerciseLogs, syncAchievement, postFeedEvent, isCommunityUser } from '@/lib/sync';

const STORAGE_KEY = 'hormesis_data';
const CURRENT_VERSION = 2;

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

export interface PersonalRecord {
  exerciseId: string;
  weightKg: number;
  weightRaw: string;
  date: string;
  improvementKg?: number;
}

export interface AchievementUnlock {
  id: string;
  unlockedAt: string;
}

interface HormesisData {
  version: number;
  level: Level;
  equipment?: Equipment[];
  completedWorkouts: CompletedWorkout[];
  exerciseLog: ExerciseLogEntry[];
  // v2 additions:
  xp: number;
  xpLevel: number;
  achievements: AchievementUnlock[];
  personalRecords: PersonalRecord[];
  freezeTokens: number;
}

function defaultData(): HormesisData {
  return {
    version: CURRENT_VERSION,
    level: 2,
    completedWorkouts: [],
    exerciseLog: [],
    xp: 0,
    xpLevel: 0,
    achievements: [],
    personalRecords: [],
    freezeTokens: 0,
  };
}

function migrateIfNeeded(data: HormesisData): HormesisData {
  if (data.version >= 2) return data;
  // v1 → v2: add gamification fields, retroactively compute XP
  const { totalXP, level } = calculateTotalXP(data.completedWorkouts, data.exerciseLog);
  return {
    ...data,
    version: 2,
    xp: totalXP,
    xpLevel: level,
    achievements: [],
    personalRecords: [],
    freezeTokens: 0,
  };
}

export function loadData(): HormesisData {
  if (typeof window === 'undefined') return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as HormesisData;
    if (!parsed.version) return defaultData();
    const migrated = migrateIfNeeded(parsed);
    if (migrated.version !== parsed.version) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
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
  // Sync to Supabase + post feed event if community user (non-blocking)
  isCommunityUser().then(is => {
    if (is) {
      const xpData = getXP();
      syncWorkout({ date, level, sessionType, completedAt: Date.now() }, xpData.xp).catch(() => {});
      postFeedEvent('workout', { session_type: sessionType }).catch(() => {});
    }
  });
  // Award freeze token on 7-day streak milestones (capped at 2)
  const streak = getStreak();
  if (streak.current > 0 && streak.current % 7 === 0) {
    const tokens = getFreezeTokens();
    if (tokens < 2) setFreezeTokens(tokens + 1);
    // Post streak milestone to feed (non-blocking)
    isCommunityUser().then(is => {
      if (is) {
        postFeedEvent('streak', { streak_days: streak.current }).catch(() => {});
      }
    });
  }
}

export function isWorkoutDone(date: string): boolean {
  return loadData().completedWorkouts.some(w => w.date === date);
}

export function logExercise(entry: ExerciseLogEntry): void {
  const data = loadData();
  // Replace existing entry for same exercise + date
  const idx = data.exerciseLog.findIndex(e => e.exerciseId === entry.exerciseId && e.date === entry.date);
  if (idx >= 0) {
    data.exerciseLog[idx] = entry;
  } else {
    data.exerciseLog.push(entry);
  }
  saveData(data);
  isCommunityUser().then(is => {
    if (is) {
      syncExerciseLogs([entry]).catch(() => {});
    }
  });
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
  isCommunityUser().then(is => {
    if (is) {
      syncExerciseLogs(entries).catch(() => {});
    }
  });
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

export function getStreak(): { current: number; longest: number; freezeActive: boolean } {
  const dates = new Set(getCompletedDates());
  if (dates.size === 0) return { current: 0, longest: 0, freezeActive: false };

  const todayStr = fmt(new Date());
  const freezeTokens = getFreezeTokens();
  const freezeState = getStreakFreezeState({ todayStr, completedDates: dates, freezeTokens });

  // If freeze is active: consume the token and treat today as done
  if (freezeState.freezeActive) {
    setFreezeTokens(freezeState.tokensRemaining);
    dates.add(todayStr);
  }

  // Current streak: count back from today
  let current = 0;
  const d = new Date(todayStr + 'T00:00:00Z');
  if (dates.has(fmt(d))) {
    current = 1;
    d.setUTCDate(d.getUTCDate() - 1);
  } else {
    // Haven't done today yet — check from yesterday
    d.setUTCDate(d.getUTCDate() - 1);
    if (!dates.has(fmt(d))) return { current: 0, longest: longestStreak(dates), freezeActive: false };
    current = 1;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  while (dates.has(fmt(d))) {
    current++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  return { current, longest: Math.max(current, longestStreak(dates)), freezeActive: freezeState.freezeActive };
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
    // Accept both v1 and v2 imports — migrate if needed on next loadData()
    saveData(data);
    return true;
  } catch {
    return false;
  }
}

export function getXP(): { xp: number; xpLevel: number } {
  const data = loadData();
  return { xp: data.xp, xpLevel: data.xpLevel };
}

export function addXP(amount: number, newLevel: number): void {
  const data = loadData();
  data.xp = (data.xp ?? 0) + amount;
  data.xpLevel = newLevel;
  saveData(data);
}

export function getAchievements(): AchievementUnlock[] {
  return loadData().achievements ?? [];
}

export function addAchievement(id: string): void {
  const data = loadData();
  if (!data.achievements) data.achievements = [];
  if (!data.achievements.some(a => a.id === id)) {
    data.achievements.push({ id, unlockedAt: new Date().toISOString().slice(0, 10) });
    saveData(data);
    isCommunityUser().then(is => {
      if (is) {
        syncAchievement(id, new Date().toISOString().slice(0, 10)).catch(() => {});
        postFeedEvent('achievement', { achievement_id: id }).catch(() => {});
      }
    });
  }
}

export function getPersonalRecords(): PersonalRecord[] {
  return loadData().personalRecords ?? [];
}

export function savePersonalRecord(pr: PersonalRecord): void {
  const data = loadData();
  if (!data.personalRecords) data.personalRecords = [];
  const idx = data.personalRecords.findIndex(r => r.exerciseId === pr.exerciseId);
  if (idx >= 0) {
    data.personalRecords[idx] = pr;
  } else {
    data.personalRecords.push(pr);
  }
  saveData(data);
  isCommunityUser().then(is => {
    if (is) {
      postFeedEvent('pr', { exercise_id: pr.exerciseId }).catch(() => {});
    }
  });
}

export function getFreezeTokens(): number {
  return loadData().freezeTokens ?? 0;
}

export function setFreezeTokens(count: number): void {
  const data = loadData();
  data.freezeTokens = Math.min(2, Math.max(0, count));
  saveData(data);
}
