import type { CompletedWorkout, ExerciseLogEntry, PersonalRecord } from '@/lib/storage';

// ── Types ──

export interface XPGain {
  base: number;
  logsBonus: number;
  streakBonus: number;
  milestoneBonus: number;
  prBonus: number;
  total: number;
  breakdown: string;
  breakdown_es: string;
}

// ── Constants ──

const XP_BASE = 100;
const XP_WITH_LOGS = 50;
const XP_STREAK_PER_DAY = 20;
const XP_STREAK_CAP_DAYS = 7;
const XP_FIRST_WORKOUT = 200;
const XP_SEVEN_DAY_STREAK = 300;
const XP_MESOCYCLE = 1000;
const XP_PR = 50;

// index = level, LEVEL_THRESHOLDS[n] = cumulative XP to reach level n
// LEVEL_THRESHOLDS[10] = 6500 so xpForLevel(11) = 6500 + 1000 = 7500
const LEVEL_THRESHOLDS: number[] = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 6500];

// ── Helpers ──

export function getStreakDayForWorkout(date: string, allWorkoutDates: string[]): number {
  const sorted = [...allWorkoutDates].sort();
  const idx = sorted.indexOf(date);
  if (idx < 0) return 1;

  let streak = 1;
  for (let i = idx - 1; i >= 0; i--) {
    const curr = new Date(sorted[i + 1] + 'T00:00:00Z');
    const prev = new Date(sorted[i] + 'T00:00:00Z');
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function isMesocycleComplete(date: string, allWorkoutDates: string[]): boolean {
  const target = new Date(date + 'T00:00:00Z');
  const windowStart = new Date(target);
  windowStart.setUTCDate(windowStart.getUTCDate() - 27); // 28-day window inclusive

  const count = allWorkoutDates.filter(d => {
    const wd = new Date(d + 'T00:00:00Z');
    return wd >= windowStart && wd <= target;
  }).length;

  return count >= 28;
}

// ── Public Functions ──

export function computeXP(params: {
  workout: CompletedWorkout;
  exerciseLog: ExerciseLogEntry[];
  allWorkouts: CompletedWorkout[];
  prCount?: number;
}): XPGain {
  const { workout, exerciseLog, allWorkouts, prCount = 0 } = params;

  const base = XP_BASE;

  // Logs bonus: any log entry for this date with non-empty weight
  const hasLogs = exerciseLog.some(e => e.date === workout.date && e.weight !== '');
  const logsBonus = hasLogs ? XP_WITH_LOGS : 0;

  // Streak bonus
  const allDates = allWorkouts.map(w => w.date);
  const streakDay = getStreakDayForWorkout(workout.date, allDates);
  const cappedStreakDay = Math.min(streakDay, XP_STREAK_CAP_DAYS);
  const streakBonus = cappedStreakDay * XP_STREAK_PER_DAY;

  // Milestone bonuses
  let milestoneBonus = 0;
  const parts: string[] = [];
  const parts_es: string[] = [];

  if (allWorkouts.length === 1) {
    milestoneBonus += XP_FIRST_WORKOUT;
  }
  if (streakDay === 7) {
    milestoneBonus += XP_SEVEN_DAY_STREAK;
  }
  if (isMesocycleComplete(workout.date, allDates)) {
    milestoneBonus += XP_MESOCYCLE;
  }

  // PR bonus
  const prBonus = prCount * XP_PR;

  const total = base + logsBonus + streakBonus + milestoneBonus + prBonus;

  // Build breakdown strings
  parts.push(`${base} base`);
  parts_es.push(`${base} base`);
  if (logsBonus > 0) {
    parts.push(`${logsBonus} logs`);
    parts_es.push(`${logsBonus} registros`);
  }
  if (streakBonus > 0) {
    parts.push(`${streakBonus} streak (${streakDay}d)`);
    parts_es.push(`${streakBonus} racha (${streakDay}d)`);
  }
  if (milestoneBonus > 0) {
    parts.push(`${milestoneBonus} milestone`);
    parts_es.push(`${milestoneBonus} hito`);
  }
  if (prBonus > 0) {
    parts.push(`${prBonus} PR`);
    parts_es.push(`${prBonus} RM`);
  }

  return {
    base,
    logsBonus,
    streakBonus,
    milestoneBonus,
    prBonus,
    total,
    breakdown: parts.join(' + '),
    breakdown_es: parts_es.join(' + '),
  };
}

export function xpForLevel(n: number): number {
  if (n === 0) return 0;
  if (n <= 10) return LEVEL_THRESHOLDS[n];
  return 6500 + (n - 10) * 1000;
}

export function getLevelFromXP(totalXP: number): number {
  if (totalXP <= 0) return 0;
  let level = 0;
  const MAX_LEVEL = 99;
  for (let n = 1; n <= MAX_LEVEL; n++) {
    if (xpForLevel(n) <= totalXP) {
      level = n;
    } else {
      break;
    }
  }
  return level;
}

export function calculateTotalXP(
  completedWorkouts: CompletedWorkout[],
  exerciseLog: ExerciseLogEntry[],
): { totalXP: number; level: number } {
  if (completedWorkouts.length === 0) return { totalXP: 0, level: 0 };

  const sorted = [...completedWorkouts].sort((a, b) => a.date.localeCompare(b.date));
  let totalXP = 0;

  for (let i = 0; i < sorted.length; i++) {
    const workout = sorted[i];
    const allUpToNow = sorted.slice(0, i + 1);
    const xpGain = computeXP({ workout, exerciseLog, allWorkouts: allUpToNow });
    totalXP += xpGain.total;
  }

  return { totalXP, level: getLevelFromXP(totalXP) };
}

// ── PR Detection ──

export function parseWeightKg(raw: string): number | null {
  if (!raw || raw.trim() === '') return null;
  const normalized = raw.trim().toLowerCase();
  if (['bw', 'bodyweight', 'body weight', 'body', '-'].includes(normalized)) return null;
  const match = normalized.match(/^([\d.]+)\s*(kg|lbs?|lb)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (isNaN(value) || value <= 0) return null;
  const unit = match[2] ?? 'kg';
  if (unit === 'lbs' || unit === 'lb') {
    return Math.round(value * 0.453592 * 100) / 100;
  }
  return value;
}

export function detectPR(
  entry: { exerciseId: string; date: string; weight: string },
  existingPR: PersonalRecord | null
): PersonalRecord | null {
  const weightKg = parseWeightKg(entry.weight);
  if (weightKg === null) return null;
  if (existingPR !== null && weightKg <= existingPR.weightKg) return null;
  return {
    exerciseId: entry.exerciseId,
    weightKg,
    weightRaw: entry.weight,
    date: entry.date,
    improvementKg: existingPR ? Math.round((weightKg - existingPR.weightKg) * 100) / 100 : undefined,
  };
}

export function checkNewPRs(
  logEntries: ExerciseLogEntry[],
  currentPRs: PersonalRecord[]
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];
  const prMap = new Map(currentPRs.map(pr => [pr.exerciseId, pr]));
  for (const entry of logEntries) {
    const newPR = detectPR(entry, prMap.get(entry.exerciseId) ?? null);
    if (newPR) {
      newPRs.push(newPR);
      prMap.set(entry.exerciseId, newPR);
    }
  }
  return newPRs;
}

// ── Streak Freeze ──

export interface StreakFreezeState {
  freezeActive: boolean;
  tokensRemaining: number;
  streakProtected: boolean;
}

export function getStreakFreezeState(params: {
  todayStr: string;
  completedDates: Set<string>;
  freezeTokens: number;
}): StreakFreezeState {
  const { todayStr, completedDates, freezeTokens } = params;
  const todayDone = completedDates.has(todayStr);
  if (todayDone) {
    return { freezeActive: false, tokensRemaining: freezeTokens, streakProtected: false };
  }

  const yesterday = new Date(todayStr + 'T00:00:00Z');
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const yesterdayDone = completedDates.has(yesterdayStr);

  if (!yesterdayDone || freezeTokens <= 0) {
    return { freezeActive: false, tokensRemaining: freezeTokens, streakProtected: false };
  }

  return {
    freezeActive: true,
    tokensRemaining: freezeTokens - 1,
    streakProtected: true,
  };
}
