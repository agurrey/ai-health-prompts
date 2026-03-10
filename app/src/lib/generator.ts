import {
  Exercise,
  Equipment,
  Restriction,
  Pattern,
  Level,
  exercises,
  getExercisesByPattern,
  filterByLevel,
  filterByRestrictions,
} from '@/data/exercises';
import { warmupExercises, WarmupExercise } from '@/data/warmup-exercises';
import {
  WodFormat,
  WodMovement,
  getWodMovements,
  getWodFormats,
  filterWodMovementsByRestrictions,
} from '@/data/wod-formats';
import { getRestrictionMap } from '@/data/restrictions';
import { createSeededRandom, seededShuffle, seededPick, getDayOfWeek } from './seed';

// ── Periodization: 4-week mesocycle ──

export type WeekPhase = 'accumulation' | 'intensification' | 'mixed' | 'realization';

export interface PhaseInfo {
  phase: WeekPhase;
  weekNumber: number; // 1-4
  dayInWeek: number; // 1-7 (Mon-Sun)
  label: string;
  label_es: string;
  description: string;
  description_es: string;
}

const PHASE_EPOCH = new Date('2024-01-01T00:00:00Z').getTime(); // Monday ref

export function getWeekPhase(date: string): PhaseInfo {
  const current = new Date(date + 'T12:00:00Z').getTime();
  const daysDiff = Math.floor((current - PHASE_EPOCH) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(daysDiff / 7);
  const cycleWeek = ((weekNum % 4) + 4) % 4; // handle negative dates
  const dayInWeek = ((daysDiff % 7) + 7) % 7 + 1; // 1-7 (Mon=1, Sun=7)

  switch (cycleWeek) {
    case 0:
      return {
        phase: 'accumulation',
        weekNumber: 1,
        dayInWeek,
        label: 'Week 1/4 — Accumulation',
        label_es: 'Semana 1/4 — Acumulacion',
        description: 'Build your base. Higher reps, moderate loads, longer conditioning. Volume is king this week.',
        description_es: 'Construye tu base. Mas reps, cargas moderadas, acondicionamiento largo. El volumen manda esta semana.',
      };
    case 1:
      return {
        phase: 'intensification',
        weekNumber: 2,
        dayInWeek,
        label: 'Week 2/4 — Intensification',
        label_es: 'Semana 2/4 — Intensificacion',
        description: 'Get strong. Heavier loads, fewer reps, full rest. Short, intense WODs.',
        description_es: 'Hazte fuerte. Cargas pesadas, pocas reps, descanso completo. WODs cortos e intensos.',
      };
    case 2:
      return {
        phase: 'mixed',
        weekNumber: 3,
        dayInWeek,
        label: 'Week 3/4 — Conditioning',
        label_es: 'Semana 3/4 — Acondicionamiento',
        description: 'Sweat. Lighter strength, faster pace, maximum conditioning variety. Your joints recover while your engine grows.',
        description_es: 'Suda. Fuerza ligera, ritmo rapido, maxima variedad de acondicionamiento. Tus articulaciones descansan mientras tu motor crece.',
      };
    case 3:
      return {
        phase: 'realization',
        weekNumber: 4,
        dayInWeek,
        label: 'Week 4/4 — Realization',
        label_es: 'Semana 4/4 — Realizacion',
        description: 'Show what you\'ve built. Heavy strength, benchmark WODs. Test yourself.',
        description_es: 'Demuestra lo que has construido. Fuerza pesada, WODs de referencia. Ponte a prueba.',
      };
    default:
      return { phase: 'accumulation', weekNumber: 1, dayInWeek, label: 'Week 1/4', label_es: 'Semana 1/4', description: '', description_es: '' };
  }
}

// ── Block format (warmup) ──

export interface BlockFormat {
  name: string;
  name_es: string;
  detail: string;
  detail_es: string;
}

// ── Session types ──

export interface SelectedWarmupExercise {
  exercise: WarmupExercise;
}

export interface WarmupBlock {
  format: BlockFormat;
  exercises: SelectedWarmupExercise[];
}

export interface SelectedStrengthExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  load: string;
  rest: string;
  tempo?: string;
  protocol: string;
  protocol_es: string;
  protocolNote: string;
  protocolNote_es: string;
  estimatedMinutes: number;
}

export interface SelectedConditioningMovement {
  name: string;
  reps: string;
  load: string;
  demoSearch: string;
  demoChannel: string;
}

export interface ConditioningBlock {
  formatName: string;
  formatName_es: string;
  formatType: string;
  formatDescription: string;
  formatDescription_es: string;
  movements: SelectedConditioningMovement[];
  timecap: string;
  note: string;
  note_es: string;
  scalingNote: string;
  scalingNote_es: string;
  intensity: string;
  intensity_es: string;
  volume: string;
  volume_es: string;
}

export interface Session {
  date: string;
  dayName: string;
  dayName_es: string;
  sessionType: string;
  sessionType_es: string;
  strategy: string;
  strategy_es: string;
  duration: number;
  phase: PhaseInfo;
  warmup: WarmupBlock;
  strength: SelectedStrengthExercise[];
  conditioning: ConditioningBlock;
}

// ── Warmup formats ──

const WARMUP_FORMATS: BlockFormat[] = [
  {
    name: '2 Rounds For Quality',
    name_es: '2 Rondas Por Calidad',
    detail: 'Not for time — move well, feel each position',
    detail_es: 'Sin tiempo — muevete bien, siente cada posicion',
  },
  {
    name: 'EMOM 5 min',
    name_es: 'EMOM 5 min',
    detail: 'EMOM = Every Minute On the Minute. Do 1 exercise per minute, rest the remaining seconds',
    detail_es: 'EMOM = Cada Minuto Al Minuto. Haz 1 ejercicio por minuto, descansa los segundos restantes',
  },
  {
    name: 'AMRAP 4 min (easy pace)',
    name_es: 'AMRAP 4 min (ritmo suave)',
    detail: 'AMRAP = As Many Rounds As Possible. Cycle through all exercises — easy pace, prepare your body',
    detail_es: 'AMRAP = Tantas Rondas Como Puedas. Cicla por todos los ejercicios — ritmo suave, prepara tu cuerpo',
  },
  {
    name: '3 Rounds Flow',
    name_es: '3 Rondas Flujo',
    detail: 'Flow between exercises without stopping — continuous movement for 3 rounds',
    detail_es: 'Fluye entre ejercicios sin parar — movimiento continuo durante 3 rondas',
  },
  {
    name: 'For Time (light)',
    name_es: 'Por Tiempo (ligero)',
    detail: 'Complete all exercises once, moderate pace — not a sprint',
    detail_es: 'Completa todos los ejercicios una vez, ritmo moderado — no es un sprint',
  },
  {
    name: 'Tabata 4 min (activation)',
    name_es: 'Tabata 4 min (activacion)',
    detail: 'Tabata = 20s work / 10s rest x 8 rounds. Alternate 2 exercises to build heat',
    detail_es: 'Tabata = 20s trabajo / 10s descanso x 8 rondas. Alterna 2 ejercicios para entrar en calor',
  },
];

// ── Session templates — 7 days, no rest ──

interface SessionTemplate {
  type: string;
  type_es: string;
  strengthPatterns: Pattern[];
  wodSize: 'standard' | 'big';
  strategy: string;
  strategy_es: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const SESSION_TEMPLATES: Record<number, SessionTemplate> = {
  0: {
    type: 'Active Full Body',
    type_es: 'Cuerpo Completo Activo',
    strengthPatterns: ['squat', 'push', 'pull'],
    wodSize: 'standard',
    strategy: 'Sunday: move well, lighter loads. Recovery happens between sessions, not instead of them. Still train.',
    strategy_es: 'Domingo: muevete bien, cargas ligeras. La recuperacion pasa entre sesiones, no en vez de ellas. Sigue entrenando.',
  },
  1: {
    type: 'Lower + Push',
    type_es: 'Tren Inferior + Empuje',
    strengthPatterns: ['squat', 'hinge', 'push', 'carry'],
    wodSize: 'standard',
    strategy: 'Start the week strong. Brace before every squat and hinge rep. Control the weight down — tempo matters more than speed.',
    strategy_es: 'Empieza la semana fuerte. Bracing antes de cada rep de sentadilla y bisagra. Controla el peso en la bajada — el tempo importa mas que la velocidad.',
  },
  2: {
    type: 'Upper Pull Focus',
    type_es: 'Tren Superior + Tiron',
    strengthPatterns: ['push', 'pull', 'pull', 'carry'],
    wodSize: 'standard',
    strategy: 'Pull day: squeeze shoulder blades on every row. Presses at 45 degrees, not 90.',
    strategy_es: 'Dia de tiron: aprieta escapulas en cada remo. Press a 45 grados, no 90.',
  },
  3: {
    type: 'Full Body',
    type_es: 'Cuerpo Completo',
    strengthPatterns: ['squat', 'hinge', 'push', 'pull', 'carry'],
    wodSize: 'standard',
    strategy: 'Mid-week full body. One exercise per pattern, keep it crisp. If anything feels off, lighten up.',
    strategy_es: 'Cuerpo completo de mitad de semana. Un ejercicio por patron, mantenlo limpio. Si algo no se siente bien, baja el peso.',
  },
  4: {
    type: 'Lower + Pull',
    type_es: 'Tren Inferior + Tiron',
    strengthPatterns: ['hinge', 'squat', 'pull', 'carry'],
    wodSize: 'standard',
    strategy: 'Second lower day. If legs are sore from Monday, use lighter variations or add tempo.',
    strategy_es: 'Segundo dia de pierna. Si las piernas estan cargadas del lunes, usa variaciones mas ligeras o anade tempo.',
  },
  5: {
    type: 'Upper Push Focus',
    type_es: 'Tren Superior + Empuje',
    strengthPatterns: ['push', 'pull', 'push', 'carry'],
    wodSize: 'standard',
    strategy: 'End-of-week upper session. Push rows hard — back handles high volume. Keep presses strict, no arching.',
    strategy_es: 'Sesion de tren superior de fin de semana. Empuja fuerte en los remos — la espalda tolera alto volumen. Press estrictos, sin arquear.',
  },
  6: {
    type: 'Conditioning Day',
    type_es: 'Dia de Acondicionamiento',
    strengthPatterns: ['squat', 'hinge', 'push', 'pull'],
    wodSize: 'big',
    strategy: 'Saturday conditioning: keep moving, shorter rest. Work capacity over max strength. Breathe, maintain form when tired.',
    strategy_es: 'Acondicionamiento del sabado: sigue moviendote, menos descanso. Capacidad de trabajo, no fuerza maxima. Respira, mantiene la forma cuando te canses.',
  },
};

// ── Strength protocols ──

interface StrengthProtocol {
  id: string;
  name: string;
  name_es: string;
  sets: number;
  reps: string;
  rest: string;
  tempo?: string;
  note: string;
  note_es: string;
  compatibleLoads: Array<'heavy' | 'light' | 'bodyweight'>;
  estimatedMinutes: number;
}

const STRENGTH_PROTOCOLS: StrengthProtocol[] = [
  {
    id: 'heavy-rir1',
    name: 'Heavy — RIR 1',
    name_es: 'Pesado — RIR 1',
    sets: 5,
    reps: '5-6',
    rest: '120s',
    note: 'RIR 1 = stop 1 rep before failure. Heavy load, full rest between sets.',
    note_es: 'RIR 1 = para 1 rep antes del fallo. Carga pesada, descanso completo.',
    compatibleLoads: ['heavy'],
    estimatedMinutes: 12,
  },
  {
    id: 'hypertrophy',
    name: 'Hypertrophy — RIR 2',
    name_es: 'Hipertrofia — RIR 2',
    sets: 4,
    reps: '10-12',
    rest: '60-90s',
    note: 'RIR 2 = 2 reps short of failure. Squeeze hard at the top of each rep.',
    note_es: 'RIR 2 = 2 reps antes del fallo. Aprieta fuerte arriba de cada rep.',
    compatibleLoads: ['heavy', 'light'],
    estimatedMinutes: 8,
  },
  {
    id: 'strength-endurance',
    name: 'Strength-Endurance',
    name_es: 'Fuerza-Resistencia',
    sets: 3,
    reps: '15-20',
    rest: '45s',
    note: 'High reps, short rest. The burn is the stimulus — keep moving.',
    note_es: 'Muchas reps, poco descanso. El ardor es el estimulo — sigue moviendo.',
    compatibleLoads: ['heavy', 'light', 'bodyweight'],
    estimatedMinutes: 5,
  },
  {
    id: 'tempo',
    name: 'Tempo 3-1-2',
    name_es: 'Tempo 3-1-2',
    sets: 4,
    reps: '8',
    rest: '90s',
    tempo: '3-1-2',
    note: '3s down, 1s pause at bottom, 2s up. Time under tension builds strength and control.',
    note_es: '3s bajada, 1s pausa abajo, 2s subida. Tiempo bajo tension construye fuerza y control.',
    compatibleLoads: ['heavy', 'light'],
    estimatedMinutes: 9,
  },
  {
    id: 'to-failure',
    name: 'To Failure',
    name_es: 'Al Fallo',
    sets: 3,
    reps: 'max',
    rest: '120s',
    note: 'Go until form breaks — not ego, form. Full rest between sets.',
    note_es: 'Ve hasta que la tecnica se rompa — no el ego, la tecnica. Descanso completo.',
    compatibleLoads: ['heavy', 'light', 'bodyweight'],
    estimatedMinutes: 8,
  },
  {
    id: 'myo-reps',
    name: 'Myo-Reps',
    name_es: 'Myo-Reps',
    sets: 5,
    reps: '12-15 + 4x3-5',
    rest: '15s between myo-sets, 120s between rounds',
    note: 'Myo-Reps: 1 set of 12-15 reps near failure, then 15s rest, 3-5 reps, repeat 4 times. Maximum stimulus, minimum time.',
    note_es: 'Myo-Reps: 1 serie de 12-15 reps cerca del fallo, luego 15s descanso, 3-5 reps, repite 4 veces. Maximo estimulo, minimo tiempo.',
    compatibleLoads: ['heavy', 'light', 'bodyweight'],
    estimatedMinutes: 7,
  },
  {
    id: 'rest-pause',
    name: 'Rest-Pause',
    name_es: 'Rest-Pause',
    sets: 3,
    reps: '8 + max + max',
    rest: '15s intra-set, 120s between',
    note: 'Rest-Pause: 8 reps near failure, 15s rest, max reps, 15s rest, max reps. Brutal intensity amplifier.',
    note_es: 'Rest-Pause: 8 reps cerca del fallo, 15s descanso, max reps, 15s descanso, max reps. Amplificador de intensidad brutal.',
    compatibleLoads: ['heavy', 'light'],
    estimatedMinutes: 8,
  },
  {
    id: 'mechanical-drop-set',
    name: 'Mechanical Drop Set',
    name_es: 'Mechanical Drop Set',
    sets: 3,
    reps: 'to failure x3 variations',
    rest: '90s between rounds',
    note: 'Mechanical Drop Set: 3 exercise variations, hardest to easiest, no rest between. Same pattern, maximum fatigue.',
    note_es: 'Mechanical Drop Set: 3 variaciones del ejercicio, de mas dificil a mas facil, sin descanso. Mismo patron, fatiga maxima.',
    compatibleLoads: ['heavy', 'light', 'bodyweight'],
    estimatedMinutes: 7,
  },
  {
    id: 'cluster-sets',
    name: 'Cluster Sets',
    name_es: 'Cluster Sets',
    sets: 4,
    reps: '2+2+2 (cluster)',
    rest: '20s intra-cluster, 120s between sets',
    note: 'Cluster Sets: 3 micro-sets of 2 reps with 20s rest between. Allows heavier loading per rep.',
    note_es: 'Cluster Sets: 3 micro-series de 2 reps con 20s descanso entre ellas. Permite mas carga por rep.',
    compatibleLoads: ['heavy'],
    estimatedMinutes: 10,
  },
  {
    id: 'wave-loading-531',
    name: 'Wave Loading 5-3-1',
    name_es: 'Wave Loading 5-3-1',
    sets: 6,
    reps: '5-3-1, 5-3-1',
    rest: '90s between sets',
    note: 'Wave Loading: 5 reps, 3 reps, 1 rep — repeat the wave. Neural drive, build to max effort.',
    note_es: 'Wave Loading: 5 reps, 3 reps, 1 rep — repite la onda. Drive neural, construye hasta esfuerzo maximo.',
    compatibleLoads: ['heavy'],
    estimatedMinutes: 12,
  },
];

// ── Constants ──

const DEFAULT_LEVEL: Level = 2;
const EXERCISE_LOOKBACK_DAYS = 4;
const WARMUP_DURATION_MIN = 5;

function filterByEquipment(exerciseList: Exercise[], equipment: Equipment[] | null): Exercise[] {
  if (!equipment) return exerciseList;
  const available = new Set<string>(['bodyweight', ...equipment]);
  let filtered = exerciseList.filter(e => e.equipment.every(eq => available.has(eq)));
  // Exercises like Pull-Up have equipment: ['bodyweight'] but contraindications: ['no_pullup_bar']
  const restrictions: Restriction[] = [];
  if (!equipment.includes('pull_up_bar')) restrictions.push('no_pullup_bar');
  if (restrictions.length > 0) filtered = filterByRestrictions(filtered, restrictions);
  return filtered;
}

export function getLoadLabel(exercise: Exercise): string {
  switch (exercise.load) {
    case 'heavy': return 'heavy DB';
    case 'light': return 'light DB';
    case 'bodyweight': return 'BW';
  }
}

function getCompatibleProtocols(loadType: string, phase: WeekPhase): StrengthProtocol[] {
  const loadCompatible = STRENGTH_PROTOCOLS.filter(p => p.compatibleLoads.includes(loadType as 'heavy' | 'light' | 'bodyweight'));

  const phasePreferred: Record<WeekPhase, string[]> = {
    accumulation: ['hypertrophy', 'strength-endurance', 'tempo', 'myo-reps'],
    intensification: ['heavy-rir1', 'wave-loading-531', 'cluster-sets', 'rest-pause'],
    mixed: ['strength-endurance', 'mechanical-drop-set', 'to-failure', 'tempo'],
    realization: ['heavy-rir1', 'wave-loading-531', 'cluster-sets', 'to-failure', 'rest-pause'],
  };

  const preferred = loadCompatible.filter(p => phasePreferred[phase].includes(p.id));
  return preferred.length > 0 ? preferred : loadCompatible;
}

function seededPickN<T>(arr: T[], n: number, random: () => number): T[] {
  const shuffled = seededShuffle(arr, random);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ── Intensity/volume helpers ──

function getWodIntensity(formatType: string): { en: string; es: string } {
  switch (formatType) {
    case 'tabata':
    case 'death_by':
    case 'single_movement':
      return { en: 'Very High', es: 'Muy Alta' };
    case 'rounds_for_time':
    case 'couplet':
    case 'double_wod':
    case 'fgb':
      return { en: 'High', es: 'Alta' };
    case 'amrap':
    case 'triplet':
    case 'buy_in_out':
    case 'chipper':
    case 'ladder':
    case 'pyramid':
      return { en: 'Moderate-High', es: 'Moderada-Alta' };
    case 'emom':
    case 'interval':
    case 'e2mom':
    case 'e3mom':
      return { en: 'Moderate', es: 'Moderada' };
    default:
      return { en: 'Moderate', es: 'Moderada' };
  }
}

function getWodVolume(format: WodFormat, movementCount: number): { en: string; es: string } {
  const timecapMin = parseInt(format.timecap) || 10;
  const scaling = format.scaling['intermediate'] || format.scaling['advanced'] || format.scaling['beginner'];
  const rounds = scaling?.rounds || 3;

  const totalWork = timecapMin * movementCount;

  if (totalWork >= 60 || timecapMin >= 20) {
    return { en: 'High Volume', es: 'Alto Volumen' };
  } else if (totalWork >= 30 || rounds >= 4) {
    return { en: 'Moderate Volume', es: 'Volumen Moderado' };
  } else {
    return { en: 'Low Volume', es: 'Bajo Volumen' };
  }
}

// ── Recent exercise tracking ──

function getUsedExerciseIds(date: string, level: Level = DEFAULT_LEVEL, equipment: Equipment[] | null = null, restrictions: Restriction[] = []): Set<string> {
  const dayOfWeek = getDayOfWeek(date);
  const template = SESSION_TEMPLATES[dayOfWeek];
  const seedStr = date + (restrictions.length > 0 ? '-' + [...restrictions].sort().join(',') : '');
  const random = createSeededRandom(seedStr);
  const ids = new Set<string>();

  for (const pattern of template.strengthPatterns) {
    let pool = getExercisesByPattern(pattern);
    pool = filterByLevel(pool, level);
    pool = filterByEquipment(pool, equipment);
    if (restrictions.length > 0) pool = filterByRestrictions(pool, restrictions);
    pool = pool.filter(e => !ids.has(e.id));
    if (pool.length === 0) continue;
    const shuffled = seededShuffle(pool, random);
    ids.add(shuffled[0].id);
  }
  return ids;
}

function getPreviousDate(date: string, daysBack: number): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().split('T')[0];
}

// ── Warmup generator ──

function generateWarmup(
  todaysPatterns: Pattern[],
  random: () => number,
  level: Level = DEFAULT_LEVEL,
  restrictions: Restriction[] = [],
): WarmupBlock {
  const exercises: SelectedWarmupExercise[] = [];
  const usedIds = new Set<string>();

  function pickFromPhase(phase: string, targetPatterns: Pattern[] | null, count: number) {
    let pool = warmupExercises
      .filter(e => e.phase === phase)
      .filter(e => e.level <= level)
      .filter(e => !usedIds.has(e.id));

    if (restrictions.length > 0) {
      pool = pool.filter(e => {
        if (!e.contraindications) return true;
        return !e.contraindications.some(c => (restrictions as string[]).includes(c));
      });
    }

    if (targetPatterns && targetPatterns.length > 0) {
      const targeted = pool.filter(e => e.targets.some(t => targetPatterns.includes(t)));
      if (targeted.length > 0) pool = targeted;
    }

    const picked = seededPickN(pool, count, random);
    for (const p of picked) {
      usedIds.add(p.id);
      exercises.push({ exercise: p });
    }
  }

  pickFromPhase('raise', null, 1);

  const isLower = todaysPatterns.some(p => p === 'squat' || p === 'hinge');
  const isUpper = todaysPatterns.some(p => p === 'push' || p === 'pull');
  const mobilizeTargets = isLower && isUpper ? todaysPatterns : isLower ? ['squat', 'hinge'] as Pattern[] : ['push', 'pull'] as Pattern[];
  pickFromPhase('mobilize', mobilizeTargets, 2);

  const activateTargets = isLower && isUpper ? null : isLower ? ['squat', 'hinge'] as Pattern[] : ['push', 'pull'] as Pattern[];
  pickFromPhase('activate', activateTargets, 2);

  pickFromPhase('potentiate', todaysPatterns, 1);

  const format = seededPick(WARMUP_FORMATS, random);

  return { format, exercises };
}

// ── Strength generator ──

function generateStrength(
  date: string,
  patterns: Pattern[],
  random: () => number,
  level: Level = DEFAULT_LEVEL,
  phase: WeekPhase = 'accumulation',
  equipment: Equipment[] | null = null,
  restrictions: Restriction[] = [],
  shortMode: boolean = false,
): SelectedStrengthExercise[] {
  const usedIds = new Set<string>();

  const recentIds = new Set<string>();
  for (let d = 1; d <= EXERCISE_LOOKBACK_DAYS; d++) {
    const prevDate = getPreviousDate(date, d);
    for (const id of getUsedExerciseIds(prevDate, level, equipment, restrictions)) {
      recentIds.add(id);
    }
  }

  // Apply pattern substitutions from restrictions (e.g. knee_pain: reduce squat, increase hinge)
  let effectivePatterns = [...patterns];
  if (restrictions.length > 0) {
    for (const r of restrictions) {
      const map = getRestrictionMap(r);
      if (!map) continue;
      for (const sub of map.patternSubstitutions) {
        const reduced: Pattern[] = [];
        for (const p of effectivePatterns) {
          if (p === sub.reducePattern && random() < sub.volumeReduction) {
            // Replace reduced pattern slot with the increase pattern
            reduced.push(sub.increasePattern);
          } else {
            reduced.push(p);
          }
        }
        effectivePatterns = reduced;
      }
    }
  }

  // Build recommended exercise IDs from restriction maps
  const recommendedIds = new Set<string>();
  if (restrictions.length > 0) {
    for (const r of restrictions) {
      const map = getRestrictionMap(r);
      if (map) map.recommendedExerciseIds.forEach(id => recommendedIds.add(id));
    }
  }

  const strength: SelectedStrengthExercise[] = [];
  const usedProtocolIds = new Set<string>();

  for (const pattern of effectivePatterns) {
    let pool = getExercisesByPattern(pattern);
    pool = filterByLevel(pool, level);
    pool = filterByEquipment(pool, equipment);
    if (restrictions.length > 0) pool = filterByRestrictions(pool, restrictions);
    pool = pool.filter(e => !usedIds.has(e.id));

    const fresh = pool.filter(e => !recentIds.has(e.id));
    if (fresh.length > 0) pool = fresh;
    if (pool.length === 0) continue;

    // Prioritize recommended exercises when restrictions active
    if (recommendedIds.size > 0) {
      const recommended = pool.filter(e => recommendedIds.has(e.id));
      const others = pool.filter(e => !recommendedIds.has(e.id));
      pool = [...seededShuffle(recommended, random), ...seededShuffle(others, random)];
    } else {
      pool = seededShuffle(pool, random);
    }
    const picked = pool[0];
    usedIds.add(picked.id);

    // Pick a protocol compatible with this exercise's load type and phase, avoiding repeats
    const compatible = getCompatibleProtocols(picked.load, phase);
    const freshProtocols = compatible.filter(p => !usedProtocolIds.has(p.id));
    const protocol = seededPick(freshProtocols.length > 0 ? freshProtocols : compatible, random);
    usedProtocolIds.add(protocol.id);

    const sets = shortMode ? Math.max(2, Math.floor(protocol.sets * 0.6)) : protocol.sets;

    strength.push({
      exercise: picked,
      sets,
      reps: protocol.reps,
      load: getLoadLabel(picked),
      rest: protocol.rest,
      tempo: protocol.tempo,
      protocol: protocol.name,
      protocol_es: protocol.name_es,
      protocolNote: protocol.note,
      protocolNote_es: protocol.note_es,
      estimatedMinutes: shortMode ? Math.max(3, Math.floor(protocol.estimatedMinutes * 0.6)) : protocol.estimatedMinutes,
    });
  }

  return strength;
}

// ── WOD generator ──

function levelToUserLevel(level: Level): 'beginner' | 'intermediate' | 'advanced' {
  switch (level) {
    case 1: return 'beginner';
    case 2: return 'intermediate';
    case 3: return 'advanced';
  }
}

function generateWod(
  isBig: boolean,
  random: () => number,
  level: Level = DEFAULT_LEVEL,
  phase: WeekPhase = 'accumulation',
  equipment: Equipment[] | null = null,
  restrictions: Restriction[] = [],
  shortMode: boolean = false,
): ConditioningBlock {
  const effectiveBig = shortMode ? false : isBig;
  const userLevel = levelToUserLevel(level);
  const formats = getWodFormats(userLevel);

  // Phase-based format filtering
  const phaseFormatPrefs: Record<WeekPhase, { prefer: string[]; avoid: string[]; minTimecap?: number; maxTimecap?: number }> = {
    accumulation: {
      prefer: ['amrap', 'chipper', 'buy_in_out', 'fgb', 'rounds_for_time', 'triplet'],
      avoid: ['tabata', 'death_by', 'single_movement'],
      minTimecap: 10,
    },
    intensification: {
      prefer: ['couplet', 'interval', 'emom', 'e2mom', 'e3mom', 'ladder', 'rounds_for_time'],
      avoid: ['chipper'],
      maxTimecap: 12,
    },
    mixed: {
      prefer: ['triplet', 'rounds_for_time', 'tabata', 'double_wod', 'pyramid', 'amrap', 'fgb'],
      avoid: [],
    },
    realization: {
      prefer: ['couplet', 'rounds_for_time', 'single_movement', 'death_by', 'ladder'],
      avoid: ['chipper', 'buy_in_out'],
    },
  };

  const prefs = phaseFormatPrefs[phase];
  let pool = effectiveBig ? formats.filter(f => parseInt(f.timecap) >= 12) : formats;

  // Short mode: cap timecap at 10 min
  if (shortMode) {
    pool = pool.filter(f => parseInt(f.timecap) <= 10);
  }

  // Apply phase preferences
  if (!effectiveBig) {
    let phaseFiltered = pool.filter(f => prefs.prefer.includes(f.type) && !prefs.avoid.includes(f.type));
    if (prefs.minTimecap) phaseFiltered = phaseFiltered.filter(f => parseInt(f.timecap) >= prefs.minTimecap!);
    if (prefs.maxTimecap || shortMode) {
      const cap = shortMode ? 10 : prefs.maxTimecap!;
      phaseFiltered = phaseFiltered.filter(f => parseInt(f.timecap) <= cap);
    }
    if (phaseFiltered.length > 0) pool = phaseFiltered;
  }

  const format = seededPick(pool.length > 0 ? pool : formats, random);
  let movementPool = getWodMovements(userLevel);
  if (equipment) {
    const available = new Set<string>(['bodyweight', ...equipment]);
    movementPool = movementPool.filter(m => !m.equipment || available.has(m.equipment));
  }
  if (restrictions.length > 0) {
    const filtered = filterWodMovementsByRestrictions(movementPool, restrictions);
    if (filtered.length > 0) movementPool = filtered;
  }
  const picked = seededPickN(movementPool, format.movements, random);
  const scaling = format.scaling[userLevel];

  const intensity = getWodIntensity(format.type);
  const volume = getWodVolume(format, picked.length);

  const timecapNum = parseInt(format.timecap);
  const effectiveTimecap = shortMode && timecapNum > 8 ? 8 : timecapNum;

  return {
    formatName: format.name,
    formatName_es: format.name_es,
    formatType: format.type,
    formatDescription: format.description,
    formatDescription_es: format.description_es,
    movements: picked.map(m => ({
      name: m.name,
      reps: scaling?.reps || m.reps,
      load: m.load === 'heavy' ? 'heavy DB' : m.load === 'light' ? 'light DB' : 'BW',
      demoSearch: m.demoSearch,
      demoChannel: m.demoChannel,
    })),
    timecap: effectiveTimecap + ' min',
    note: format.note,
    note_es: format.note_es,
    scalingNote: format.scalingNote || '',
    scalingNote_es: format.scalingNote_es || '',
    intensity: intensity.en,
    intensity_es: intensity.es,
    volume: volume.en,
    volume_es: volume.es,
  };
}

// ── Main entry point ──

export function generateSession(
  date: string,
  level: Level = DEFAULT_LEVEL,
  equipment: Equipment[] | null = null,
  restrictions: Restriction[] = [],
  shortMode: boolean = false,
): Session {
  const dayOfWeek = getDayOfWeek(date);
  const template = SESSION_TEMPLATES[dayOfWeek];
  const seedStr = date + (restrictions.length > 0 ? '-' + [...restrictions].sort().join(',') : '');
  const random = createSeededRandom(seedStr);
  const phase = getWeekPhase(date);

  const warmup = generateWarmup(template.strengthPatterns, random, level, restrictions);
  const strength = generateStrength(date, template.strengthPatterns, random, level, phase.phase, equipment, restrictions, shortMode);
  const conditioning = generateWod(template.wodSize === 'big', random, level, phase.phase, equipment, restrictions, shortMode);

  const warmupMin = WARMUP_DURATION_MIN;
  const strengthMin = strength.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  const condMin = parseInt(conditioning.timecap) || 10;
  const duration = warmupMin + strengthMin + condMin;

  return {
    date,
    dayName: DAY_NAMES[dayOfWeek],
    dayName_es: DAY_NAMES_ES[dayOfWeek],
    sessionType: template.type,
    sessionType_es: template.type_es,
    strategy: template.strategy,
    strategy_es: template.strategy_es,
    duration,
    phase,
    warmup,
    strength,
    conditioning,
  };
}
