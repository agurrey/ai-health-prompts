import { Exercise, exercises, Level, Equipment, Restriction } from '@/data/exercises';
import { WarmupExercise, warmupExercises } from '@/data/warmup-exercises';

export function getVariants(
  exercise: Exercise,
  currentLevel: Level,
  equipment: Equipment[] | null,
  restrictions: Restriction[],
  excludeIds: Set<string>,
  maxResults = 3
): Exercise[] {
  const restrictionSet = new Set(restrictions);

  return exercises
    .filter(e => {
      if (e.id === exercise.id || excludeIds.has(e.id)) return false;
      if (e.pattern !== exercise.pattern) return false;
      if (Math.abs(e.level - currentLevel) > 1) return false;
      if (equipment && !e.equipment.every(eq => equipment.includes(eq))) return false;
      if (e.contraindications?.some(c => restrictionSet.has(c as Restriction))) return false;
      return true;
    })
    .sort((a, b) => {
      const aLevelMatch = a.level === currentLevel ? 0 : 1;
      const bLevelMatch = b.level === currentLevel ? 0 : 1;
      if (aLevelMatch !== bLevelMatch) return aLevelMatch - bLevelMatch;
      const aLoadMatch = a.load === exercise.load ? 0 : 1;
      const bLoadMatch = b.load === exercise.load ? 0 : 1;
      return aLoadMatch - bLoadMatch;
    })
    .slice(0, maxResults);
}

export function getWarmupVariants(
  exercise: WarmupExercise,
  currentLevel: Level,
  restrictions: Restriction[],
  excludeIds: Set<string>,
  maxResults = 3
): WarmupExercise[] {
  const restrictionSet = new Set(restrictions);

  return warmupExercises
    .filter(e => {
      if (e.id === exercise.id || excludeIds.has(e.id)) return false;
      if (e.phase !== exercise.phase) return false;
      if (!e.targets.some(t => exercise.targets.includes(t))) return false;
      if (Math.abs(e.level - currentLevel) > 1) return false;
      if (e.contraindications?.some(c => restrictionSet.has(c as Restriction))) return false;
      return true;
    })
    .sort((a, b) => {
      const aLevelMatch = a.level === currentLevel ? 0 : 1;
      const bLevelMatch = b.level === currentLevel ? 0 : 1;
      return aLevelMatch - bLevelMatch;
    })
    .slice(0, maxResults);
}
