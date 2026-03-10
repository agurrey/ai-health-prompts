import type { CompletedWorkout, ExerciseLogEntry } from '@/lib/storage';

// ── Types ──

export interface Achievement {
  id: string;
  name: string;
  name_es: string;
  description: string;
  description_es: string;
  icon: string;
  xpReward: number;
}

export interface AchievementCheckParams {
  completedWorkouts: CompletedWorkout[];
  exerciseLog: ExerciseLogEntry[];
  unlockedIds: string[];
  currentStreak: number;
  totalPRs: number;
  xpLevel: number;
  workoutsWithLogs: number;
  completedAt?: number;
  isAdapted?: boolean;
}

// ── Constants ──

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-sweat',
    name: 'First Sweat',
    name_es: 'Primer Sudor',
    description: 'Complete your first workout.',
    description_es: 'Completa tu primer entrenamiento.',
    icon: '🔥',
    xpReward: 0,
  },
  {
    id: 'three-peat',
    name: 'Three-Peat',
    name_es: 'Triple Golpe',
    description: 'Complete 3 workouts.',
    description_es: 'Completa 3 entrenamientos.',
    icon: '⚡',
    xpReward: 0,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    name_es: 'Guerrero Semanal',
    description: 'Complete 7 workouts total.',
    description_es: 'Completa 7 entrenamientos en total.',
    icon: '🗓️',
    xpReward: 0,
  },
  {
    id: 'iron-habit',
    name: 'Iron Habit',
    name_es: 'Hábito de Hierro',
    description: 'Maintain a 14-day workout streak.',
    description_es: 'Mantén una racha de 14 días consecutivos.',
    icon: '🔗',
    xpReward: 0,
  },
  {
    id: 'unbreakable',
    name: 'Unbreakable',
    name_es: 'Inquebrantable',
    description: 'Maintain a 30-day workout streak.',
    description_es: 'Mantén una racha de 30 días consecutivos.',
    icon: '💎',
    xpReward: 0,
  },
  {
    id: 'full-cycle',
    name: 'Full Cycle',
    name_es: 'Ciclo Completo',
    description: 'Complete one full 28-day mesocycle without missing a day.',
    description_es: 'Completa un mesociclo completo de 28 días sin fallar ninguno.',
    icon: '♻️',
    xpReward: 0,
  },
  {
    id: 'pr-hunter',
    name: 'PR Hunter',
    name_es: 'Cazador de PRs',
    description: 'Set 5 personal records.',
    description_es: 'Establece 5 récords personales.',
    icon: '🏆',
    xpReward: 0,
  },
  {
    id: 'log-keeper',
    name: 'Log Keeper',
    name_es: 'Guardián del Log',
    description: 'Log weights in 10 different workouts.',
    description_es: 'Registra pesos en 10 entrenamientos distintos.',
    icon: '📋',
    xpReward: 0,
  },
  {
    id: 'all-patterns',
    name: 'All Patterns',
    name_es: 'Todos los Patrones',
    description: 'Complete 4 workouts in a single calendar week (Mon–Sun).',
    description_es: 'Completa 4 entrenamientos en una misma semana (lun–dom).',
    icon: '🎯',
    xpReward: 0,
  },
  {
    id: 'level-up',
    name: 'Level Up',
    name_es: 'Subir de Nivel',
    description: 'Reach XP level 5.',
    description_es: 'Alcanza el nivel 5 de XP.',
    icon: '⬆️',
    xpReward: 0,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    name_es: 'Centurión',
    description: 'Complete 100 workouts total.',
    description_es: 'Completa 100 entrenamientos en total.',
    icon: '💯',
    xpReward: 0,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    name_es: 'Madrugador',
    description: 'Complete a workout before 08:00.',
    description_es: 'Completa un entrenamiento antes de las 08:00.',
    icon: '🌅',
    xpReward: 0,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    name_es: 'Noctámbulo',
    description: 'Complete a workout after 22:00.',
    description_es: 'Completa un entrenamiento después de las 22:00.',
    icon: '🦉',
    xpReward: 0,
  },
  {
    id: 'adaptor',
    name: 'Adaptor',
    name_es: 'Adaptador',
    description: 'Complete a workout using the Adapt panel.',
    description_es: 'Completa un entrenamiento usando el panel de Adaptación.',
    icon: '🔧',
    xpReward: 0,
  },
  {
    id: 'community',
    name: 'Community',
    name_es: 'Comunidad',
    description: 'Join the Hormesis community. (Coming soon)',
    description_es: 'Únete a la comunidad Hormesis. (Próximamente)',
    icon: '🌍',
    xpReward: 0,
  },
];

// ── Helpers ──

/**
 * Count distinct workout dates that have at least one exercise log entry with a non-empty weight.
 */
export function getWorkoutsWithLogs(
  completedWorkouts: CompletedWorkout[],
  exerciseLog: ExerciseLogEntry[],
): number {
  const datesWithLogs = new Set(
    exerciseLog
      .filter(e => e.weight !== '')
      .map(e => e.date),
  );
  return completedWorkouts.filter(w => datesWithLogs.has(w.date)).length;
}

/**
 * Return the ISO week start (Monday) for a given date string 'YYYY-MM-DD'.
 * Returns a string key representing the week.
 */
function getMonWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/**
 * Check if any calendar week (Mon–Sun) contains >= 4 completed workouts.
 */
function hasWeekWithFourWorkouts(completedWorkouts: CompletedWorkout[]): boolean {
  const weekCounts: Record<string, number> = {};
  for (const w of completedWorkouts) {
    const key = getMonWeekKey(w.date);
    weekCounts[key] = (weekCounts[key] ?? 0) + 1;
  }
  return Object.values(weekCounts).some(count => count >= 4);
}

// ── Public API ──

/**
 * Returns IDs of achievements newly unlocked given the current state.
 * Never returns IDs already present in unlockedIds.
 * community is never unlockable in Phase 1.
 */
export function checkAchievements(params: AchievementCheckParams): string[] {
  const {
    completedWorkouts,
    unlockedIds,
    currentStreak,
    totalPRs,
    xpLevel,
    workoutsWithLogs,
    completedAt,
    isAdapted,
  } = params;

  const total = completedWorkouts.length;
  const candidates: string[] = [];

  // first-sweat: 1 workout
  if (total >= 1) candidates.push('first-sweat');

  // three-peat: 3 workouts
  if (total >= 3) candidates.push('three-peat');

  // week-warrior: 7 workouts total
  if (total >= 7) candidates.push('week-warrior');

  // iron-habit: 14-day streak
  if (currentStreak >= 14) candidates.push('iron-habit');

  // unbreakable: 30-day streak
  if (currentStreak >= 30) candidates.push('unbreakable');

  // full-cycle: >= 28 workouts in the last 28 calendar days
  if (total >= 28) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - 27);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const count = completedWorkouts.filter(w => w.date >= cutoffStr).length;
    if (count >= 28) candidates.push('full-cycle');
  }

  // pr-hunter: 5 PRs
  if (totalPRs >= 5) candidates.push('pr-hunter');

  // log-keeper: logged weights in 10 workouts
  if (workoutsWithLogs >= 10) candidates.push('log-keeper');

  // all-patterns: 4 workouts in any single Mon–Sun week
  if (total >= 4 && hasWeekWithFourWorkouts(completedWorkouts)) {
    candidates.push('all-patterns');
  }

  // level-up: XP level 5
  if (xpLevel >= 5) candidates.push('level-up');

  // centurion: 100 workouts
  if (total >= 100) candidates.push('centurion');

  // early-bird: workout completed before 08:00 local time
  if (completedAt !== undefined) {
    const hour = new Date(completedAt).getHours();
    if (hour < 8) candidates.push('early-bird');
    if (hour >= 22) candidates.push('night-owl');
  }

  // adaptor: workout with adapt panel
  if (isAdapted === true) candidates.push('adaptor');

  // community: never unlockable in Phase 1

  const newlyUnlocked = candidates.filter(id => !unlockedIds.includes(id));
  return newlyUnlocked;
}
